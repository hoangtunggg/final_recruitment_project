import { useTranslation } from "react-i18next";
import { FaCheckCircle } from "react-icons/fa";
import { Badge, Card } from "../../../components/ui";
import { splitListItems } from "../../../components/jobs/job-format-helpers";

const BulletList = ({ items }) => (
  <ul className="space-y-2.5">
    {items.map((item, index) => (
      <li key={`${index}-${item}`} className="flex items-start gap-3 text-ink">
        <FaCheckCircle className="mt-1 shrink-0 text-primary-500" aria-hidden="true" />
        <span className="break-words">{item}</span>
      </li>
    ))}
  </ul>
);

const Section = ({ title, children }) => (
  <Card padding="lg" as="section">
    <h2 className="mb-4 text-xl font-bold text-ink">{title}</h2>
    {children}
  </Card>
);

/** Description, responsibilities, requirements, skills and benefits (each only when present). */
const JobDetailBody = ({ job }) => {
  const { t } = useTranslation("public");
  const responsibilities = splitListItems(job.responsibilities);
  const requirements = splitListItems(job.requirements);
  const benefits = splitListItems(job.benefits);
  const skills = splitListItems(job.skills);

  return (
    <div className="space-y-6">
      {job.description && (
        <Section title={t("jobDetail.sections.description")}>
          <p className="whitespace-pre-line break-words leading-relaxed text-ink">{job.description}</p>
        </Section>
      )}
      {responsibilities.length > 0 && (
        <Section title={t("jobDetail.sections.responsibilities")}>
          <BulletList items={responsibilities} />
        </Section>
      )}
      {requirements.length > 0 && (
        <Section title={t("jobDetail.sections.requirements")}>
          <BulletList items={requirements} />
        </Section>
      )}
      {skills.length > 0 && (
        <Section title={t("jobDetail.sections.skills")}>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge key={skill} tone="primary">
                {skill}
              </Badge>
            ))}
          </div>
        </Section>
      )}
      {benefits.length > 0 && (
        <Section title={t("jobDetail.sections.benefits")}>
          <BulletList items={benefits} />
        </Section>
      )}
    </div>
  );
};

export default JobDetailBody;
