import { useEffect, useMemo, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiImage, FiMapPin, FiSave, FiUpload } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { companyService } from "../../services/companyService";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import CompanyLogo from "../common/CompanyLogo";
import { Button, Input, Textarea } from "../ui";

const emptyForm = { name: "", location: "", website: "", description: "" };

// Returns an employer:company.* message key, or null when the file is acceptable.
const validateImage = (file) => {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "company.imageType";
  if (file.size > 3 * 1024 * 1024) return "company.imageSize";
  return null;
};

const FILE_LABEL =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 px-4 text-sm font-semibold focus-within:outline focus-within:outline-2 focus-within:outline-primary-500";

const CompanyProfileEditor = ({ user }) => {
  const { t } = useTranslation("employer");
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Messages are { key } (built-in, translated at render) or { raw } (server text)
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    let active = true;
    companyService
      .getMine()
      .then((response) => {
        if (!active) return;
        const profile = response.data;
        setCompany(profile);
        setForm(
          profile
            ? {
                name: profile.name || "",
                location: profile.location || "",
                website: profile.website || "",
                description: profile.description || "",
              }
            : { ...emptyForm, name: user?.company || user?.name || "" }
        );
      })
      .catch((requestError) => {
        const raw = requestError.response?.data?.error;
        if (active) setError(raw ? { raw } : { key: "company.loadFailed" });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(
    () => () => {
      if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
      if (coverPreview?.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
    },
    [logoPreview, coverPreview]
  );

  const coverSrc = useMemo(
    () => coverPreview || resolveMediaUrl(company?.coverUrl),
    [coverPreview, company?.coverUrl]
  );

  const selectImage = (type, file) => {
    if (!file) return;
    const validationKey = validateImage(file);
    if (validationKey) {
      setError({ key: validationKey });
      return;
    }
    setError(null);
    setSuccess(null);
    const preview = URL.createObjectURL(file);
    if (type === "logo") {
      setLogoFile(file);
      setLogoPreview(preview);
    } else {
      setCoverFile(file);
      setCoverPreview(preview);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      setError({ key: "company.nameMin" });
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        name: form.name.trim(),
        location: form.location.trim() || null,
        website: form.website.trim() || null,
        description: form.description.trim() || null,
      };
      let saved = company
        ? (await companyService.update(company.id, payload)).data
        : (await companyService.create(payload)).data;
      if (logoFile) saved = (await companyService.uploadMedia(saved.id, "logo", logoFile)).data;
      if (coverFile) saved = (await companyService.uploadMedia(saved.id, "cover", coverFile)).data;
      setCompany(saved);
      setLogoFile(null);
      setCoverFile(null);
      setLogoPreview(null);
      setCoverPreview(null);
      setSuccess({ key: "company.saved" });
    } catch (requestError) {
      const raw = requestError.response?.data?.error;
      setError(raw ? { raw } : { key: "company.saveFailed" });
    } finally {
      setSaving(false);
    }
  };

  const text = (message) => message.raw || t(message.key);
  const setField = (name) => (event) => setForm((current) => ({ ...current, [name]: event.target.value }));

  if (loading) {
    return (
      <div className="animate-pulse space-y-4" role="status" aria-label={t("company.loading")}>
        <div className="aspect-[16/5] rounded-card bg-line" />
        <div className="h-11 rounded-control bg-line" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <h2 className="text-base font-extrabold text-ink">{t("company.title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("company.subtitle")}</p>
      </div>

      {error && (
        <div
          className="flex items-start gap-2 rounded-control border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
          role="alert"
        >
          <FiAlertCircle className="mt-0.5 shrink-0" aria-hidden="true" />
          {text(error)}
        </div>
      )}
      {success && (
        <div
          className="flex items-start gap-2 rounded-control border border-success/30 bg-success/10 p-3 text-sm text-success"
          role="status"
        >
          <FiCheckCircle className="mt-0.5 shrink-0" aria-hidden="true" />
          {text(success)}
        </div>
      )}

      <div className="overflow-hidden rounded-card border border-line">
        <div className="relative aspect-[16/5] bg-tint">
          {coverSrc && <img src={coverSrc} alt={t("company.coverAlt")} className="h-full w-full object-cover" />}
          <label className={`${FILE_LABEL} absolute bottom-3 right-3 rounded-pill bg-surface/95 text-ink shadow-card hover:bg-surface`}>
            <FiImage aria-hidden="true" />
            {coverSrc ? t("company.replaceCover") : t("company.addCover")}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => selectImage("cover", event.target.files?.[0])}
            />
          </label>
        </div>
        <div className="relative flex flex-col gap-4 p-4 pt-9 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div className="absolute -top-8 left-4 sm:left-6">
            <CompanyLogo name={form.name} src={logoPreview || company?.logoUrl} className="h-16 w-16" />
          </div>
          <div>
            <p className="font-bold text-ink">{form.name || t("company.yourCompany")}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <FiMapPin aria-hidden="true" /> {form.location || t("company.addLocation")}
            </p>
          </div>
          <label className={`${FILE_LABEL} rounded-pill border border-line-strong text-ink hover:bg-tint`}>
            <FiUpload aria-hidden="true" />
            {logoPreview || company?.logoUrl ? t("company.replaceLogo") : t("company.addLogo")}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => selectImage("logo", event.target.files?.[0])}
            />
          </label>
        </div>
      </div>

      <p className="-mt-3 text-xs text-muted">{t("company.imageHint")}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="company-name"
          label={t("company.name")}
          required
          value={form.name}
          onChange={setField("name")}
          maxLength={100}
        />
        <Input
          id="company-location"
          label={t("company.location")}
          value={form.location}
          onChange={setField("location")}
          placeholder={t("company.locationPlaceholder")}
        />
        <Input
          id="company-website"
          className="sm:col-span-2"
          label={t("company.website")}
          type="url"
          value={form.website}
          onChange={setField("website")}
          placeholder="https://example.com"
        />
        <Textarea
          id="company-description"
          className="sm:col-span-2"
          label={t("company.about")}
          rows={5}
          value={form.description}
          onChange={setField("description")}
          maxLength={1500}
          placeholder={t("company.aboutPlaceholder")}
        />
      </div>

      <Button type="submit" loading={saving} leftIcon={saving ? undefined : <FiSave />}>
        {saving ? t("company.saving") : t("company.save")}
      </Button>
    </form>
  );
};

export default CompanyProfileEditor;
