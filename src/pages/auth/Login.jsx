import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiLogIn, FiMail } from "react-icons/fi";
import { toast } from "react-toastify";
import useAuth from "../../hooks/useAuth";
import { Button, Input } from "../../components/ui";
import AuthShell from "./AuthShell";
import PasswordField from "./PasswordField";
import { translateAuthError } from "./auth-api-errors";

const Login = () => {
  const { t } = useTranslation("auth");
  const { login } = useAuth();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: "", password: "" });
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
    if (!formData.email.trim()) errors.email = t("validation.emailRequired");
    else if (!formData.email.includes("@")) errors.email = t("validation.emailInvalid");
    if (!formData.password) errors.password = t("validation.passwordRequired");
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const params = new URLSearchParams(location.search);
      const returnTo = location.state?.from || params.get("redirect") || null;
      const { success, error } = await login(formData.email, formData.password, { returnTo });

      if (success) {
        toast.success(t("login.success"));
        // AuthContext already redirects based on the user's role / return path.
      } else {
        const message = translateAuthError(t, error, "invalidCredentials");
        setFormError(message);
        toast.error(message);
      }
    } catch (error) {
      console.error("Login error:", error);
      const message = t("apiErrors.loginFailed");
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell mode="login">
      <form onSubmit={handleSubmit} noValidate className="space-y-5" data-testid="login-form">
        <h2 className="hidden text-2xl font-extrabold text-ink lg:block">{t("login.heading")}</h2>

        {formError && (
          <p role="alert" className="rounded-control border border-danger/30 bg-danger/10 p-3 text-sm font-medium text-danger">
            {formError}
          </p>
        )}

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
          autoComplete="current-password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          error={fieldErrors.password}
        />

        <Button type="submit" size="lg" fullWidth loading={isSubmitting} leftIcon={<FiLogIn />}>
          {isSubmitting ? t("login.submitting") : t("login.submit")}
        </Button>

        <p className="text-center text-muted">
          {t("login.noAccount")}{" "}
          <Link to="/register" className="font-semibold text-primary-text underline-offset-4 hover:underline">
            {t("login.createAccount")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
};

export default Login;
