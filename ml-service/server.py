"""Private experimental inference API; returns 503 until local artifacts exist."""
import base64
import io
import json
import os
import re
import threading
from pathlib import Path

import numpy as np

from docx import Document
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from pypdf import PdfReader

ARTIFACTS = Path(os.getenv("MATCHER_ARTIFACTS", "/app/artifacts"))
READY = all((ARTIFACTS / n).is_file() for n in ("matcher.keras", "tokenizer.json", "model_metadata.json", "evaluation_metrics.json", "regression_metrics.json"))
MODEL = TOKENIZER = None
CV_LENGTH, JD_LENGTH = 512, 256
LOCK = threading.BoundedSemaphore(int(os.getenv("MATCHER_INFERENCE_SLOTS", "2")))
QUEUE = threading.BoundedSemaphore(int(os.getenv("MATCHER_MAX_IN_FLIGHT", "8")))
QUEUE_WAIT_SECONDS = float(os.getenv("MATCHER_QUEUE_WAIT_SECONDS", "2"))

def quality_passed():
    if not READY:
        return False
    try:
        check = json.loads((ARTIFACTS / "regression_metrics.json").read_text())
        macro_f1 = check["classification_at_0_5"]["macro avg"]["f1-score"]
        coverage = check["cases"] / (check["cases"] + len(check["skipped"]))
        return (macro_f1 >= 0.70 and coverage >= 0.95
            and check["scenario_means"]["negation"] < 0.5
            and check["scenario_means"]["keyword_stuffing"] < 0.5)
    except (KeyError, ValueError, OSError):
        return False


if READY and quality_passed():
    import tensorflow as tf
    from tensorflow.keras.preprocessing.sequence import pad_sequences
    from tensorflow.keras.preprocessing.text import tokenizer_from_json
    from model import AttentionPooling, GradedPairwiseLoss, PairFeatures, standardize
    from text_chunks import select_sequences
    metadata = json.loads((ARTIFACTS / "model_metadata.json").read_text())
    if metadata.get("architecture") != "siamese_bigru_attention":
        raise RuntimeError("Unexpected model architecture")
    MODEL = tf.keras.models.load_model(ARTIFACTS / "matcher.keras", compile=False,
        custom_objects={"AttentionPooling": AttentionPooling, "PairFeatures": PairFeatures,
                        "GradedPairwiseLoss":GradedPairwiseLoss})
    TOKENIZER = tokenizer_from_json((ARTIFACTS / "tokenizer.json").read_text())
    CV_LENGTH, JD_LENGTH = metadata["cv_length"], metadata["jd_length"]

app = FastAPI(title="Private CV-JD inference", docs_url=None, redoc_url=None)


class MatchInput(BaseModel):
    file_base64: str = Field(max_length=8_000_000)
    file_type: str
    jd: dict


def extract(data: bytes, file_type: str) -> str:
    if len(data) > 5 * 1024 * 1024:
        raise ValueError("CV exceeds 5 MB")
    if file_type == "application/pdf":
        text = "\n".join(page.extract_text() or "" for page in PdfReader(io.BytesIO(data)).pages[:30])
    elif file_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        text = "\n".join(p.text for p in Document(io.BytesIO(data)).paragraphs)
    else:
        raise ValueError("Only PDF and DOCX are supported")
    if not text.strip():
        raise ValueError("No selectable text found in CV")
    return text


