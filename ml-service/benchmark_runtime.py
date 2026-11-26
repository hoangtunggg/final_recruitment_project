"""Bounded offline CPU benchmark of one frozen artifact; no API or database writes."""
import argparse
import json
import os
import resource
import threading
import time
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.preprocessing.text import tokenizer_from_json

from model import AttentionPooling, GradedPairwiseLoss, PairFeatures
from text_chunks import select_sequences


class CapacityExceeded(Exception):
    pass


def rss_mb():
    return int(Path("/proc/self/statm").read_text().split()[1]) * os.sysconf("SC_PAGE_SIZE") / 1048576


def percentiles(values):
    ordered = sorted(values)
    return {key:round(ordered[int(frac * (len(ordered)-1))], 2)
            for key, frac in (("p50_ms", .5), ("p95_ms", .95), ("p99_ms", .99))}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--artifacts", required=True)
    p.add_argument("--dataset", required=True)
    p.add_argument("--output", required=True)
    p.add_argument("--cold-only", action="store_true", help="Exit after the first scored request")
    args = p.parse_args()
    tf.config.threading.set_inter_op_parallelism_threads(2)
    tf.config.threading.set_intra_op_parallelism_threads(2)
    started = time.perf_counter()
    usage = resource.getrusage(resource.RUSAGE_SELF)
    cpu_started = usage.ru_utime + usage.ru_stime
    model = tf.keras.models.load_model(Path(args.artifacts) / "matcher.keras", compile=False,
        custom_objects={"AttentionPooling": AttentionPooling, "PairFeatures": PairFeatures,
                        "GradedPairwiseLoss":GradedPairwiseLoss})
    tokenizer = tokenizer_from_json((Path(args.artifacts) / "tokenizer.json").read_text())
    metadata = json.loads((Path(args.artifacts) / "model_metadata.json").read_text())
    cv_length, jd_length = metadata["cv_length"], metadata["jd_length"]
    load_seconds = time.perf_counter() - started
    rows = [json.loads(line) for line in Path(args.dataset).open(encoding="utf-8")][:16]
    capacity = threading.BoundedSemaphore(2)
    queue = threading.BoundedSemaphore(8)

    def infer(row):
        t0 = time.perf_counter()
        cv, _ = select_sequences(row["cv"], tokenizer, cv_length, 4)
        jd, _ = select_sequences(row["jd"], tokenizer, jd_length, 3)
        a = pad_sequences([x for x in cv for _ in jd], maxlen=cv_length, padding="post")
        b = pad_sequences([x for _ in cv for x in jd], maxlen=jd_length, padding="post")
        if not queue.acquire(blocking=False):
            raise CapacityExceeded()
        wait_started = time.perf_counter()
        acquired = capacity.acquire(timeout=2)
        queue_wait_ms = (time.perf_counter() - wait_started) * 1000
        if not acquired:
            queue.release()
            raise CapacityExceeded()
        try:
            score = float(np.mean(model.predict([a,b], verbose=0)))
        finally:
            capacity.release()
            queue.release()
        return score, (time.perf_counter() - t0) * 1000, queue_wait_ms

    cold_score, cold_ms, _ = infer(rows[0])
    if args.cold_only:
        print(json.dumps({"model_load_seconds":load_seconds,
                          "first_inference_ms":cold_ms, "score":cold_score}))
        return
    results = []
    for workers in (1, 2, 4, 8):
        t0 = time.perf_counter()
        errors = []
        latency = []
        queue_wait = []
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = [pool.submit(infer, rows[i % len(rows)]) for i in range(16)]
            for future in futures:
                try:
                    _, ms, wait_ms = future.result()
                    latency.append(ms)
                    queue_wait.append(wait_ms)
                except Exception as exc:
                    errors.append(type(exc).__name__)
        elapsed = time.perf_counter() - t0
        results.append({"concurrency":workers, "requests":16, "success":len(latency),
                        "errors":dict(Counter(errors)), "throughput_rps":round(len(latency)/elapsed,2),
                        "queue_wait":percentiles(queue_wait) if queue_wait else {},
                        **(percentiles(latency) if latency else {})})
    elapsed_total = time.perf_counter() - started
    usage = resource.getrusage(resource.RUSAGE_SELF)
    cpu_elapsed = usage.ru_utime + usage.ru_stime - cpu_started
    result = {"model_load_seconds":load_seconds, "cold_first_inference_ms":cold_ms,
              "steady_rss_mb":rss_mb(), "peak_rss_mb":resource.getrusage(resource.RUSAGE_SELF).ru_maxrss/1024,
              "elapsed_seconds":round(elapsed_total, 2), "cpu_time_seconds":round(cpu_elapsed, 2),
              "cpu_percent_of_one_core":round(100 * cpu_elapsed / elapsed_total, 1),
              "results":results, "mode":"offline shared-model inference, not HTTP"}
    Path(args.output).write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
