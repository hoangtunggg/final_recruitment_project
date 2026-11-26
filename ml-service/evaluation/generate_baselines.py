"""Synthetic CV-JD evaluation; stdlib only; never imports cloned repositories."""
import json
import math
import re
import statistics
import time
from collections import Counter, defaultdict
from pathlib import Path

OUT = Path(__file__).parent
ROLES = [
    ("frontend", ["react", "typescript", "css"], ["figma", "jest"], "software engineering", "computer science"),
    ("backend", ["node.js", "mysql", "docker"], ["redis", "kubernetes"], "software engineering", "computer science"),
    ("data analyst", ["python", "sql", "power bi"], ["tableau", "statistics"], "analytics", "statistics"),
    ("accountant", ["accounting", "excel", "tax"], ["erp", "auditing"], "finance", "accounting"),
    ("sales", ["crm", "negotiation", "sales"], ["excel", "marketing"], "commercial", "business"),
    ("nurse", ["patient care", "triage", "clinical"], ["first aid", "records"], "healthcare", "nursing"),
    ("teacher", ["teaching", "lesson planning", "assessment"], ["classroom", "curriculum"], "education", "education"),
    ("logistics", ["inventory", "shipping", "warehouse"], ["excel", "procurement"], "supply chain", "logistics"),
]
ALIASES = {"react": "reactjs", "node.js": "nodejs", "power bi": "powerbi", "crm": "customer relationship management"}
VI = {"skills": "Kỹ năng", "required": "Bắt buộc", "preferred": "Ưu tiên", "years": "năm kinh nghiệm", "project": "Dự án", "degree": "Bằng cấp", "no": "Chưa từng sử dụng"}
SCENARIOS = ["strong", "partial", "weak", "unrelated", "missing_mandatory", "alias", "experience_gap", "education_gap", "project_gap", "keyword_stuffing", "negation", "long", "mixed"]
LABELS = {"strong": 3, "partial": 2, "weak": 1, "unrelated": 0, "missing_mandatory": 1, "alias": 3, "experience_gap": 1, "education_gap": 2, "project_gap": 2, "keyword_stuffing": 0, "negation": 0, "long": 3, "mixed": 3}
SKILLS = sorted({s for _, req, pref, _, _ in ROLES for s in req + pref})

def terms(text):
    return set(re.findall(r"[\w+#.]+", text.casefold()))

def skill_found(text, skill):
    return bool(re.search(r"(?<!\w)" + re.escape(skill) + r"(?!\w)", text.casefold()))

def make_case(role_idx, scenario, language):
    role, req, pref, project, degree = ROLES[role_idx]
    other = ROLES[(role_idx + 3) % len(ROLES)]
    active = other[1] if scenario == "unrelated" else req[:]
    if scenario in ("partial", "missing_mandatory", "weak"):
        active = req[:2] if scenario != "weak" else req[:1]
    if scenario == "keyword_stuffing":
        active = []
    if scenario == "negation":
        active = req[1:]
    if scenario == "alias":
        active = [ALIASES.get(s, s) for s in req]
    years = 1 if scenario == "experience_gap" else 5
    education = "unrelated diploma" if scenario == "education_gap" else degree
    cv_project = "unrelated volunteer work" if scenario == "project_gap" else project
    req_label = VI["required"] if language in ("vi", "mixed") else "Required"
    pref_label = VI["preferred"] if language in ("vi", "mixed") else "Preferred"
    jd = f"{role}. {req_label}: {', '.join(req)}. {pref_label}: {', '.join(pref)}. 4 years experience. Degree: {degree}. Project: {project}."
    cv = f"{role if scenario != 'unrelated' else other[0]}. Skills: {', '.join(active)}. {years} years experience. Degree: {education}. Project: {cv_project}."
    if language == "vi":
        jd = jd.replace("Required", VI["required"]).replace("Preferred", VI["preferred"]).replace("years experience", VI["years"]).replace("Degree", VI["degree"]).replace("Project", VI["project"])
        cv = cv.replace("years experience", VI["years"]).replace("Degree", VI["degree"]).replace("Project", VI["project"])
    if scenario == "mixed":
        jd += " Yêu cầu công việc: có kinh nghiệm thực tế và giao tiếp tốt."
        cv += " Đã thực hiện dự án thực tế, phối hợp với nhóm tại Việt Nam."
    if scenario == "negation":
        cv += f" {VI['no']} {req[0]}." if language == "vi" else f" I have never used {req[0]}."
    if scenario == "keyword_stuffing":
        cv += " Skills keywords only: " + (" ".join(req + pref) + " ") * 12 + " no professional use."
    if scenario == "long":
        cv = ("Earlier unrelated context. " * 350) + cv
        jd = ("Long company introduction. " * 190) + jd
    evidence = [{"requirement": s, "expected": "negated" if scenario == "negation" and s == req[0] else "keyword_only" if scenario == "keyword_stuffing" else "alias" if scenario == "alias" and s in ALIASES else "present" if s in req and (s in active or ALIASES.get(s) in active) else "unverified"} for s in req]
    return {"id": f"{role_idx:02d}-{scenario}-{language}", "role": role, "scenario": scenario, "language": language, "cv": cv, "jd": jd, "label": LABELS[scenario], "required": req, "preferred": pref, "evidence": evidence, "ranking_group": f"{role_idx}-{language}"}

