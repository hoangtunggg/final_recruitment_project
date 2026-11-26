"""Train only on a separately licensed, traceable JSONL dataset.

Expected fields: cv, jd, label (0/1), cv_group, jd_group, source_id.
Groups sharing either CV or JD are kept in the same split.
"""
import argparse
import hashlib
import json
import random
import re
from collections import defaultdict
from pathlib import Path

import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, f1_score
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.preprocessing.text import Tokenizer

from model import build_model
from text_chunks import select_sequences


def load_rows(path):
    rows, seen = [], set()
    for line in Path(path).open(encoding="utf-8"):
        row = json.loads(line)
        if (not all(row.get(k) for k in ("cv", "jd", "cv_group", "jd_group", "source_id"))
            or row.get("label") not in (0, 1) or not 0 <= float(row.get("grade", row["label"])) <= 1):
            raise ValueError("Each row needs cv, jd, binary label, cv_group, jd_group and source_id")
        digest = hashlib.sha256((row["cv"] + "\0" + row["jd"]).encode()).hexdigest()
        if digest not in seen:
            seen.add(digest)
            rows.append(row)
    return rows


def grouped_split(rows, seed):
    # Connected components prevent the same CV or JD appearing in different splits.
    parent = list(range(len(rows)))
    def root(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i
    owners = {}
    for i, row in enumerate(rows):
        for key in ("cv:" + row["cv_group"], "jd:" + row["jd_group"]):
            if key in owners:
                parent[root(i)] = root(owners[key])
            else:
                owners[key] = i
    components = defaultdict(list)
    for i in range(len(rows)):
        components[root(i)].append(i)
    groups = list(components.values())
    random.Random(seed).shuffle(groups)
    if len(groups) < 10:
        raise ValueError("Need at least 10 independent CV/JD-connected groups")
    splits = [[], [], []]
    for index, group in enumerate(groups):
        splits[0 if index < int(.7*len(groups)) else 1 if index < int(.85*len(groups)) else 2].extend(group)
    return [[rows[i] for i in ids] for ids in splits]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True)
    parser.add_argument("--license-record", required=True, help="Path to documented dataset license and provenance")
    parser.add_argument("--output", required=True)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--min-pairs", type=int, default=1000)
    parser.add_argument("--cv-length", type=int, default=512)
    parser.add_argument("--jd-length", type=int, default=256)
    parser.add_argument("--embedding-dim", type=int, default=128)
    parser.add_argument("--gru-units", type=int, default=64)
    parser.add_argument("--dropout", type=float, default=0.3)
    parser.add_argument("--learning-rate", type=float, default=0.001)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--tokenizer", choices=("word", "character"), default="word")
    parser.add_argument("--balanced-classes", action="store_true")
    parser.add_argument("--objective", choices=("binary", "graded_pairwise"), default="binary")
    parser.add_argument("--ranking-weight", type=float, default=0.25)
    parser.add_argument("--evaluate-test", action="store_true", help="Use only after model selection is frozen")
    args = parser.parse_args()
    if not Path(args.license_record).is_file():
        raise ValueError("Documented dataset provenance/license is required")
    tf.keras.utils.set_random_seed(args.seed)
    tf.config.threading.set_inter_op_parallelism_threads(2)
    tf.config.threading.set_intra_op_parallelism_threads(2)
    rows = load_rows(args.data)
    if (len(rows) < args.min_pairs or args.min_pairs < 100 or not 1 <= args.epochs <= 30
        or not 64 <= args.cv_length <= 512 or not 64 <= args.jd_length <= 256
        or not 32 <= args.embedding_dim <= 128 or not 16 <= args.gru_units <= 64
        or not 0 <= args.dropout < 0.6 or not 0 < args.learning_rate <= .001
        or args.batch_size not in (16, 32) or not 0 <= args.ranking_weight <= 1):
        raise ValueError("Insufficient pairs or invalid bounded training parameters")
    train, val, test = grouped_split(rows, args.seed)
    tokenizer = Tokenizer(num_words=30000, oov_token="<OOV>", filters="",
                          char_level=args.tokenizer == "character")
    from model import standardize
    clean = lambda texts: [x.decode() for x in standardize(tf.constant(texts)).numpy()]
    tokenizer.fit_on_texts(clean([r[k] for r in train for k in ("cv", "jd")]))
    def encode(split):
        def requirements(row):
            for line in row["jd"].splitlines():
                if line.casefold().startswith("required:"):
                    return [part.strip() for part in line.split(":", 1)[1].split(",") if part.strip()]
            return []
        cv_seq, jd_seq = [], []
        for row in split:
            priority = requirements(row)
            cv_seq.append(select_sequences(row["cv"], tokenizer, args.cv_length,
                                           max_chunks=1, priority_terms=priority)[0][0])
            jd_seq.append(select_sequences(row["jd"], tokenizer, args.jd_length,
                                           max_chunks=1, priority_terms=priority)[0][0])
        cv = pad_sequences(cv_seq, maxlen=args.cv_length, padding="post")
        jd = pad_sequences(jd_seq, maxlen=args.jd_length, padding="post")
        if args.objective == "graded_pairwise":
            group_ids = {name:index for index,name in enumerate(sorted({r["jd_group"] for r in split}))}
            target = np.asarray([[float(r.get("grade", r["label"])), group_ids[r["jd_group"]]] for r in split], dtype="float32")
        else:
            target = np.asarray([r["label"] for r in split], dtype="float32")
        return [cv, jd], target
    if args.objective == "graded_pairwise":
        train.sort(key=lambda r:(r["jd_group"], r["source_id"]))
        val.sort(key=lambda r:(r["jd_group"], r["source_id"]))
        test.sort(key=lambda r:(r["jd_group"], r["source_id"]))
    x_train, y_train = encode(train)
    x_val, y_val = encode(val)
    x_test, y_test = encode(test)
    binary_targets = lambda y: y[:, 0] >= .6 if y.ndim == 2 else y
    if any(len(set(binary_targets(y))) < 2 for y in (y_train, y_val, y_test)):
        raise ValueError("Every split must contain positive and negative examples")
    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)
    model = build_model(cv_length=args.cv_length, jd_length=args.jd_length,
        embedding_dim=args.embedding_dim, gru_units=args.gru_units,
        dropout=args.dropout, learning_rate=args.learning_rate,
        objective=args.objective, ranking_weight=args.ranking_weight)
    class_weight = None
    if args.balanced_classes:
        if args.objective != "binary":
            raise ValueError("Class weights are only supported by the binary objective")
        counts = np.bincount(y_train.astype("int32"), minlength=2)
        class_weight = {i: len(y_train)/(2*count) for i,count in enumerate(counts)}
    history = model.fit(x_train, y_train, validation_data=(x_val, y_val), epochs=args.epochs,
              batch_size=args.batch_size, class_weight=class_weight,
              shuffle=args.objective == "binary",
              callbacks=[tf.keras.callbacks.EarlyStopping(monitor="val_loss", patience=3, restore_best_weights=True),
                         tf.keras.callbacks.ModelCheckpoint(out / "best_checkpoint.keras", monitor="val_loss", save_best_only=True)], verbose=2)
    val_pred = model.predict(x_val, batch_size=args.batch_size, verbose=0).ravel()
    val_binary = np.asarray([r["label"] for r in val])
    thresholds = np.arange(.20, .81, .02)
    threshold = float(max(thresholds, key=lambda t:f1_score(val_binary, val_pred >= t, average="macro")))
    val_metrics = classification_report(val_binary, val_pred >= threshold, output_dict=True, zero_division=0)
    from server import skill_evidence
    def rule_score(row):
        match = re.search(r"(?im)^Required:\s*(.*)$", row["jd"])
        skills = [part.strip() for part in match[1].split(",") if part.strip()] if match else []
        return (sum(skill_evidence(row["cv"], skill)["status"] == "matched" for skill in skills) / len(skills)
                if skills else 0.0)
    val_rule = np.asarray([rule_score(row) for row in val])
    rule_threshold = float(max(thresholds, key=lambda t:f1_score(val_binary, val_rule >= t, average="macro")))
    candidates = []
    for neural_weight in (0.0, .25, .5, .75, 1.0):
        combined = neural_weight * val_pred + (1-neural_weight) * val_rule
        for candidate_threshold in thresholds:
            candidates.append((f1_score(val_binary, combined >= candidate_threshold, average="macro"),
                               neural_weight, float(candidate_threshold)))
    hybrid_macro, hybrid_weight, hybrid_threshold = max(candidates, key=lambda item:(item[0], item[1]))
    ranking_pairs = []
    by_jd = defaultdict(list)
    for row,score in zip(val,val_pred):
        by_jd[row["jd_group"]].append((float(row.get("grade", row["label"])), float(score)))
    for group in by_jd.values():
        for index,left in enumerate(group):
            for right in group[index+1:]:
                if left[0] != right[0]:
                    ranking_pairs.append((left[0]-right[0])*(left[1]-right[1]) > 0)
    model.save(out / "matcher.keras")
    (out / "tokenizer.json").write_text(tokenizer.to_json(), encoding="utf-8")
    (out / "model_metadata.json").write_text(json.dumps({"architecture":"siamese_bigru_attention", "seed":args.seed, "epochs_limit":args.epochs, "embedding_dim":args.embedding_dim, "gru_units":args.gru_units, "dropout":args.dropout, "learning_rate":args.learning_rate, "batch_size":args.batch_size, "balanced_classes":args.balanced_classes, "objective":args.objective, "ranking_weight":args.ranking_weight, "tokenizer":args.tokenizer, "source_sha256":hashlib.sha256(Path(args.data).read_bytes()).hexdigest(), "train":len(train), "validation":len(val), "test":len(test), "cv_length":args.cv_length, "jd_length":args.jd_length, "license_record":Path(args.license_record).read_text(encoding="utf-8")}, ensure_ascii=False, indent=2), encoding="utf-8")
    (out / "validation_metrics.json").write_text(json.dumps(val_metrics, indent=2), encoding="utf-8")
    (out / "history.json").write_text(json.dumps(history.history, indent=2), encoding="utf-8")
    calibration = {"neural_threshold":threshold, "rule_threshold":rule_threshold,
        "hybrid_neural_weight":hybrid_weight, "hybrid_threshold":hybrid_threshold,
        "selected_on":"validation_macro_f1", "validation_neural_macro_f1":val_metrics["macro avg"]["f1-score"],
        "validation_hybrid_macro_f1":hybrid_macro,
        "validation_pairwise_accuracy":sum(ranking_pairs)/len(ranking_pairs) if ranking_pairs else None}
    (out / "calibration.json").write_text(json.dumps(calibration, indent=2), encoding="utf-8")
    (out / "validation_predictions.json").write_text(json.dumps([
        {"source_id":row["source_id"], "jd_group":row["jd_group"], "label":row["label"],
         "grade":row.get("grade", row["label"]), "neural":float(neural), "rule":float(rule)}
        for row,neural,rule in zip(val,val_pred,val_rule)], indent=2), encoding="utf-8")
    if args.evaluate_test:
        pred = model.predict(x_test, batch_size=args.batch_size, verbose=0).ravel()
        metrics = classification_report([r["label"] for r in test], pred >= threshold, output_dict=True, zero_division=0)
        (out / "evaluation_metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
