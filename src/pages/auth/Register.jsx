import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiMail, FiUser, FiUserPlus } from "react-icons/fi";
import { toast } from "react-toastify";
import useAuth from "../../hooks/useAuth";
import { Button, Input } from "../../components/ui";
import AuthShell from "./AuthShell";
import PasswordField from "./PasswordField";
import RegisterRoleChoice from "./RegisterRoleChoice";
import { translateAuthError } from "./auth-api-errors";

const MIN_PASSWORD_LENGTH = 6; // enforced by the backend as well

const Register = () => {
  const { t } = useTranslation("auth");
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "jobseeker",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = t("validation.nameRequired");
    if (!formData.email.trim()) errors.email = t("validation.emailRequired");
    else if (!formData.email.includes("@")) errors.email = t("validation.emailInvalid");
    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      errors.password = t("validation.passwordShort", { min: MIN_PASSWORD_LENGTH });
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t("validation.passwordMismatch");
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const { success, error } = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      if (success) {
        toast.success(t("register.success"));
        // AuthContext already redirects based on the new account's role.
      } else {
        const message = translateAuthError(t, error, "registerFailed");
        setFormError(message);
        toast.error(message);
      }
    } catch (error) {
      console.error("Registration error:", error);
      const message = t("apiErrors.registerFailed");
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell mode="register">
      <form onSubmit={handleSubmit} noValidate className="space-y-5" data-testid="register-form">
        <h2 className="hidden text-2xl font-extrabold text-ink lg:block">{t("register.heading")}</h2>

        {formError && (
          <p role="alert" className="rounded-control border border-danger/30 bg-danger/10 p-3 text-sm font-medium text-danger">
            {formError}
          </p>
        )}

        <RegisterRoleChoice value={formData.role} onChange={handleChange} />

        <Input
          id="name"
          name="name"
          label={t("fields.name")}
          autoComplete="name"
          required
          leftIcon={<FiUser />}
          placeholder={t("fields.namePlaceholder")}
          value={formData.name}
          onChange={handleChange}
          error={fieldErrors.name}
        />
        <Input
          id="email"
          name="email"
          type="email"
          label={t("fields.email")}
          autoComplete="email"
          required
          leftIcon={<FiMail />}
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          error={fieldErrors.email}
        />
        <PasswordField
          id="password"
          name="password"
          label={t("fields.password")}
          autoComplete="new-password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          error={fieldErrors.password}
        />
        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label={t("fields.confirmPassword")}
          autoComplete="new-password"
          placeholder="••••••••"
          toggleLabels={{ show: t("password.showConfirm"), hide: t("password.hideConfirm") }}
          value={formData.confirmPassword}
          onChange={handleChange}
          error={fieldErrors.confirmPassword}
        />

        <Button type="submit" size="lg" fullWidth loading={isSubmitting} leftIcon={<FiUserPlus />}>
          {isSubmitting ? t("register.submitting") : t("register.submit")}
        </Button>

        <p className="text-center text-muted">
          {t("register.haveAccount")}{" "}
          <Link to="/login" className="font-semibold text-primary-text underline-offset-4 hover:underline">
            {t("register.signIn")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
};

export default Register;
