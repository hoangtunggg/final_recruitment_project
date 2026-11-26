"""Fixed-threshold TF-IDF and literal-skill baselines on a supplied JSONL set."""
import argparse
import json
import math
import re
from collections import Counter
from pathlib import Path

from sklearn.metrics import classification_report, confusion_matrix
from scipy.stats import spearmanr

from generate_baselines import score_tfidf, terms


def score_overlap(row):
    return sum(bool(re.search(r"(?<!\w)" + re.escape(skill) + r"(?!\w)", row["cv"], re.I))
               for skill in row["required"]) / len(row["required"]) if row["required"] else 0.0


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--dataset", required=True)
    p.add_argument("--output", required=True)
    args = p.parse_args()
    rows = [json.loads(line) for line in Path(args.dataset).open(encoding="utf-8")]
    for row in rows:
        if "required" not in row:
            match = re.search(r"(?im)^Required:\s*(.*)$", row["jd"])
            row["required"] = [s.strip() for s in match[1].split(",") if s.strip()] if match else []
    df = Counter(token for row in rows for doc in (row["cv"], row["jd"]) for token in terms(doc))
    idf = {token:math.log((2*len(rows)+1)/(count+1))+1 for token,count in df.items()}
    binary = all(row["label"] in (0,1) for row in rows)
    y = [int(row["label"] >= (1 if binary else 2)) for row in rows]
    output = {"cases":len(rows), "label_threshold":1 if binary else 2}
    for name, fn in (("skill_overlap", score_overlap),
                     ("tfidf", lambda row: score_tfidf(row, idf))):
        scores = [fn(row) for row in rows]
        output[name] = {"classification_at_0_5":classification_report(y,
                        [int(score >= .5) for score in scores], output_dict=True, zero_division=0),
                        "confusion_matrix":confusion_matrix(y,
                        [int(score >= .5) for score in scores], labels=[0,1]).tolist(),
                        "spearman":float(spearmanr([row["label"] for row in rows], scores).statistic)}
    Path(args.output).write_text(json.dumps(output, indent=2), encoding="utf-8")
    print(json.dumps({key:{"macro_f1":value["classification_at_0_5"]["macro avg"]["f1-score"],
                          "positive_f1":value["classification_at_0_5"]["1"]["f1-score"]}
                      for key,value in output.items() if key in ("skill_overlap", "tfidf")}))


if __name__ == "__main__":
    main()
