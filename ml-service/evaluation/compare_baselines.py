"""Recompute earlier deterministic baselines on the model-covered cases."""
import json
import math
from collections import Counter
from pathlib import Path

from generate_baselines import score_overlap, score_tfidf, stats, terms

root = Path(__file__).parent
rows = [json.loads(line) for line in (root / "synthetic_pairs.jsonl").open(encoding="utf-8")]
rows = [row for row in rows if row["scenario"] != "long"]
df = Counter(token for row in rows for doc in (row["cv"], row["jd"]) for token in terms(doc))
n = 2 * len(rows)
idf = {token: math.log((n+1)/(count+1))+1 for token,count in df.items()}
results = [stats(rows, "skill_overlap", score_overlap),
           stats(rows, "tfidf", lambda row: score_tfidf(row, idf))]
(root / "baseline_comparable.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
print(json.dumps([{"baseline":r["baseline"], "precision":r["precision"],
                   "recall":r["recall"], "f1":r["f1"]} for r in results]))
