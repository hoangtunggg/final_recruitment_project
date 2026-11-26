import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../utils/apiConfig";
import { resumeService } from "../../services/resumeService";

export default function JobMatchAnalysis({ jobId }) {
  const [resumes, setResumes] = useState([]);
  const [resumeId, setResumeId] = useState("");
  const [status, setStatus] = useState("loading-resumes");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    resumeService.getMyResumes().then((response) => {
      if (!active) return;
      const list = response.data || [];
      setResumes(list);
      setResumeId(String(list.find((r) => r.isDefault)?.id || list[0]?.id || ""));
      setStatus("idle");
    }).catch(() => {
      if (active) setStatus("resume-error");
    });
    return () => { active = false; };
  }, []);

  async function analyze() {
    if (!resumeId) return;
    setStatus("analyzing");
    setError("");
    setResult(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API_URL}/matches/jobs/${jobId}/resumes/${resumeId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }, timeout: 25000,
      });
      setResult(response.data.data);
      setStatus("complete");
    } catch (err) {
      setError(err.response?.status === 503
        ? "Phân tích CV hiện chưa khả dụng. Vui lòng thử lại sau."
        : err.response?.data?.error || "Không thể phân tích lúc này. Hãy thử lại sau.");
      setStatus("error");
    }
  }

  return (
    <section aria-labelledby="cvjd-title" className="mb-5 rounded-xl border border-slate-300 bg-white p-5 dark:border-gray-600 dark:bg-gray-800 sm:p-6">
      <h2 id="cvjd-title" className="text-xl font-semibold text-slate-900 dark:text-white">Phân tích CV với công việc</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-gray-300">Tính năng thử nghiệm. Điểm phù hợp không phải xác suất được tuyển dụng.</p>
      {status === "loading-resumes" && <p role="status" className="mt-4 text-slate-600 dark:text-gray-300">Đang tải CV…</p>}
      {status === "resume-error" && <p role="alert" className="mt-4 text-red-700 dark:text-red-300">Không tải được danh sách CV. Vui lòng tải lại trang.</p>}
      {status === "idle" && resumes.length === 0 && <p className="mt-4 text-slate-600 dark:text-gray-300">Bạn cần tải CV lên trước khi phân tích.</p>}
      {resumes.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm font-medium text-slate-700 dark:text-gray-200">Chọn CV
            <select value={resumeId} onChange={(e) => { setResumeId(e.target.value); setResult(null); setStatus("idle"); }}
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700 dark:border-gray-600 dark:bg-gray-900 dark:text-white">
              {resumes.map((resume) => <option value={resume.id} key={resume.id}>{resume.name}</option>)}
            </select>
          </label>
          <button type="button" onClick={analyze} disabled={status === "analyzing"}
            className="min-h-11 rounded-lg bg-blue-700 px-5 font-semibold text-white hover:bg-blue-800 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
            {status === "analyzing" ? "Đang phân tích…" : status === "error" ? "Thử lại" : "Phân tích CV"}
          </button>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-red-700 dark:text-red-300">{error}</p>}
      {result && <div aria-live="polite" className="mt-5 space-y-4 text-slate-800 dark:text-gray-100">
        <p className="text-lg font-semibold">Điểm phù hợp thử nghiệm: {result.overallScore}/100</p>
        <p className="text-sm">Liên quan nội dung: {result.componentScores.neuralRelevance}/100 · Kỹ năng bắt buộc: {result.componentScores.requiredSkills ?? "Chưa xác định"}/100</p>
        <ul className="space-y-2">{result.required.map((item) => <li className="rounded-lg border border-slate-200 p-3 dark:border-gray-600" key={item.requirement}>
          <strong>{item.requirement}</strong> — {item.status === "matched" ? "Có bằng chứng" : item.status === "contradicted" ? "CV phủ định" : "Chưa xác minh"}
          {item.evidence && <blockquote className="mt-1 text-sm text-slate-600 dark:text-gray-300">“{item.evidence}”</blockquote>}
        </li>)}</ul>
        {result.preferred.length > 0 && <div><h3 className="font-semibold">Kỹ năng ưu tiên</h3><p className="text-sm">{result.preferred.map((item) => `${item.requirement}: ${item.status === "matched" ? "có bằng chứng" : "chưa xác minh"}`).join(" · ")}</p></div>}
        {result.unspecified.length > 0 && <div><h3 className="font-semibold">Kỹ năng chưa rõ mức ưu tiên trong JD</h3><p className="text-sm">{result.unspecified.map((item) => `${item.requirement}: ${item.status === "matched" ? "có bằng chứng" : "chưa xác minh"}`).join(" · ")}</p></div>}
        <p className="text-sm">Kinh nghiệm: {result.experience.status === "matched" ? "có bằng chứng phù hợp" : result.experience.status === "partial" ? "chưa đạt số năm nêu trong JD" : "chưa xác minh"}. Học vấn: {result.education.status === "matched" ? "có bằng chứng" : "chưa xác minh"}.</p>
        {result.recommendations.length > 0 && <div><h3 className="font-semibold">Gợi ý cải thiện CV</h3><ul className="mt-2 list-disc pl-5 text-sm">{result.recommendations.map((text) => <li key={text}>{text}</li>)}</ul></div>}
        <p className="text-xs text-slate-600 dark:text-gray-300">{result.limitations.join(" ")}</p>
      </div>}
    </section>
  );
}
