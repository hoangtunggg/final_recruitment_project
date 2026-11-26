"""Convert pinned synthetic HF Parquet files to grouped binary training pairs.

Negatives are constructed by an explicit incompatible-skill rule, never by
assuming that a resume absent from the published match list is negative.
"""
import argparse
import hashlib
import json
import random
from pathlib import Path

import pyarrow.parquet as pq


def records(path):
    return pq.read_table(path).to_pylist()


def as_list(value):
    if value is None:
        return []
    return list(value)


def cv_text(r):
    return "\n".join([str(r.get("role", "")), str(r.get("seniority", "")),
        f'{r.get("years_experience", 0)} years experience', str(r.get("education", "")),
        "Skills: " + ", ".join(map(str, as_list(r.get("skills")))),
        str(r.get("summary", "")), *map(str, as_list(r.get("experience_bullets")))])


def jd_text(r):
    return "\n".join([str(r.get("job_title", "")), str(r.get("seniority", "")),
        str(r.get("description", "")), "Required: " + ", ".join(map(str, as_list(r.get("must_have_skills")))),
        "Preferred: " + ", ".join(map(str, as_list(r.get("nice_to_have_skills")))),
        *map(str, as_list(r.get("requirements"))), *map(str, as_list(r.get("responsibilities")))])


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--source-dir", required=True)
    p.add_argument("--output", required=True)
    p.add_argument("--max-jobs", type=int, default=1500)
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--exclude-pairs", help="JSONL whose CV and JD groups are reserved for another split")
    args = p.parse_args()
    src = Path(args.source_dir)
    cv = {r["resume_id"]: r for r in records(src / "resumes.parquet")}
    jobs = {r["job_id"]: r for r in records(src / "jobs.parquet")}
    matches = records(src / "matches.parquet")
    rng = random.Random(args.seed)
    rng.shuffle(matches)
    available = list(cv)
    rng.shuffle(available)
    used = set()
    excluded_jobs = set()
    if args.exclude_pairs:
        for line in Path(args.exclude_pairs).open(encoding="utf-8"):
            prior = json.loads(line)
            used.add(prior["cv_group"])
            excluded_jobs.add(prior["jd_group"])
    output = []
    for match in matches:
        if len(output) >= 3 * args.max_jobs:
            break
        job = jobs.get(match["job_id"])
        if not job or match["job_id"] in excluded_jobs:
            continue
        required = {s.casefold() for s in as_list(job.get("must_have_skills"))}
        if not required:
            continue
        listed = set(as_list(match.get("relevant_resume_ids")))
        positives = [rid for rid in sorted(listed) if rid in cv and rid not in used]
        rng.shuffle(positives)
        if not positives:
            continue
        positive = positives[0]
        # Same role but explicitly below the source's 60% must-have threshold.
        hard = next((rid for rid in available if rid not in used and rid not in listed
            and cv[rid].get("role", "").casefold() in job.get("job_title", "").casefold()
            and len(required & {s.casefold() for s in as_list(cv[rid].get("skills"))}) / len(required) < .6), None)
        easy = next((rid for rid in available if rid not in used and rid not in listed and rid != hard
            and cv[rid].get("industry") != job.get("industry")
            and cv[rid].get("role", "").casefold() not in job.get("job_title", "").casefold()
            and not (required & {s.casefold() for s in as_list(cv[rid].get("skills"))})), None)
        if not hard or not easy:
            continue
        for rid, label, kind in ((positive, 1, "published_positive"), (hard, 0, "constructed_hard_negative"), (easy, 0, "constructed_easy_negative")):
            output.append({"cv": cv_text(cv[rid]), "jd": jd_text(job), "label": label,
                "cv_group": rid, "jd_group": job["job_id"], "source_id": f'{job["job_id"]}:{rid}', "label_kind": kind})
            used.add(rid)
    dest = Path(args.output)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in output), encoding="utf-8")
    print(json.dumps({"resumes": len(cv), "jobs": len(jobs), "match_records": len(matches),
        "pairs": len(output), "groups": len(output)//3,
        "sha256": hashlib.sha256(dest.read_bytes()).hexdigest()}))


if __name__ == "__main__":
    main()