def skill_evidence(cv: str, skill: str):
    aliases = {"node.js": ["nodejs", "node js"], "react": ["reactjs", "react.js"],
               "c#": ["c sharp"], "c++": ["cpp"], ".net": ["dotnet", "asp.net"],
               "typescript": ["ts"], "javascript": ["js"], "power bi": ["powerbi"],
               "aws": ["amazon web services"], "sql": ["structured query language"]}
    aliases["crm"] = ["customer relationship management"]
    observations = []
    for word in [skill, *aliases.get(skill.casefold(), [])]:
        pattern = r"(?<!\w)" + re.escape(word) + r"(?!\w)"
        for m in re.finditer(pattern, cv, re.I):
            window = cv[max(0, m.start()-60):min(len(cv), m.end()+60)]
            line_start = cv.rfind("\n", 0, m.start()) + 1
            line_end = cv.find("\n", m.end())
            line = cv[line_start:line_end if line_end >= 0 else len(cv)].casefold()
            prefix = cv[max(0,m.start()-80):m.start()].casefold()
            first_sentence_end = cv.find(".")
            if ((line_start == 0 and ":" not in line and "\n" in cv) or
                (first_sentence_end >= 0 and m.start() < first_sentence_end and ":" not in cv[:m.start()]) or
                re.search(r"(?:degree|bằng cấp):[^.\n]*$", prefix)):
                continue
            if (line.startswith("never used or practiced:") or
                re.search(r"(?:never used|never worked with|no (?:hands-on |practical )?experience with|chưa từng(?: sử dụng| làm việc với)?|không biết|not practiced)\s*$", prefix)):
                observations.append(("contradicted", window))
            elif re.search(r"(?:keyword list|skills keywords only|copied job keywords|no hands-on experience|no professional use|chỉ liệt kê từ khóa|không có kinh nghiệm thực tế)", line):
                observations.append(("unverified", window))
            elif re.search(r"(?:learning|studying|currently learning|đang học|mới học)\s*$", prefix):
                observations.append(("partial", window))
            else:
                observations.append(("matched", window))
    if any(status == "matched" for status, _ in observations) and any(status == "contradicted" for status, _ in observations):
        return {"requirement":skill, "status":"unverified", "evidence":None,
                "reason":"Conflicting statements about this skill"}
    for status in ("matched", "contradicted", "partial", "unverified"):
        hit = next((evidence for observed,evidence in observations if observed == status), None)
        if hit is not None:
            return {"requirement": skill, "status": status, "evidence": hit}
    return {"requirement": skill, "status": "unverified", "evidence": None}


def classify_skills(jd: dict):
    skills = [x.strip() for x in str(jd.get("skills") or "").split(",") if x.strip()][:30]
    lines = [x.strip() for x in re.split(r"[\n;]", str(jd.get("requirements") or "")) if x.strip()]
    required, preferred, unspecified = [], [], []
    for skill in skills:
        mentions = [line for line in lines if re.search(r"(?<!\w)" + re.escape(skill) + r"(?!\w)", line, re.I)]
        if any(re.search(r"\b(?:ưu tiên|preferred|nice to have)\b", line, re.I) for line in mentions):
            preferred.append(skill)
        elif mentions:
            required.append(skill)
        else:
            unspecified.append(skill)
    return required, preferred, unspecified


def experience_evidence(cv: str, jd: dict):
    jd_text = str(jd.get("requirements") or "")
    needed = re.search(r"(?:ít nhất|từ|minimum|at least)?\s*(\d{1,2})\s*(?:năm|years?)", jd_text, re.I)
    if not needed:
        return {"status": "unverified", "reason": "No explicit years requirement"}
    matches = list(re.finditer(r"(\d{1,2})\s*(?:năm|years?)", cv, re.I))
    if not matches:
        return {"status": "unverified", "requiredYears": int(needed[1]), "evidence": None}
    best = max(matches, key=lambda m: int(m[1]))
    return {"status": "matched" if int(best[1]) >= int(needed[1]) else "partial",
            "requiredYears": int(needed[1]), "statedYears": int(best[1]),
            "evidence": cv[max(0,best.start()-40):min(len(cv),best.end()+40)]}


def education_evidence(cv: str, jd: dict):
    requirement = str(jd.get("education") or "").strip()
    if not requirement:
        return {"status": "unverified", "reason": "No explicit education requirement"}
    found = re.search(re.escape(requirement), cv, re.I)
    return {"status": "matched" if found else "unverified", "requirement": requirement,
            "evidence": cv[max(0,found.start()-40):min(len(cv),found.end()+40)] if found else None}


def seniority_evidence(cv: str, jd: dict):
    required = str(jd.get("experience") or "").casefold()
    levels = {"entry level":0, "junior":0, "mid level":1, "mid":1,
              "senior level":2, "senior":2, "lead":3, "manager":3}
    target = levels.get(required)
    if target is None:
        return {"status":"unverified", "reason":"No structured seniority"}
    matches = list(re.finditer(r"\b(?:junior|mid(?:\s+level)?|senior(?:\s+level)?|lead|manager)\b", cv, re.I))
    if not matches:
        return {"status":"unverified", "requirement":required, "evidence":None}
    highest = max(matches, key=lambda m: levels.get(m[0].casefold(), 0))
    return {"status":"matched" if levels[highest[0].casefold()] >= target else "partial",
            "requirement":required, "evidence":cv[max(0,highest.start()-40):min(len(cv),highest.end()+40)]}


