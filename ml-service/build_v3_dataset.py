"""Create graded, group-contained counterfactuals from the retained licensed pairs."""
import argparse
import hashlib
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ALIASES = {"javascript":"JS", "python":"Py", "react":"ReactJS", "sql":"Structured Query Language",
           "docker":"containerization with Docker", "excel":"Microsoft Excel", "power bi":"PowerBI",
           "git":"Git version control", "node.js":"NodeJS", "aws":"Amazon Web Services"}
PRACTICAL = [
    "Delivered a production project using {skills}, with measurable outcomes and peer review.",
    "Applied {skills} in day-to-day work and documented the implementation decisions.",
    "Built and maintained a real client solution with {skills}; handled testing and support.",
    "Dự án thực tế sử dụng {skills}, có kết quả đo lường và được đồng đội đánh giá.",
]


def required(jd):
    match = re.search(r"(?im)^Required:\s*(.*)$", jd)
    return [part.strip() for part in match[1].split(",") if part.strip()] if match else []


def replace_skill_line(cv, replacement):
    return re.sub(r"(?im)^Skills:.*$", "Skills: " + ", ".join(replacement), cv)


def row_from(source, index, cv, label, grade, kind, rationale):
    row = dict(source)
    row.update(cv=cv, label=label, grade=grade, label_kind=kind,
               cv_group=f'{source["cv_group"]}:v3:{index}',
               source_id=f'{source["source_id"]}:v3:{index}', label_rationale=rationale)
    return row


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--max-groups", type=int, default=0)
    args = parser.parse_args()
    groups = defaultdict(list)
    for line in Path(args.base).open(encoding="utf-8"):
        row = json.loads(line)
        groups[row["jd_group"]].append(row)
    selected = sorted(groups)[:args.max_groups or None]
    result = []
    for ordinal, jid in enumerate(selected):
        by_kind = {row["label_kind"]:row for row in groups[jid]}
        if not {"published_positive", "constructed_hard_negative", "constructed_easy_negative"} <= by_kind.keys():
            continue
        positive = by_kind["published_positive"]
        req = required(positive["jd"])
        if len(req) < 2:
            continue
        originals = [dict(row, grade=1.0 if row["label"] else (0.30 if row["label_kind"] == "constructed_hard_negative" else 0.0))
                     for row in groups[jid]]
        result.extend(originals)
        alias_skills = [ALIASES.get(skill.casefold(), skill) for skill in req]
        alias_cv = replace_skill_line(positive["cv"], alias_skills)
        practical = PRACTICAL[ordinal % len(PRACTICAL)].format(skills=", ".join(alias_skills[:3]))
        result.append(row_from(positive, 0, alias_cv + "\n" + practical, 1, .95,
                               "alias_practical_positive", "Equivalent aliases plus explicit practical evidence"))
        result.append(row_from(positive, 1, positive["cv"] + "\n" + PRACTICAL[(ordinal+1) % len(PRACTICAL)].format(skills=", ".join(req[:3])),
                               1, .90, "bilingual_project_positive", "Required skills supported by a practical project"))
        partial = req[:max(1, len(req)//2)]
        partial_cv = replace_skill_line(positive["cv"], partial)
        partial_cv += "\nPractical experience is limited to: " + ", ".join(partial) + "."
        result.append(row_from(positive, 2, partial_cv, 1, .60, "same_role_partial_positive",
                               "Same role with practical evidence for about half of required skills"))
        contradicted = replace_skill_line(positive["cv"], ["communication", "documentation"])
        contradicted += "\nNever used in practice: " + ", ".join(req) + "."
        result.append(row_from(positive, 3, contradicted, 0, .05, "explicit_contradiction_negative",
                               "Explicitly contradicts every required skill"))
        learning = replace_skill_line(positive["cv"], [])
        learning += "\nCurrently learning only; no project or work experience with " + ", ".join(req) + "."
        result.append(row_from(positive, 4, learning, 0, .20, "learning_only_negative",
                               "Study-only statements are not practical experience"))
        mode = ordinal % 3
        if mode == 0:
            variant = by_kind["constructed_easy_negative"]["cv"] + "\nCopied keywords without use: " + " ".join(req * 3)
            result.append(row_from(positive, 5, variant, 0, 0.0, "keyword_stuffing_negative", "Keywords without evidence"))
        elif mode == 1:
            lines = positive["cv"].splitlines()
            if len(lines) > 2:
                lines[1], lines[2] = "Junior", "0 years experience"
            variant = "\n".join(lines) + "\nEntry-level exposure only; the position requires experienced ownership."
            result.append(row_from(positive, 5, variant, 0, .30, "seniority_gap_negative", "Role and skills match but seniority does not"))
        else:
            filler = "Company background and unrelated administrative context. " * 170
            variant = filler + "\nRelevant evidence follows.\n" + positive["cv"] + "\n" + practical
            result.append(row_from(positive, 5, variant, 1, .90, "long_relevant_positive", "Relevant evidence remains present in a long document"))
    seen = set()
    deduped = []
    for row in result:
        digest = hashlib.sha256((row["cv"] + "\0" + row["jd"]).encode()).hexdigest()
        if digest not in seen:
            seen.add(digest)
            deduped.append(row)
    destination = Path(args.output)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in deduped), encoding="utf-8")
    print(json.dumps({"pairs":len(deduped), "jd_groups":len({r['jd_group'] for r in deduped}),
                      "labels":dict(Counter(r["label"] for r in deduped)),
                      "kinds":dict(Counter(r["label_kind"] for r in deduped)),
                      "sha256":hashlib.sha256(destination.read_bytes()).hexdigest()}))


if __name__ == "__main__":
    main()
