import { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { API_URL } from "../../utils/apiConfig";
import { resumeService } from "../../services/resumeService";
import { Button, Card, Select } from "../ui";

/** Translated label for a requirement match status (matched / contradicted / anything else = unverified). */
const useStatusLabel = () => {
  const { t } = useTranslation("candidate");
  return (status) =>
    status === "matched" ? t("match.matched") : status === "contradicted" ? t("match.contradicted") : t("match.unverified");
};

const RequirementGroup = ({ title, items }) => {
  const statusText = useStatusLabel();
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h3 className="font-semibold text-ink">{title}</h3>
      <p className="text-sm text-muted">{items.map((item) => `${item.requirement}: ${statusText(item.status)}`).join(" · ")}</p>
    </div>
  );
};

/**
 * Experimental CV-vs-job analysis (shown only when VITE_CVJD_MATCHING_ENABLED=true and the user is a candidate).
 * Behaviour and API calls are unchanged; the copy is bilingual (candidate:match.*).
 */
export default function JobMatchAnalysis({ jobId }) {
  const { t } = useTranslation("candidate");
  const statusText = useStatusLabel();
  const [resumes, setResumes] = useState([]);
  const [resumeId, setResumeId] = useState("");
  const [status, setStatus] = useState("loading-resumes");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    resumeService
      .getMyResumes()
      .then((response) => {
        if (!active) return;
        const list = response.data || [];
        setResumes(list);
        setResumeId(String(list.find((r) => r.isDefault)?.id || list[0]?.id || ""));
        setStatus("idle");
      })
      .catch(() => {
        if (active) setStatus("resume-error");
      });
    return () => {
      active = false;
    };
  }, []);

  async function analyze() {
    if (!resumeId) return;
    setStatus("analyzing");
    setError("");
    setResult(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/matches/jobs/${jobId}/resumes/${resumeId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` }, timeout: 25000 }
      );
      setResult(response.data.data);
      setStatus("complete");
    } catch (err) {
      setError(err.response?.status === 503 ? t("match.unavailable") : t("match.failed"));
      setStatus("error");
    }
  }

  const experienceText =
    result?.experience.status === "matched" ? t("match.expMatched") : result?.experience.status === "partial" ? t("match.expPartial") : t("match.expUnverified");

  return (
    <Card as="section" padding="md" className="mb-6" aria-labelledby="cvjd-title">
      <h2 id="cvjd-title" className="text-xl font-bold text-ink">{t("match.title")}</h2>
      <p className="mt-2 text-sm text-muted">{t("match.disclaimer")}</p>
      {status === "loading-resumes" && <p role="status" className="mt-4 text-muted">{t("match.loadingResumes")}</p>}
      {status === "resume-error" && <p role="alert" className="mt-4 font-medium text-danger">{t("match.resumeError")}</p>}
      {status === "idle" && resumes.length === 0 && <p className="mt-4 text-muted">{t("match.needResume")}</p>}
      {resumes.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Select
            className="flex-1"
            label={t("match.chooseResume")}
            value={resumeId}
            onChange={(e) => {
              setResumeId(e.target.value);
              setResult(null);
              setStatus("idle");
            }}
          >
            {resumes.map((resume) => (
              <option value={resume.id} key={resume.id}>{resume.name}</option>
            ))}
          </Select>
          <Button onClick={analyze} loading={status === "analyzing"}>
            {status === "analyzing" ? t("match.analyzing") : status === "error" ? t("common.retry") : t("match.analyze")}
          </Button>
        </div>
      )}
      {error && <p role="alert" className="mt-3 font-medium text-danger">{error}</p>}
      {result && (
        <div aria-live="polite" className="mt-5 space-y-4 text-ink">
          <p className="text-lg font-bold">{t("match.score", { score: result.overallScore })}</p>
          <p className="text-sm">
            {t("match.components", {
              relevance: result.componentScores.neuralRelevance,
              skills: result.componentScores.requiredSkills ?? t("match.undetermined"),
            })}
          </p>
          <ul className="space-y-2">
            {result.required.map((item) => (
              <li className="rounded-control border border-line p-3" key={item.requirement}>
                <strong>{item.requirement}</strong> — {statusText(item.status)}
                {item.evidence && <blockquote className="mt-1 text-sm text-muted">“{item.evidence}”</blockquote>}
              </li>
            ))}
          </ul>
          <RequirementGroup title={t("match.preferred")} items={result.preferred} />
          <RequirementGroup title={t("match.unspecified")} items={result.unspecified} />
          <p className="text-sm">
            {t("match.experience")}: {experienceText}. {t("match.education")}: {result.education.status === "matched" ? t("match.matched") : t("match.unverified")}.
          </p>
          {result.recommendations.length > 0 && (
            <div>
              <h3 className="font-semibold">{t("match.recommendations")}</h3>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {result.recommendations.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-muted">{result.limitations.join(" ")}</p>
        </div>
      )}
    </Card>
  );
}
