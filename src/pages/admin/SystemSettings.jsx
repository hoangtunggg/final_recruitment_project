import React, { useState, useEffect } from "react";
import {
  FiSettings,
  FiMail,
  FiLock,
  FiCreditCard,
  FiStar,
  FiBell,
  FiSave,
  FiEye,
  FiEyeOff,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiShield,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import settingService from "../../services/settingService";
import { Button, PageHeader } from "../../components/ui";

const DEFAULT_SETTINGS = {
  general: {
    siteName: "Job Portal",
    siteDescription: "Find your dream job today",
    contactEmail: "admin@jobportal.com",
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
  },
  email: {
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUser: "noreply@jobportal.com",
    smtpPassword: "••••••••••",
    emailFromName: "Job Portal Team",
    emailFromAddress: "noreply@jobportal.com",
    enableEmailNotifications: true,
  },
  security: {
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    enableTwoFactorAuth: false,
  },
  subscriptions: {
    freePlan: {
      name: "Free",
      price: 0,
      jobPostings: 5,
      featuredJobs: 0,
      resumeViews: 50,
      duration: "30 days",
    },
    basicPlan: {
      name: "Basic",
      price: 29,
      jobPostings: 25,
      featuredJobs: 2,
      resumeViews: 500,
      duration: "30 days",
    },
    premiumPlan: {
      name: "Premium",
      price: 79,
      jobPostings: 100,
      featuredJobs: 10,
      resumeViews: 2000,
      duration: "30 days",
    },
    enterprisePlan: {
      name: "Enterprise",
      price: 199,
      jobPostings: "Unlimited",
      featuredJobs: 25,
      resumeViews: "Unlimited",
      duration: "30 days",
    },
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    newJobAlerts: true,
    applicationUpdates: true,
    systemAlerts: true,
    marketingEmails: false,
  },
  featuredJobs: {
    enableFeaturedJobs: true,
    maxFeaturedJobs: 50,
    featuredJobPrice: 25,
    featuredDuration: 7,
    autoRenewFeatured: false,
  },
};

const SystemSettings = () => {
  const { t } = useTranslation("adminOps");
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [showPasswords, setShowPasswords] = useState({
    smtp: false,
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await settingService.getSettings();
      if (res.success && res.data) {
        setSettings((prev) => ({
          ...prev,
          ...res.data,
        }));
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
      setError(err.response?.data?.error || t("settings.errors.load"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSettingChange = (category, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const res = await settingService.updateSettings(settings);
      if (res.success && res.data) {
        setSettings((prev) => ({
          ...prev,
          ...res.data,
        }));
        setSuccessMessage(t("settings.feedback.saved"));
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError(err.response?.data?.error || t("settings.errors.save"));
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = async (category) => {
    const tabLabel = t(`settings.tabs.${category}`, { defaultValue: category });
    if (!window.confirm(t("settings.confirmReset", { tab: tabLabel }))) {
      return;
    }

    try {
      setResetting(true);
      setError(null);
      setSuccessMessage(null);

      const res = await settingService.resetSettings(category);
      if (res.success && res.data) {
        setSettings((prev) => ({
          ...prev,
          ...res.data,
        }));
        setSuccessMessage(t("settings.feedback.resetDone", { tab: tabLabel }));
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error(`Failed to reset ${category} settings:`, err);
      setError(err.response?.data?.error || t("settings.errors.reset", { tab: tabLabel }));
    } finally {
      setResetting(false);
    }
  };

  const tabs = [
    { id: "general", icon: FiSettings },
    { id: "email", icon: FiMail },
    { id: "security", icon: FiLock },
    { id: "subscriptions", icon: FiCreditCard },
    { id: "notifications", icon: FiBell },
    { id: "featured", icon: FiStar },
  ];

  // Plan values come from the API as free text; translate the known ones.
  const planValue = (v) => (v === "Unlimited" ? t("settings.subscriptions.unlimited") : v);
  const planDuration = (v) => {
    const match = /^(\d+)\s*days?$/i.exec(String(v));
    return match ? t("settings.subscriptions.days", { n: match[1] }) : v;
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-muted text-sm">{t("settings.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        title={t("settings.title")}
        subtitle={t("settings.subtitle")}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSettings}
            disabled={loading || saving}
            leftIcon={<FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}
          >
            {t("settings.reload")}
          </Button>
        }
      />

      {/* Security notice */}
      <div className="flex items-start p-4 text-sm rounded-lg border bg-primary-50 dark:bg-primary-900/40 text-primary-text border-tint-line">
        <FiShield className="w-5 h-5 mr-3 flex-shrink-0 text-primary-text mt-0.5" />
        <div>
          <span className="font-semibold">{t("settings.noticeLabel")}</span> {t("settings.noticeBody")}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div role="alert" className="p-4 rounded-lg bg-danger/10 border border-danger/30 flex items-start text-sm text-danger">
          <FiAlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">{t("settings.errorLabel")}</span> {error}
          </div>
        </div>
      )}

      {successMessage && (
        <div role="status" className="p-4 rounded-lg bg-success/10 border border-success/30 flex items-start text-sm text-success">
          <FiCheckCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
        </div>
      )}

      {/* Settings Card */}
      <div className="bg-surface rounded-card shadow-card border border-tint-line overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-line overflow-x-auto">
          <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 min-w-max" aria-label={t("settings.tabsLabel")}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                    isActive
                      ? "border-primary-600 text-primary-text"
                      : "border-transparent text-muted hover:text-ink hover:border-line-strong"
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {t(`settings.tabs.${tab.id}`)}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* General Tab */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    {t("settings.general.siteName")}
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2 border border-line rounded-lg bg-surface text-ink text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    value={settings.general.siteName || ""}
                    onChange={(e) => handleSettingChange("general", "siteName", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    {t("settings.general.contactEmail")}
                  </label>
                  <input
                    type="email"
                    className="w-full px-3.5 py-2 border border-line rounded-lg bg-surface text-ink text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    value={settings.general.contactEmail || ""}
                    onChange={(e) => handleSettingChange("general", "contactEmail", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  {t("settings.general.siteDescription")}
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3.5 py-2 border border-line rounded-lg bg-surface text-ink text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={settings.general.siteDescription || ""}
                  onChange={(e) => handleSettingChange("general", "siteDescription", e.target.value)}
                />
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="maintenanceMode"
                    className="h-4 w-4 accent-primary-600 focus:ring-primary-500 border-line rounded"
                    checked={Boolean(settings.general.maintenanceMode)}
                    onChange={(e) => handleSettingChange("general", "maintenanceMode", e.target.checked)}
                  />
                  <label htmlFor="maintenanceMode" className="ml-2.5 text-sm text-ink">
                    {t("settings.general.maintenanceMode")}
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allowRegistration"
                    className="h-4 w-4 accent-primary-600 focus:ring-primary-500 border-line rounded"
                    checked={Boolean(settings.general.allowRegistration)}
                    onChange={(e) => handleSettingChange("general", "allowRegistration", e.target.checked)}
                  />
                  <label htmlFor="allowRegistration" className="ml-2.5 text-sm text-ink">
                    {t("settings.general.allowRegistration")}
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requireEmailVerification"
                    className="h-4 w-4 accent-primary-600 focus:ring-primary-500 border-line rounded"
                    checked={Boolean(settings.general.requireEmailVerification)}
                    onChange={(e) => handleSettingChange("general", "requireEmailVerification", e.target.checked)}
                  />
                  <label htmlFor="requireEmailVerification" className="ml-2.5 text-sm text-ink">
                    {t("settings.general.requireEmailVerification")}
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Email Tab */}
          {activeTab === "email" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    {t("settings.email.smtpHost")}
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2 border border-line rounded-lg bg-surface text-ink text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    value={settings.email.smtpHost || ""}
                    onChange={(e) => handleSettingChange("email", "smtpHost", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    {t("settings.email.smtpPort")}
                  </label>
                  <input
                    type="number"
                    className="w-full px-3.5 py-2 border border-line rounded-lg bg-surface text-ink text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    value={settings.email.smtpPort || 587}
                    onChange={(e) => handleSettingChange("email", "smtpPort", parseInt(e.target.value, 10) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    {t("settings.email.smtpUser")}
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2 border border-line rounded-lg bg-surface text-ink text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    value={settings.email.smtpUser || ""}
                    onChange={(e) => handleSettingChange("email", "smtpUser", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    {t("settings.email.smtpPassword")}
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.smtp ? "text" : "password"}
                      className="w-full px-3.5 py-2 pr-10 border border-line rounded-lg bg-surface text-ink text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                      value={settings.email.smtpPassword || ""}
                      onChange={(e) => handleSettingChange("email", "smtpPassword", e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-muted hover:text-ink"
                      aria-label={showPasswords.smtp ? t("settings.email.hidePassword") : t("settings.email.showPassword")}
                      onClick={() => setShowPasswords((prev) => ({ ...prev, smtp: !prev.smtp }))}
                    >
                      {showPasswords.smtp ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    {t("settings.email.passwordHint")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    {t("settings.email.fromName")}
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2 border border-line rounded-lg bg-surface text-ink text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    value={settings.email.emailFromName || ""}
                    onChange={(e) => handleSettingChange("email", "emailFromName", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    {t("settings.email.fromAddress")}
                  </label>
                  <input
                    type="email"
                    className="w-full px-3.5 py-2 border border-line rounded-lg bg-surface text-ink text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    value={settings.email.emailFromAddress || ""}
                    onChange={(e) => handleSettingChange("email", "emailFromAddress", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center pt-2">
                <input
                  type="checkbox"
                  id="enableEmailNotifications"
                  className="h-4 w-4 accent-primary-600 focus:ring-primary-500 border-line rounded"
                  checked={Boolean(settings.email.enableEmailNotifications)}
                  onChange={(e) => handleSettingChange("email", "enableEmailNotifications", e.target.checked)}
                />
                <label htmlFor="enableEmailNotifications" className="ml-2.5 text-sm text-ink">
                  {t("settings.email.enableNotifications")}
                </label>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
                  {t("settings.security.passwordComplexity")}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">
                      {t("settings.security.minLength")}
                    </label>
                    <input
                      type="number"
                      min={6}
                      max={128}
                      className="w-full px-3.5 py-2 border border-line rounded-lg bg-surface text-ink text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                      value={settings.security.passwordMinLength || 8}
                      onChange={(e) =>
                        handleSettingChange("security", "passwordMinLength", parseInt(e.target.value, 10) || 8)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="reqUpper"
                      className="h-4 w-4 accent-primary-600 focus:ring-primary-500 border-line rounded"
                      checked={Boolean(settings.security.passwordRequireUppercase)}
                      onChange={(e) => handleSettingChange("security", "passwordRequireUppercase", e.target.checked)}
                    />
                    <label htmlFor="reqUpper" className="ml-2.5 text-sm text-ink">
                      {t("settings.security.requireUppercase")}
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="reqLower"
                      className="h-4 w-4 accent-primary-600 focus:ring-primary-500 border-line rounded"
                      checked={Boolean(settings.security.passwordRequireLowercase)}
                      onChange={(e) => handleSettingChange("security", "passwordRequireLowercase", e.target.checked)}
                    />
                    <label htmlFor="reqLower" className="ml-2.5 text-sm text-ink">
                      {t("settings.security.requireLowercase")}
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="reqNum"
                      className="h-4 w-4 accent-primary-600 focus:ring-primary-500 border-line rounded"
                      checked={Boolean(settings.security.passwordRequireNumbers)}
                      onChange={(e) => handleSettingChange("security", "passwordRequireNumbers", e.target.checked)}
                    />
                    <label htmlFor="reqNum" className="ml-2.5 text-sm text-ink">
                      {t("settings.security.requireNumbers")}
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="reqSpec"
                      className="h-4 w-4 accent-primary-600 focus:ring-primary-500 border-line rounded"
                      checked={Boolean(settings.security.passwordRequireSpecialChars)}
                      onChange={(e) => handleSettingChange("security", "passwordRequireSpecialChars", e.target.checked)}
                    />
                    <label htmlFor="reqSpec" className="ml-2.5 text-sm text-ink">
                      {t("settings.security.requireSpecial")}
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-line">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
                  {t("settings.security.sessionSafeguards")}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">
                      {t("settings.security.sessionTimeout")}
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={1440}
                      className="w-full px-3.5 py-2 border border-line rounded-lg bg-surface text-ink text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                      value={settings.security.sessionTimeout || 30}
                      onChange={(e) =>
                        handleSettingChange("security", "sessionTimeout", parseInt(e.target.value, 10) || 30)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">
                      {t("settings.security.maxAttempts")}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      className="w-full px-3.5 py-2 border border-line rounded-lg bg-surface text-ink text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                      value={settings.security.maxLoginAttempts || 5}
                      onChange={(e) =>
                        handleSettingChange("security", "maxLoginAttempts", parseInt(e.target.value, 10) || 5)
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center pt-4">
                  <input
                    type="checkbox"
                    id="enableTwoFactorAuth"
                    className="h-4 w-4 accent-primary-600 focus:ring-primary-500 border-line rounded"
                    checked={Boolean(settings.security.enableTwoFactorAuth)}
                    onChange={(e) => handleSettingChange("security", "enableTwoFactorAuth", e.target.checked)}
                  />
                  <label htmlFor="enableTwoFactorAuth" className="ml-2.5 text-sm text-ink">
                    {t("settings.security.twoFactor")}
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Subscriptions Tab */}
          {activeTab === "subscriptions" && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
                  {t("settings.subscriptions.heading")}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Object.entries(settings.subscriptions || {}).map(([key, plan]) => (
                    <div
                      key={key}
                      className="border border-line rounded-xl p-5 bg-tint flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-center mb-4">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-900/40 text-primary-text uppercase tracking-wide">
                            {t(`employers.plan.${String(plan.name).toLowerCase()}`, { defaultValue: String(plan.name) })}
                          </span>
                          <div className="text-2xl font-bold text-ink mt-3">
                            ${plan.price}
                            <span className="text-xs font-normal text-muted">{t("settings.subscriptions.perMonth")}</span>
                          </div>
                        </div>

                        <ul className="space-y-2 text-xs text-muted">
                          <li className="flex items-center">
                            <FiStar className="h-3.5 w-3.5 text-warning mr-2 flex-shrink-0" />
                            {t("settings.subscriptions.jobPostings", { n: planValue(plan.jobPostings) })}
                          </li>
                          <li className="flex items-center">
                            <FiStar className="h-3.5 w-3.5 text-warning mr-2 flex-shrink-0" />
                            {t("settings.subscriptions.featuredJobs", { n: planValue(plan.featuredJobs) })}
                          </li>
                          <li className="flex items-center">
                            <FiEye className="h-3.5 w-3.5 text-primary-text mr-2 flex-shrink-0" />
                            {t("settings.subscriptions.resumeViews", { n: planValue(plan.resumeViews) })}
                          </li>
                          <li className="text-muted pt-1">
                            {t("settings.subscriptions.duration", { value: planDuration(plan.duration) })}
                          </li>
                        </ul>
                      </div>

                      <div className="mt-4 pt-3 border-t border-line">
                        <label className="block text-[11px] font-medium text-muted mb-1">
                          {t("settings.subscriptions.priceLabel")}
                        </label>
                        <input
                          type="number"
                          min={0}
                          className="w-full px-2.5 py-1 text-xs border border-line rounded bg-surface text-ink"
                          value={plan.price}
                          onChange={(e) => {
                            const newPrice = parseFloat(e.target.value) || 0;
                            setSettings((prev) => ({
                              ...prev,
                              subscriptions: {
                                ...prev.subscriptions,
                                [key]: { ...plan, price: newPrice },
                              },
                            }));
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
                {t("settings.notifications.heading")}
              </h4>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="emailNotif"
                    className="h-4 w-4 accent-primary-600 focus:ring-primary-500 border-line rounded"
                    checked={Boolean(settings.notifications.emailNotifications)}
                    onChange={(e) => handleSettingChange("notifications", "emailNotifications", e.target.checked)}
                  />
                  <label htmlFor="emailNotif" className="ml-2.5 text-sm text-ink">
                    {t("settings.notifications.email")}
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="pushNotif"
                    className="h-4 w-4 accent-primary-600 focus:ring-primary-500 border-line rounded"
                    checked={Boolean(settings.notifications.pushNotifications)}
                    onChange={(e) => handleSettingChange("notifications", "pushNotifications", e.target.checked)}
                  />
                  <label htmlFor="pushNotif" className="ml-2.5 text-sm text-ink">
                    {t("settings.notifications.push")}
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="smsNotif"
                    className="h-4 w-4 accent-primary-600 focus:ring-primary-500 border-line rounded"
                    checked={Boolean(settings.notifications.smsNotifications)}
                    onChange={(e) => handleSettingChange("notifications", "smsNotifications", e.target.checked)}
                  />
                  <label htmlFor="smsNotif" className="ml-2.5 text-sm text-ink">
                    {t("settings.notifications.sms")}
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="jobAlerts"
                    className="h-4 w-4 accent-primary-600 focus:ring-primary-500 border-line rounded"
                    checked={Boolean(settings.notifications.newJobAlerts)}
                    onChange={(e) => handleSettingChange("notifications", "newJobAlerts", e.target.checked)}
                  />
                  <label htmlFor="jobAlerts" className="ml-2.5 text-sm text-ink">
                    {t("settings.notifications.jobAlerts")}
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="appUpdates"
                    className="h-4 w-4 accent-primary-600 focus:ring-primary-500 border-line rounded"
                    checked={Boolean(settings.notifications.applicationUpdates)}
                    onChange={(e) => handleSettingChange("notifications", "applicationUpdates", e.target.checked)}
                  />
                  <label htmlFor="appUpdates" className="ml-2.5 text-sm text-ink">
                    {t("settings.notifications.appUpdates")}
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sysAlerts"
                    className="h-4 w-4 accent-primary-600 focus:ring-primary-500 border-line rounded"
                    checked={Boolean(settings.notifications.systemAlerts)}
                    onChange={(e) => handleSettingChange("notifications", "systemAlerts", e.target.checked)}
                  />
                  <label htmlFor="sysAlerts" className="ml-2.5 text-sm text-ink">
                    {t("settings.notifications.sysAlerts")}
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Featured Jobs Tab */}
          {activeTab === "featured" && (
            <div className="space-y-6">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
                {t("settings.featured.heading")}
              </h4>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableFeatured"
                    className="h-4 w-4 accent-primary-600 focus:ring-primary-500 border-line rounded"
                    checked={Boolean(settings.featuredJobs.enableFeaturedJobs)}
                    onChange={(e) => handleSettingChange("featuredJobs", "enableFeaturedJobs", e.target.checked)}
                  />
                  <label htmlFor="enableFeatured" className="ml-2.5 text-sm text-ink">
                    {t("settings.featured.enable")}
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">
                      {t("settings.featured.maxSimultaneous")}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      className="w-full px-3.5 py-2 border border-line rounded-lg bg-surface text-ink text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                      value={settings.featuredJobs.maxFeaturedJobs || 50}
                      onChange={(e) =>
                        handleSettingChange("featuredJobs", "maxFeaturedJobs", parseInt(e.target.value, 10) || 1)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">
                      {t("settings.featured.price")}
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-3.5 py-2 border border-line rounded-lg bg-surface text-ink text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                      value={settings.featuredJobs.featuredJobPrice || 25}
                      onChange={(e) =>
                        handleSettingChange("featuredJobs", "featuredJobPrice", parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">
                      {t("settings.featured.duration")}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      className="w-full px-3.5 py-2 border border-line rounded-lg bg-surface text-ink text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                      value={settings.featuredJobs.featuredDuration || 7}
                      onChange={(e) =>
                        handleSettingChange("featuredJobs", "featuredDuration", parseInt(e.target.value, 10) || 7)
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center pt-2">
                  <input
                    type="checkbox"
                    id="autoRenewFeatured"
                    className="h-4 w-4 accent-primary-600 focus:ring-primary-500 border-line rounded"
                    checked={Boolean(settings.featuredJobs.autoRenewFeatured)}
                    onChange={(e) => handleSettingChange("featuredJobs", "autoRenewFeatured", e.target.checked)}
                  />
                  <label htmlFor="autoRenewFeatured" className="ml-2.5 text-sm text-ink">
                    {t("settings.featured.autoRenew")}
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 bg-tint border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            variant="outline"
            disabled={saving || resetting}
            onClick={() => handleResetSettings(activeTab)}
            className="w-full sm:w-auto"
          >
            {resetting
              ? t("settings.actions.resetting")
              : t("settings.actions.reset", { tab: t(`settings.tabs.${activeTab}`) })}
          </Button>

          <Button
            disabled={saving || resetting}
            loading={saving}
            onClick={handleSaveSettings}
            leftIcon={<FiSave className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            {saving ? t("settings.actions.saving") : t("settings.actions.save")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
