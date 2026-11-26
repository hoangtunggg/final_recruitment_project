"""Reproducible diagnostics for label shift, shortcuts and tokenizer coverage."""
import argparse
import json
import math
import re
from collections import Counter
from pathlib import Path

import numpy as np
from tensorflow.keras.preprocessing.text import tokenizer_from_json

from model import standardize


def tokens(text):
    return re.findall(r"[\w+#.\-]+", text.casefold())


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--training", required=True)
    p.add_argument("--artifacts", required=True)
    p.add_argument("--evaluations", nargs="+", required=True)
    p.add_argument("--output", required=True)
    args = p.parse_args()
    rows = [json.loads(line) for line in Path(args.training).open(encoding="utf-8")]
    tokenizer = tokenizer_from_json((Path(args.artifacts)/"tokenizer.json").read_text())
    history = json.loads((Path(args.artifacts)/"history.json").read_text())
    by_label = {0:Counter(), 1:Counter()}
    for row in rows:
        by_label[row["label"]].update(set(tokens(row["cv"] + " " + row["jd"])))
    shortcuts = []
    for token in set(by_label[0]) | set(by_label[1]):
        if by_label[0][token] + by_label[1][token] >= 30:
            log_odds = math.log((by_label[1][token]+1)/(len(rows)+2-by_label[1][token])) - math.log((by_label[0][token]+1)/(len(rows)+2-by_label[0][token]))
            shortcuts.append({"token":token, "log_odds_positive":log_odds,
                              "positive_docs":by_label[1][token], "negative_docs":by_label[0][token]})
    evaluations = {}
    for path in args.evaluations:
        eval_rows = [json.loads(line) for line in Path(path).open(encoding="utf-8")]
        clean = [value.decode() for value in standardize([row[key] for row in eval_rows for key in ("cv","jd")]).numpy()]
        sequences = tokenizer.texts_to_sequences(clean)
        total = sum(map(len,sequences))
        oov = sum(token == tokenizer.word_index[tokenizer.oov_token] for seq in sequences for token in seq)
        evaluations[Path(path).name] = {"pairs":len(eval_rows), "positive":sum(row["label"] for row in eval_rows),
            "mean_cv_words":float(np.mean([len(tokens(row["cv"])) for row in eval_rows])),
            "mean_jd_words":float(np.mean([len(tokens(row["jd"])) for row in eval_rows])),
            "oov_rate":oov/max(1,total), "languages":dict(Counter(row.get("language","source") for row in eval_rows))}
    output = {"training":{"pairs":len(rows), "positive":sum(row["label"] for row in rows),
        "grades":dict(Counter(str(row.get("grade",row["label"])) for row in rows)),
        "kinds":dict(Counter(row.get("label_kind","unknown") for row in rows)),
        "exact_pair_duplicates":len(rows)-len({(row["cv"],row["jd"]) for row in rows}),
        "cv_groups":len({row["cv_group"] for row in rows}), "jd_groups":len({row["jd_group"] for row in rows})},
        "history":history, "top_positive_shortcuts":sorted(shortcuts,key=lambda x:-x["log_odds_positive"])[:20],
        "top_negative_shortcuts":sorted(shortcuts,key=lambda x:x["log_odds_positive"])[:20], "evaluations":evaluations}
    Path(args.output).write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"training":output["training"], "evaluations":evaluations,
                      "top_positive":[x["token"] for x in output["top_positive_shortcuts"][:8]],
                      "top_negative":[x["token"] for x in output["top_negative_shortcuts"][:8]]}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
