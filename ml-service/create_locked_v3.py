"""Create a fixed, independently authored semantic evaluation set before v3 training."""
import argparse
import hashlib
import json
from pathlib import Path

ROLES = [
    ("Frontend Engineer", ["React", "TypeScript", "CSS"], "Senior", "ReactJS", "giao diện thương mại"),
    ("Backend Engineer", ["Node.js", "SQL", "Docker"], "Mid", "NodeJS", "dịch vụ thanh toán"),
    ("Data Analyst", ["Python", "SQL", "Power BI"], "Mid", "PowerBI", "báo cáo vận hành"),
    ("Cloud Engineer", ["AWS", "Terraform", "Linux"], "Senior", "Amazon Web Services", "hạ tầng đa vùng"),
    ("QA Engineer", ["Selenium", "API testing", "Git"], "Mid", "Selenium WebDriver", "kiểm thử hồi quy"),
    ("Product Designer", ["Figma", "User research", "Prototyping"], "Senior", "Figma Design", "nghiên cứu người dùng"),
    ("Accountant", ["Accounting", "Excel", "Tax"], "Mid", "Microsoft Excel", "quyết toán thuế"),
    ("Sales Executive", ["CRM", "Negotiation", "Sales"], "Mid", "customer relationship management", "bán hàng B2B"),
    ("HR Specialist", ["Recruitment", "Onboarding", "Labor law"], "Mid", "talent acquisition", "tuyển dụng kỹ thuật"),
    ("Logistics Coordinator", ["Inventory", "Shipping", "Warehouse"], "Mid", "inventory management", "điều phối kho"),
    ("Nurse", ["Patient care", "Triage", "Clinical records"], "Senior", "patient-care", "chăm sóc nội trú"),
    ("Teacher", ["Teaching", "Lesson planning", "Assessment"], "Mid", "instruction", "chương trình trung học"),
    ("Mobile Engineer", ["Kotlin", "Android", "REST APIs"], "Senior", "Android SDK", "ứng dụng ngân hàng"),
    ("DevOps Engineer", ["Kubernetes", "CI/CD", "Monitoring"], "Senior", "K8s", "nền tảng triển khai"),
    ("Security Analyst", ["SIEM", "Incident response", "Network security"], "Mid", "security information and event management", "ứng phó sự cố"),
    ("Marketing Specialist", ["SEO", "Content marketing", "Analytics"], "Mid", "search engine optimization", "chiến dịch tăng trưởng"),
]


def case(role_index, scenario, language, role, required, seniority, alias, project):
    vi = language == "vi"
    jd = (f"Vị trí {role}. Cấp độ {seniority}. Kỹ năng bắt buộc: {', '.join(required)}. "
          f"Ứng viên phải có minh chứng từ dự án thực tế. Bối cảnh: {project}."
          if vi else
          f"Position: {role}. Seniority: {seniority}. Must demonstrate {', '.join(required)} "
          f"through practical work. Context: {project}.")
    positive = scenario in {"strong", "alias_project", "partial", "long_relevant"}
    grade = {"strong":1.0, "alias_project":.9, "partial":.6, "long_relevant":.9,
             "seniority_gap":.35, "contradiction":.05, "learning_only":.2, "unrelated":0.0}[scenario]
    if scenario == "strong":
        cv = (f"Đã làm {role} cấp {seniority}. Thành thạo {', '.join(required)}. Dự án {project} đã vận hành thực tế."
              if vi else f"Worked as a {seniority} {role}. Used {', '.join(required)} in a deployed {project} project.")
    elif scenario == "alias_project":
        skills = [alias, *required[1:]]
        cv = (f"Kinh nghiệm thực hành: {', '.join(skills)}. Chịu trách nhiệm dự án {project} từ thiết kế đến vận hành."
              if vi else f"Hands-on with {', '.join(skills)}. Owned a live {project} project from design through support.")
    elif scenario == "partial":
        cv = (f"Đúng vai trò {role}; có kinh nghiệm thực tế với {', '.join(required[:2])}, chưa có minh chứng cho {required[-1]}."
              if vi else f"Same {role} role; practical evidence for {', '.join(required[:2])}, no evidence yet for {required[-1]}.")
    elif scenario == "long_relevant":
        filler = ("Thông tin hành chính và mô tả tổ chức không liên quan. " if vi else "Unrelated organization and administrative background. ") * 170
        evidence = (f"Minh chứng liên quan: đã dùng {', '.join(required)} trong dự án {project}."
                    if vi else f"Relevant evidence: used {', '.join(required)} in the deployed {project} project.")
        cv = filler + evidence
    elif scenario == "seniority_gap":
        cv = (f"Mới bắt đầu vai trò {role}; 3 tháng quan sát công việc với {', '.join(required)} và chưa tự chịu trách nhiệm dự án."
              if vi else f"Entry-level {role}; three months observing {', '.join(required)} with no independent project ownership.")
    elif scenario == "contradiction":
        cv = (f"Không sử dụng và chưa từng thực hành {', '.join(required)}; các từ này chỉ được sao chép từ mô tả việc làm."
              if vi else f"Never used or practiced {', '.join(required)}; these terms were copied from the job description.")
    elif scenario == "learning_only":
        cv = (f"Hiện chỉ đang học {', '.join(required)} qua bài hướng dẫn; chưa có dự án hoặc kinh nghiệm làm việc."
              if vi else f"Currently learning {', '.join(required)} through tutorials only; no project or work experience.")
    else:
        cv = ("Kinh nghiệm vận hành cửa hàng và dịch vụ khách hàng; không có kỹ năng hoặc dự án liên quan."
              if vi else "Retail operations and customer service experience; no related skills or projects.")
    rationale = {"strong":"All requirements have practical evidence", "alias_project":"Equivalent alias plus project evidence",
                 "partial":"Two of three requirements have practical evidence", "long_relevant":"All evidence exists late in a long document",
                 "seniority_gap":"Exposure does not satisfy senior ownership", "contradiction":"Explicit contradiction overrides keywords",
                 "learning_only":"Learning is not practical evidence", "unrelated":"No relevant evidence"}[scenario]
    return {"id":f"v3-{role_index:02d}-{scenario}-{language}", "cv":cv, "jd":jd, "label":int(positive),
            "grade":grade, "cv_group":f"locked-cv-{role_index}-{scenario}-{language}",
            "jd_group":f"locked-jd-{role_index}-{language}", "source_id":f"locked:{role_index}:{scenario}:{language}",
            "label_kind":scenario, "language":language, "role":role, "required":required,
            "label_rationale":rationale, "rubric_version":"semantic-v1"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    scenarios = ("strong", "alias_project", "partial", "long_relevant", "seniority_gap", "contradiction", "learning_only", "unrelated")
    rows = []
    for index, spec in enumerate(ROLES):
        language = "vi" if index % 2 else "en"
        rows.extend(case(index, scenario, language, *spec) for scenario in scenarios)
    destination = Path(args.output)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows), encoding="utf-8")
    print(json.dumps({"pairs":len(rows), "jd_groups":len({r['jd_group'] for r in rows}),
                      "positive":sum(r["label"] for r in rows), "languages":sorted({r['language'] for r in rows}),
                      "sha256":hashlib.sha256(destination.read_bytes()).hexdigest()}))


if __name__ == "__main__":
    main()
