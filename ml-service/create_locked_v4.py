"""Second locked semantic set, authored before character-tokenizer experiments."""
import argparse
import hashlib
import json
from pathlib import Path

ROLES = [
 ("Mechanical Engineer", ["CAD", "SolidWorks", "Manufacturing"], "3D CAD", "thiết kế máy"),
 ("Legal Counsel", ["Contract law", "Compliance", "Negotiation"], "contract review", "hợp đồng doanh nghiệp"),
 ("Pharmacist", ["Pharmacy", "Prescription review", "Patient counseling"], "medication review", "dược lâm sàng"),
 ("Procurement Specialist", ["Sourcing", "Vendor management", "Cost analysis"], "supplier management", "mua hàng chiến lược"),
 ("Architect", ["AutoCAD", "Building codes", "Design"], "computer-aided design", "thiết kế công trình"),
 ("Customer Support Lead", ["Ticketing", "SLA", "Team coaching"], "service-level agreements", "dịch vụ khách hàng"),
 ("Business Analyst", ["Requirements analysis", "BPMN", "Stakeholder management"], "process modeling", "chuyển đổi quy trình"),
 ("Research Scientist", ["Experiment design", "Statistics", "Scientific writing"], "experimental design", "nghiên cứu ứng dụng"),
 ("Video Editor", ["Premiere Pro", "Color grading", "Storytelling"], "Adobe Premiere", "sản xuất video"),
 ("Operations Manager", ["Process improvement", "KPI", "People management"], "continuous improvement", "vận hành chuỗi"),
 ("Electrician", ["Electrical wiring", "Safety", "Troubleshooting"], "wiring systems", "bảo trì điện"),
 ("Translator", ["Translation", "Localization", "Terminology"], "language localization", "bản địa hóa phần mềm"),
]


def build(index, role, req, alias, project, scenario, language):
    vi = language == "vi"
    jd = (f"Cần tuyển {role} cho {project}. Điều kiện cốt lõi gồm {', '.join(req)}; yêu cầu minh chứng qua công việc đã hoàn thành."
          if vi else f"Hiring a {role} for {project}. Core criteria are {', '.join(req)}, supported by completed work evidence.")
    values = {"complete":(1,1.0), "equivalent":(1,.9), "balanced":(1,.65), "buried":(1,.9),
              "junior":(0,.3), "denied":(0,.05), "course":(0,.2), "different":(0,0.0)}
    label,grade = values[scenario]
    if scenario == "complete": text = f"{role}. Completed {project} using {', '.join(req)} with documented results."
    elif scenario == "equivalent": text = f"Delivered {project}; practical toolkit: {alias}, {', '.join(req[1:])}."
    elif scenario == "balanced": text = f"Worked in the {role} domain with evidence for {', '.join(req[:2])}; {req[-1]} is not documented."
    elif scenario == "buried": text = ("General biography and unrelated organizational history. "*180) + f"Evidence section: delivered {project} with {', '.join(req)}."
    elif scenario == "junior": text = f"Observed a {role} team for eight weeks. Saw {', '.join(req)} but did not own deliverables."
    elif scenario == "denied": text = f"I explicitly have no hands-on experience with {', '.join(req)}; the terms below are references only."
    elif scenario == "course": text = f"Enrolled in introductory lessons about {', '.join(req)}. No completed work or project evidence."
    else: text = "Managed restaurant schedules, cash handling and front-desk enquiries; experience is in a different field."
    if vi:
        text = {"complete":f"Đã hoàn thành {project} bằng {', '.join(req)}, có kết quả được ghi nhận.",
          "equivalent":f"Thực hiện {project}; công cụ thực tế gồm {alias}, {', '.join(req[1:])}.",
          "balanced":f"Đúng lĩnh vực {role}, có minh chứng cho {', '.join(req[:2])}; chưa có minh chứng về {req[-1]}.",
          "buried":("Tiểu sử và thông tin tổ chức không liên quan. "*180)+f"Phần minh chứng: hoàn thành {project} với {', '.join(req)}.",
          "junior":f"Quan sát nhóm {role} trong tám tuần, thấy {', '.join(req)} nhưng chưa tự chịu trách nhiệm.",
          "denied":f"Tôi xác nhận chưa từng thực hành {', '.join(req)}; các thuật ngữ chỉ để tham khảo.",
          "course":f"Đang học khóa nhập môn về {', '.join(req)}; chưa có sản phẩm hoặc dự án hoàn thành.",
          "different":"Lập lịch nhà hàng, thu ngân và tiếp nhận khách; kinh nghiệm thuộc lĩnh vực khác."}[scenario]
    rationale = {"complete":"complete practical evidence", "equivalent":"equivalent term and practical evidence",
      "balanced":"two of three criteria evidenced", "buried":"complete evidence late in long text",
      "junior":"observation below required ownership", "denied":"explicit lack of practice",
      "course":"education only", "different":"unrelated field"}[scenario]
    return {"id":f"v4-{index:02d}-{scenario}-{language}","cv":text,"jd":jd,"label":label,"grade":grade,
      "cv_group":f"v4-cv-{index}-{scenario}","jd_group":f"v4-jd-{index}","source_id":f"v4:{index}:{scenario}",
      "label_kind":scenario,"language":language,"role":role,"required":req,"label_rationale":rationale,
      "rubric_version":"semantic-v2"}


def main():
    p=argparse.ArgumentParser();p.add_argument("--output",required=True);args=p.parse_args()
    scenarios=("complete","equivalent","balanced","buried","junior","denied","course","different")
    rows=[]
    for index,spec in enumerate(ROLES):
        rows.extend(build(index,*spec,scenario,"vi" if index%2 else "en") for scenario in scenarios)
    out=Path(args.output);out.write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in rows),encoding="utf-8")
    print(json.dumps({"pairs":len(rows),"positive":sum(r["label"] for r in rows),
      "sha256":hashlib.sha256(out.read_bytes()).hexdigest()}))


if __name__=="__main__": main()
