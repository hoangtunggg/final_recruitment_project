"""Independent evaluation of the previously generated 208 synthetic cases."""
import argparse
import json
import re
import statistics
import time
from collections import defaultdict
from pathlib import Path

import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix, ndcg_score
from scipy.stats import spearmanr
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.preprocessing.text import tokenizer_from_json

from model import AttentionPooling, GradedPairwiseLoss, PairFeatures, standardize
from text_chunks import select_sequences
from server import skill_evidence


def required_skills(row):
    if "required" in row:
        return row["required"]
    match = re.search(r"(?im)^Required:\s*(.*)$", row["jd"])
    return [part.strip() for part in match[1].split(",") if part.strip()] if match else []


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--dataset", required=True)
    p.add_argument("--artifacts", required=True)
    p.add_argument("--output", required=True)
    args = p.parse_args()
    t0 = time.perf_counter()
    model = tf.keras.models.load_model(Path(args.artifacts) / "matcher.keras", compile=False,
        custom_objects={"AttentionPooling": AttentionPooling, "PairFeatures": PairFeatures,
                        "GradedPairwiseLoss":GradedPairwiseLoss})
    tokenizer = tokenizer_from_json((Path(args.artifacts) / "tokenizer.json").read_text())
    metadata = json.loads((Path(args.artifacts) / "model_metadata.json").read_text())
    cv_length, jd_length = metadata["cv_length"], metadata["jd_length"]
    calibration_path = Path(args.artifacts) / "calibration.json"
    calibration = json.loads(calibration_path.read_text()) if calibration_path.exists() else {}
    neural_threshold = calibration.get("neural_threshold", calibration.get("threshold", .5))
    rule_threshold = calibration.get("rule_threshold", .5)
    hybrid_weight = calibration.get("hybrid_neural_weight", .7)
    hybrid_threshold = calibration.get("hybrid_threshold", .5)
    cold = time.perf_counter() - t0
    rows = [json.loads(line) for line in Path(args.dataset).open(encoding="utf-8")]
    results, latencies, skipped, coverage = [], [], [], []
    for index, row in enumerate(rows):
        row_id = row.get("id", row.get("source_id", str(index)))
        required = required_skills(row)
        t = time.perf_counter()
        try:
            cv_parts, cv_meta = select_sequences(row["cv"], tokenizer, cv_length, max_chunks=4, priority_terms=required)
            jd_parts, jd_meta = select_sequences(row["jd"], tokenizer, jd_length, max_chunks=3, priority_terms=required)
        except ValueError:
            skipped.append(row_id)
            continue
        pair_cv = [part for part in cv_parts for _ in jd_parts]
        pair_jd = [part for _ in cv_parts for part in jd_parts]
        preds = model.predict([pad_sequences(pair_cv, maxlen=cv_length, padding="post"),
            pad_sequences(pair_jd, maxlen=jd_length, padding="post")], verbose=0).ravel()
        score = float(np.mean(preds))
        matched = sum(skill_evidence(row["cv"], skill)["status"] == "matched" for skill in required)
        contradicted = sum(skill_evidence(row["cv"], skill)["status"] == "contradicted" for skill in required)
        skill_score = matched / len(required) if required else None
        rule = skill_score if skill_score is not None else 0.0
        hybrid = hybrid_weight * score + (1-hybrid_weight) * rule if skill_score is not None else score
        if contradicted:
            hybrid = 0.0
        latencies.append((time.perf_counter() - t)*1000)
        coverage.append({"id":row_id, "cv":cv_meta, "jd":jd_meta})
        results.append({"id":row_id, "scenario":row.get("scenario", row.get("label_kind", "unknown")),
            "language":row.get("language", "source_english"), "label":row["label"],
            "grade":row.get("grade", row["label"]), "rule_score":rule,
            "contradicted_requirements":contradicted,
            "score":score, "hybrid_score":hybrid, "role":row.get("role", row.get("jd_group", "unknown")),
            "required_count":len(required)})
    binary_labels = all(r["label"] in (0, 1) for r in results)
    y = [int(r["label"] >= (1 if binary_labels else 2)) for r in results]
    scores = [r["score"] for r in results]
    by_scenario = defaultdict(list)
    by_language = defaultdict(list)
    for row in results:
        by_scenario[row["scenario"]].append(row["score"])
        by_language[row["language"]].append(row["score"])
    ranks = []
    for role in sorted(set(r["role"] for r in results)):
        group = [r for r in results if r["role"] == role]
        ranks.append(float(ndcg_score([[r["grade"] for r in group]], [[r["score"] for r in group]])))
    pairwise = []
    for role in sorted(set(r["role"] for r in results)):
        group = [r for r in results if r["role"] == role]
        for i,left in enumerate(group):
            for right in group[i+1:]:
                if left["grade"] != right["grade"]:
                    pairwise.append((left["score"]-right["score"])*(left["grade"]-right["grade"]) > 0)
    latencies.sort()
    output = {"cases":len(results), "skipped":skipped, "artifact_load_seconds":cold,
        "label_threshold":1 if binary_labels else 2,
        "token_coverage_mean":statistics.mean((c["cv"]["selectedTokens"] + c["jd"]["selectedTokens"]) /
            max(1,c["cv"]["totalTokens"] + c["jd"]["totalTokens"]) for c in coverage),
        "long_cases": [c for c in coverage if c["cv"]["chunks"] > 1 or c["jd"]["chunks"] > 1],
        "calibration":calibration,
        "classification":classification_report(y, [int(s >= neural_threshold) for s in scores], output_dict=True, zero_division=0),
        "confusion_matrix":confusion_matrix(y, [int(s >= neural_threshold) for s in scores], labels=[0,1]).tolist(),
        "rule_classification":classification_report(y, [int(r["rule_score"] >= rule_threshold) for r in results], output_dict=True, zero_division=0),
        "hybrid_classification":classification_report(y, [int(r["hybrid_score"] >= hybrid_threshold) for r in results], output_dict=True, zero_division=0),
        "hybrid_confusion_matrix":confusion_matrix(y, [int(r["hybrid_score"] >= hybrid_threshold) for r in results], labels=[0,1]).tolist(),
        "spearman":float(spearmanr([r["grade"] for r in results],scores).statistic),
        "hybrid_spearman":float(spearmanr([r["grade"] for r in results],[r["hybrid_score"] for r in results]).statistic),
        "ndcg_mean_by_role":statistics.mean(ranks),
        "pairwise_ranking_accuracy":statistics.mean(pairwise) if pairwise else None,
        "p50_ms":latencies[len(latencies)//2], "p95_ms":latencies[int(.95*(len(latencies)-1))],
        "p99_ms":latencies[int(.99*(len(latencies)-1))],
        "scenario_means":{k:statistics.mean(v) for k,v in by_scenario.items()},
        "language_means":{k:statistics.mean(v) for k,v in by_language.items()}, "predictions":results}
    Path(args.output).write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k:v for k,v in output.items() if k not in ("predictions", "classification", "rule_classification", "hybrid_classification", "long_cases")}, indent=2))


if __name__ == "__main__":
    main()