def score_overlap(row):
    found = sum(skill_found(row["cv"], s) for s in row["required"])
    return found / len(row["required"])

def score_tfidf(row, idf):
    a, b = terms(row["cv"]), terms(row["jd"])
    va, vb = {t: idf[t] for t in a}, {t: idf[t] for t in b}
    dot = sum(va[t] * vb[t] for t in a & b)
    return dot / (math.sqrt(sum(v*v for v in va.values())) * math.sqrt(sum(v*v for v in vb.values()))) if a and b else 0

def stats(rows, name, fn):
    per = []
    for row in rows:
        t = time.perf_counter_ns()
        score = fn(row)
        per.append((row, score, (time.perf_counter_ns()-t)/1e6))
    labels = [int(row["label"] >= 2) for row, _, _ in per]
    scores = [score for _, score, _ in per]
    threshold = .5
    tp = sum(y and s >= threshold for y,s in zip(labels,scores))
    fp = sum(not y and s >= threshold for y,s in zip(labels,scores))
    fnn = sum(y and s < threshold for y,s in zip(labels,scores))
    prec = tp/(tp+fp) if tp+fp else 0
    rec = tp/(tp+fnn) if tp+fnn else 0
    lat = sorted(ms for _,_,ms in per)
    by_scenario = defaultdict(list)
    by_language = defaultdict(list)
    for row, score, _ in per: by_scenario[row["scenario"]].append(score)
    for row, score, _ in per: by_language[row["language"]].append((row["label"],score))
    return {"baseline":name,"threshold":threshold,"precision":prec,"recall":rec,"f1":2*prec*rec/(prec+rec) if prec+rec else 0,"p50_ms":lat[len(lat)//2],"p95_ms":lat[int(.95*(len(lat)-1))],"p99_ms":lat[int(.99*(len(lat)-1))],"scenario_means":{k:statistics.mean(v) for k,v in sorted(by_scenario.items())},"language_mean_scores":{k:statistics.mean(s for _,s in v) for k,v in by_language.items()},"examples":[{"id":r["id"],"label":r["label"],"score":round(s,3)} for r,s,_ in per if r["scenario"] in ("negation","keyword_stuffing","alias")][:12]}

def main():
    rows = [make_case(i, scenario, language) for i in range(8) for scenario in SCENARIOS for language in ("en","vi")]
    assert len(rows) == 208
    (OUT/"synthetic_pairs.jsonl").write_text("".join(json.dumps(r, ensure_ascii=False)+"\n" for r in rows), encoding="utf8")
    df = Counter(t for row in rows for doc in (row["cv"],row["jd"]) for t in terms(doc))
    n = 2*len(rows)
    idf = {t: math.log((n+1)/(v+1))+1 for t,v in df.items()}
    results = [stats(rows,"skill_overlap",score_overlap),stats(rows,"tfidf",lambda r:score_tfidf(r,idf))]
    (OUT/"baseline_results.json").write_text(json.dumps(results, indent=2), encoding="utf8")
    print(json.dumps({"pairs":len(rows),"languages":dict(Counter(r["language"] for r in rows)),"results":results},indent=2))

if __name__ == "__main__": main()
