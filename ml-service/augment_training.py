"""Controlled synthetic perturbations of training groups; never touch holdout."""
import argparse
import hashlib
import json
from collections import defaultdict
from pathlib import Path

ALIASES = {"JavaScript": "JS", "Python": "Py", "React": "ReactJS", "SQL": "Structured Query Language",
           "Docker": "Docker containers", "Excel": "Microsoft Excel", "Power BI": "PowerBI", "Git": "Git version control"}


def replace_skills(cv, originals, replacement):
    lines = cv.splitlines()
    for i, line in enumerate(lines):
        if line.startswith("Skills: "):
            skills = [s.strip() for s in line[8:].split(",")]
            lines[i] = "Skills: " + ", ".join(replacement(s) if s.casefold() in originals else s for s in skills)
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--max-groups", type=int, default=0, help="Small training-only hyperparameter trial")
    args = parser.parse_args()
    rows = [json.loads(line) for line in Path(args.base).open(encoding="utf-8")]
    groups = defaultdict(list)
    for row in rows:
        groups[row["jd_group"]].append(row)
    if args.max_groups:
        selected = set(sorted(groups)[:args.max_groups])
        groups = {key:value for key,value in groups.items() if key in selected}
    result = [r for group in groups.values() for r in group]
    for jid, group in sorted(groups.items()):
        by_kind = {r["label_kind"]:r for r in group}
        if len(by_kind) != 3:
            continue
        pos = by_kind["published_positive"]
        easy = by_kind["constructed_easy_negative"]
        required_line = next((line for line in pos["jd"].splitlines() if line.startswith("Required: ")), "")
        required = [x.strip() for x in required_line[10:].split(",") if x.strip()]
        if not required:
            continue
        required_set = {s.casefold() for s in required}
        additions = []
        alias_cv = replace_skills(pos["cv"], required_set,
            lambda s: ALIASES.get(s, s))
        additions.append((alias_cv + "\nWorked with teams in Việt Nam and English-speaking teams.", 1, "alias_mixed_positive"))
        additions.append((pos["cv"] + "\nKinh nghiệm thực tế: đã dùng kỹ năng nêu trên trong công việc.", 1, "mixed_positive"))
        negated = replace_skills(pos["cv"], required_set, lambda s: "(not practiced)")
        negated += "\nNever used or practiced: " + ", ".join(required) + ". These are not professional skills."
        additions.append((negated, 0, "negated_required_negative"))
        stuffing = easy["cv"] + "\nCopied job keywords, no hands-on experience: " + " ".join(required * 3)
        additions.append((stuffing, 0, "keyword_stuffing_negative"))
        lines = pos["cv"].splitlines()
        if "Senior" in pos["jd"].splitlines()[1] or "Mid" in pos["jd"].splitlines()[1]:
            if len(lines) > 2:
                lines[1] = "Junior"
                lines[2] = "0 years experience"
                additions.append(("\n".join(lines) + "\nLearning these skills, no professional practice yet.", 0, "seniority_gap_negative"))
        for ix, (cv, label, kind) in enumerate(additions):
            row = dict(pos)
            row.update(cv=cv, label=label, label_kind=kind,
                       cv_group=f'{pos["cv_group"]}:variant:{ix}',
                       source_id=f'{jid}:variant:{ix}')
            result.append(row)
    # All variants of a source CV remain in one group via the shared JD ID.
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in result), encoding="utf-8")
    print(json.dumps({"pairs":len(result), "groups":len(groups),
                      "labels":{str(i):sum(r["label"]==i for r in result) for i in (0,1)},
                      "sha256":hashlib.sha256(out.read_bytes()).hexdigest()}))


if __name__ == "__main__":
    main()
