import React from "react";
import { FiImage, FiUpload } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Card } from "../../ui";

/** Optional position image: file picker, constraints hint and live preview. */
const JobEditorImageSection = ({ imageFile, hasExistingImage, previewSrc, error, onChange }) => {
  const { t } = useTranslation("employer");
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="border-b border-line p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-ink">
          <FiImage className="text-primary-text" aria-hidden="true" />
          {t("jobEditor.image.title")}
        </h2>
        <p className="mt-1 text-sm text-muted">{t("jobEditor.image.subtitle")}</p>
      </div>
      <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)] md:items-center">
        <div>
          <label
            htmlFor="job-image"
            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-pill border border-primary-600 bg-primary-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary-500"
          >
            <FiUpload aria-hidden="true" />
            {imageFile || hasExistingImage
              ? t("jobEditor.image.replace")
              : t("jobEditor.image.choose")}
            <input
              id="job-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={onChange}
            />
          </label>
          <p className="mt-2 text-xs text-muted">{t("jobEditor.image.constraints")}</p>
          {imageFile && (
            <p className="mt-2 break-all text-sm font-medium text-ink">{imageFile.name}</p>
          )}
          {error && (
            <p className="mt-2 text-sm text-danger" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="aspect-[16/7] overflow-hidden rounded-card border border-line bg-tint">
          {previewSrc ? (
            <img
              src={previewSrc}
              alt={t("jobEditor.image.previewAlt")}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-medium text-muted">
              {t("jobEditor.image.preview")}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default JobEditorImageSection;