def project_evidence(cv: str, jd: dict):
    lines = cv.splitlines()
    mentions = [line for line in lines if re.search(r"\b(?:project|projects|dự án)\b", line, re.I)]
    title_words = [word for word in re.findall(r"\w+", str(jd.get("title") or "").casefold()) if len(word) > 4]
    for line in mentions:
        if title_words and any(word in line.casefold() for word in title_words):
            return {"status":"partial", "evidence":line[:240],
                    "reason":"Project line shares a role term; project relevance is not verified"}
    return {"status":"unverified", "evidence":None}


def analyze(cv: str, jd: dict):
    required, preferred, unspecified = classify_skills(jd)
    requirements = [skill_evidence(cv, s) for s in required]
    preferred_evidence = [skill_evidence(cv, s) for s in preferred]
    unspecified_evidence = [skill_evidence(cv, s) for s in unspecified]
    matched = sum(x["status"] == "matched" for x in requirements)
    skill_score = matched / len(required) if required else None
    parts = [str(jd.get(k) or "") for k in ("title", "description", "requirements", "responsibilities", "education", "experience", "skills")]
    jd_text = "\n".join(parts)
    cv_parts, cv_coverage = select_sequences(cv, TOKENIZER, CV_LENGTH, max_chunks=4, priority_terms=required)
    jd_parts, jd_coverage = select_sequences(jd_text, TOKENIZER, JD_LENGTH, max_chunks=3, priority_terms=required)
    pair_cv = [part for part in cv_parts for _ in jd_parts]
    pair_jd = [part for _ in cv_parts for part in jd_parts]
    x = [pad_sequences(pair_cv, maxlen=CV_LENGTH, padding="post"),
         pad_sequences(pair_jd, maxlen=JD_LENGTH, padding="post")]
    if not QUEUE.acquire(blocking=False):
        raise HTTPException(429, "Inference queue is full; retry later")
    acquired = False
    try:
        acquired = LOCK.acquire(timeout=QUEUE_WAIT_SECONDS)
        if not acquired:
            raise HTTPException(429, "Inference wait limit reached; retry later")
        neural = float(np.mean(MODEL.predict(x, verbose=0)))
    finally:
        if acquired:
            LOCK.release()
        QUEUE.release()
    weight_neural, weight_skill = (0.7, 0.3) if skill_score is not None else (1.0, 0.0)
    overall = round(100 * (weight_neural * neural + weight_skill * (skill_score or 0)), 1)
    contradicted_required = sum(item["status"] == "contradicted" for item in requirements)
    if contradicted_required:
        overall = min(overall, 49.0)
    return {"version": "experimental-v1", "overallScore": overall,
        "componentScores": {"neuralRelevance": round(neural * 100, 1),
                            "requiredSkills": round(skill_score * 100, 1) if skill_score is not None else None},
        "required": requirements, "preferred": preferred_evidence, "unspecified": unspecified_evidence,
        "experience": experience_evidence(cv, jd), "education": education_evidence(cv, jd),
        "seniority": seniority_evidence(cv, jd), "project": project_evidence(cv, jd),
        "documentCoverage": {"cv":cv_coverage, "jd":jd_coverage},
        "contradictionOverride": contradicted_required > 0,
        "strengths": [f'CV mentions {x["requirement"]}: {x["evidence"]}' for x in requirements if x["status"] == "matched"],
        "gaps": [f'No CV evidence verified for {x["requirement"]}' for x in requirements if x["status"] == "unverified"],
        "recommendations": [f'If you have experience with {x["requirement"]}, add a specific example to your CV.' for x in requirements if x["status"] == "unverified"],
        "limitations": ["Synthetic-label experimental model; score is not a hiring probability.",
                        "Only explicitly mentioned required skills affect the rule score; experience, education and preferred skills are evidence-only.",
                        "Long documents use bounded, selected sections; documentCoverage reports omitted tokens.",
                        "Project relevance is only a text hint and is not a validated competency score."]}


@app.get("/health")
def health():
    return {"status": "up", "modelLoaded": MODEL is not None}


@app.get("/ready")
def ready():
    if MODEL is None:
        raise HTTPException(503, "Validated local artifacts unavailable")
    return {"status": "ready"}


@app.post("/match")
def match(payload: MatchInput):
    if MODEL is None:
        raise HTTPException(503, "Validated local artifacts unavailable")
    try:
        data = base64.b64decode(payload.file_base64, validate=True)
        cv = extract(data, payload.file_type)
        return analyze(cv, payload.jd)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(422, "CV could not be parsed") from exc
