import { useTranslation } from "react-i18next";
import { FiBriefcase, FiUser } from "react-icons/fi";
import { cx } from "../../components/ui";

const ROLES = [
  { value: "jobseeker", icon: FiUser },
  { value: "employer", icon: FiBriefcase },
];

/** Radio-card choice between the two self-service account types (values sent to the API unchanged). */
const RegisterRoleChoice = ({ value, onChange }) => {
  const { t } = useTranslation("auth");
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-ink">{t("fields.accountType")}</legend>
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
        {ROLES.map((item) => {
          const role = item.value;
          const Icon = item.icon;
          const selected = value === role;
          return (
            <label
              key={role}
              className={cx(
                "flex min-h-16 cursor-pointer items-center gap-3 rounded-card border p-3 transition-colors focus-within:shadow-focus",
                selected ? "border-primary-500 bg-tint" : "border-line bg-surface hover:border-primary-300"
              )}
            >
              <input
                type="radio"
                name="role"
                value={role}
                checked={selected}
                onChange={onChange}
                className="sr-only"
                data-testid={`role-${role}`}
              />
              <span
                aria-hidden="true"
                className={cx(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  selected ? "bg-primary-600 text-white" : "bg-tint text-primary-text"
                )}
              >
                <Icon />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-ink">{t(`roles.${role}.title`)}</span>
                <span className="block text-sm text-muted">{t(`roles.${role}.hint`)}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};

export default RegisterRoleChoice;
