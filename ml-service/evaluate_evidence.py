"""Evaluate rule evidence statuses against the labeled synthetic regression cases."""
import argparse
import json
from collections import Counter
from pathlib import Path

from server import skill_evidence


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    correct = Counter()
    total = Counter()
    mistakes = []
    mapping = {"present":"matched", "alias":"matched", "negated":"contradicted",
               "keyword_only":"unverified", "unverified":"unverified"}
    for line in Path(args.dataset).open(encoding="utf-8"):
        row = json.loads(line)
        for item in row.get("evidence", []):
            expected = mapping[item["expected"]]
            actual = skill_evidence(row["cv"], item["requirement"])["status"]
            group = row["scenario"]
            total[group] += 1
            total["all"] += 1
            if actual == expected:
                correct[group] += 1
                correct["all"] += 1
            else:
                mistakes.append({"id":row["id"], "requirement":item["requirement"],
                                 "expected":expected, "actual":actual})
    result = {"accuracy":{key:correct[key]/count for key,count in total.items()},
              "counts":dict(total), "mistakes":mistakes}
    Path(args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"accuracy":result["accuracy"], "counts":result["counts"],
                      "mistakes":len(mistakes)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
