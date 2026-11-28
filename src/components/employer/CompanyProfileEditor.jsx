import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiImage,
  FiMapPin,
  FiSave,
  FiUpload,
} from "react-icons/fi";
import { companyService } from "../../services/companyService";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import CompanyLogo from "../common/CompanyLogo";

const emptyForm = {
  name: "",
  location: "",
  website: "",
  description: "",
};

const validateImage = (file) => {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return "Choose a JPG, PNG, or WebP image.";
  }
  if (file.size > 3 * 1024 * 1024) return "Image size must not exceed 3 MB.";
  return null;
};

const CompanyProfileEditor = ({ user }) => {
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
            : {
                ...emptyForm,
                name: user?.company || user?.name || "",
              }
        );
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.error || "Unable to load company profile.");
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
    const validationError = validateImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setSuccess("");
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
      setError("Company name must contain at least 2 characters.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
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
      setSuccess("Company profile and images were saved successfully.");
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to save the company profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4" aria-label="Loading company profile">
        <div className="aspect-[16/5] rounded-xl bg-slate-200 dark:bg-gray-700" />
        <div className="h-11 rounded-lg bg-slate-200 dark:bg-gray-700" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Company profile & media</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-gray-300">
          These details and images appear on company and job cards across the public experience.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300" role="alert">
          <FiAlertCircle className="mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300" role="status">
          <FiCheckCircle className="mt-0.5 shrink-0" aria-hidden="true" />
          {success}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-300 dark:border-gray-600">
        <div className="relative aspect-[16/5] bg-gradient-to-br from-blue-100 via-indigo-50 to-slate-100 dark:from-blue-950 dark:via-indigo-950/70 dark:to-gray-800">
          {coverSrc && <img src={coverSrc} alt="Company cover preview" className="h-full w-full object-cover" />}
          <label className="absolute bottom-3 right-3 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-white/95 px-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-white focus-within:outline focus-within:outline-2 focus-within:outline-blue-700 dark:bg-gray-900/95 dark:text-white">
            <FiImage aria-hidden="true" />
            {coverSrc ? "Replace cover" : "Add cover"}
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
            <CompanyLogo
              name={form.name}
              src={logoPreview || company?.logoUrl}
              className="h-16 w-16"
            />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white">{form.name || "Your company"}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600 dark:text-gray-300">
              <FiMapPin aria-hidden="true" /> {form.location || "Add a company location"}
            </p>
          </div>
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-within:outline focus-within:outline-2 focus-within:outline-blue-700 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700">
            <FiUpload aria-hidden="true" />
            {logoPreview || company?.logoUrl ? "Replace logo" : "Add logo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => selectImage("logo", event.target.files?.[0])}
            />
          </label>
        </div>
      </div>

      <p className="-mt-3 text-xs text-slate-600 dark:text-gray-300">
        JPG, PNG, or WebP · Maximum 3 MB each. Recommended: square logo and 1600 × 500 px cover.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="company-name" className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-gray-100">
            Company name <span className="text-rose-600">*</span>
          </label>
          <input
            id="company-name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            maxLength={100}
            required
          />
        </div>
        <div>
          <label htmlFor="company-location" className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-gray-100">Location</label>
          <input
            id="company-location"
            value={form.location}
            onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            placeholder="Ho Chi Minh City, Vietnam"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="company-website" className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-gray-100">Website</label>
          <input
            id="company-website"
            type="url"
            value={form.website}
            onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            placeholder="https://example.com"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="company-description" className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-gray-100">About the company</label>
          <textarea
            id="company-description"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            className="min-h-28 w-full rounded-lg border border-slate-300 bg-white p-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            maxLength={1500}
            placeholder="Describe your mission, culture, and team."
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FiSave aria-hidden="true" />
        {saving ? "Saving company profile..." : "Save company profile"}
      </button>
    </form>
  );
};

export default CompanyProfileEditor;
