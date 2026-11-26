const express = require("express");
const fs = require("fs");
const crypto = require("crypto");
const { authenticateToken, authorize } = require("../middleware/auth");
const { getRedisClient } = require("../config/redis");
const storageService = require("../services/storageService");
const Job = require("../models/Job");
const Resume = require("../models/Resume");

const router = express.Router();
const pending = new Map();
router.use(authenticateToken, authorize("jobseeker"));

router.post("/jobs/:jobId/resumes/:resumeId", async (req, res) => {
  if (process.env.CVJD_MATCHING_ENABLED !== "true") {
    return res.status(503).json({ success: false, error: "Experimental analysis is unavailable" });
  }
  const jobId = Number(req.params.jobId);
  const resumeId = Number(req.params.resumeId);
  if (!Number.isSafeInteger(jobId) || !Number.isSafeInteger(resumeId) || jobId < 1 || resumeId < 1) {
    return res.status(400).json({ success: false, error: "Invalid job or CV ID" });
  }
  try {
    const [job, resume] = await Promise.all([
      Job.findByPk(jobId), Resume.findOne({ where: { id: resumeId, userId: req.user.id } }),
    ]);
    if (!job || !["Published", "active"].includes(job.status)) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }
    if (!resume) {
      return res.status(404).json({ success: false, error: "CV not found" });
    }
    let bytes;
    if (resume.fileData) bytes = Buffer.from(resume.fileData, "base64");
    else if (storageService.fileExists(resume.fileName)) bytes = await fs.promises.readFile(storageService.getFilePath(resume.fileName));
    else return res.status(422).json({ success: false, error: "CV file unavailable" });
    if (bytes.length > 5 * 1024 * 1024) return res.status(413).json({ success: false, error: "CV exceeds 5 MB" });
    const jobData = job.toJSON();
    const fingerprint = crypto.createHash("sha256").update(bytes).update(JSON.stringify(jobData)).digest("hex");
    const modelVersion = process.env.CVJD_MODEL_VERSION || "experimental-v1";
    const key = `cvjd:${modelVersion}:user:${req.user.id}:job:${jobId}:resume:${resumeId}:${fingerprint}`;
    const redis = getRedisClient();
    if (redis?.isReady) {
      try {
        const cached = await redis.get(key);
        if (cached) return res.json({ success: true, data: JSON.parse(cached) });
      } catch (cacheError) {
        req.log?.warn({ err: cacheError }, "CV-JD cache read unavailable");
      }
    }
    if (!pending.has(key)) {
      if (pending.size >= 8) return res.status(429).json({ success: false, error: "Analysis capacity reached; retry later" });
      const task = (async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 20000);
        try {
          const response = await fetch(`${process.env.ML_SERVICE_URL || "http://ml-service:8000"}/match`, {
            method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
            body: JSON.stringify({ file_base64: bytes.toString("base64"), file_type: resume.mimeType, jd: jobData }),
          });
          if (!response.ok) {
            const failure = new Error("ML service unavailable");
            failure.status = response.status === 422 ? 422 : response.status === 429 ? 429 : 503;
            throw failure;
          }
          const result = await response.json();
          if (redis?.isReady) {
            try { await redis.set(key, JSON.stringify(result), { EX: 300 }); }
            catch (cacheError) { req.log?.warn({ err: cacheError }, "CV-JD cache write unavailable"); }
          }
          return result;
        } finally {
          clearTimeout(timer);
        }
      })();
      pending.set(key, task);
      task.finally(() => pending.delete(key)).catch(() => {});
    }
    return res.json({ success: true, data: await pending.get(key) });
  } catch (error) {
    req.log?.warn({ err: error }, "CV-JD analysis unavailable");
    const status = [422, 429].includes(error.status) ? error.status : 503;
    return res.status(status).json({ success: false, error: status === 422 ? "This CV or JD cannot be analyzed with the current model" : status === 429 ? "Analysis capacity reached; retry later" : "Analysis is temporarily unavailable" });
  }
});

module.exports = router;
