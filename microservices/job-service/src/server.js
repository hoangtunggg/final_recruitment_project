const express = require("express");
const crypto = require("node:crypto");
const multer = require("multer");
const {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const {
  createService,
  createEventPublisher,
  roles,
  internalAuth,
  asyncHandler,
  withTransaction,
  addOutbox,
  pageParams,
} = require("@jobportal/service-kit");

const columns = {
  company: "company",
  companyId: "company_id",
  title: "title",
  location: "location",
  description: "description",
  requirements: "requirements",
  responsibilities: "responsibilities",
  education: "education",
  benefits: "benefits",
  applicationDeadline: "application_deadline",
  contactEmail: "contact_email",
  contactPhone: "contact_phone",
  salary: "salary",
  type: "type",
  experience: "experience",
  skills: "skills",
  status: "status",
  approvalStatus: "approval_status",
};

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const accepted = allowedImageTypes.has(file.mimetype);
    callback(accepted ? null : new Error("Only JPG, PNG, and WebP images are supported"), accepted);
  },
});

const bucket = process.env.MEDIA_BUCKET || "jobportal-public-media";
let store;
if (process.env.S3_ENDPOINT) {
  store = new S3Client({
    endpoint: `${process.env.S3_USE_SSL === "true" ? "https" : "http"}://${process.env.S3_ENDPOINT}:${Number(process.env.S3_PORT || 9000)}`,
    region: process.env.S3_REGION || "us-east-1",
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
    },
  });
}

async function ensureBucket() {
  if (!store) return;
  try {
    await store.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    try {
      await store.send(new CreateBucketCommand({ Bucket: bucket }));
    } catch (error) {
      if (!String(error.name || error.message).includes("BucketAlready")) throw error;
    }
  }
}

function job(row) {
  return {
    id: row.id,
    companyId: row.company_id,
    company: row.company,
    employerId: row.employer_id,
    title: row.title,
    location: row.location,
    description: row.description,
    requirements: row.requirements,
    responsibilities: row.responsibilities,
    education: row.education,
    benefits: row.benefits,
    applicationDeadline: row.application_deadline,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    salary: row.salary,
    type: row.type,
    experience: row.experience,
    skills: Array.isArray(row.skills) ? row.skills.join(", ") : row.skills,
    status: row.status,
    approvalStatus: row.approval_status,
    imageUrl: row.image_object_key
      ? `/api/jobs/${row.id}/image?v=${new Date(row.updated_at).getTime()}`
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const skillsJson = (value) =>
  JSON.stringify(
    Array.isArray(value)
      ? value
      : String(value || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
  );

function canManage(req, row) {
  return req.user.role === "admin" || row.employer_id === req.user.id;
}

function router(pool) {
  const r = express.Router();

  r.get("/internal/stats", internalAuth, asyncHandler(async (_req, res) => {
    const totalJobs = Number((await pool.query("SELECT count(*) FROM jobs")).rows[0].count);
    res.json({ success: true, data: { totalJobs } });
  }));

  r.get("/", asyncHandler(async (req, res) => {
    const { page, limit, offset } = pageParams(req.query, 10);
    const values = [];
    const where = ["status IN ('Published','active')"];
    for (const [key, column] of [["location", "location"], ["type", "type"], ["experience", "experience"]]) {
      if (!req.query[key]) continue;
      values.push(req.query[key]);
      where.push(key === "location" ? `${column} ILIKE '%'||$${values.length}||'%'` : `${column}=$${values.length}`);
    }
    if (req.query.search) {
      values.push(req.query.search);
      where.push(`to_tsvector('simple',coalesce(title,'')||' '||coalesce(company,'')||' '||coalesce(description,'')) @@ plainto_tsquery('simple',$${values.length})`);
    }
    const count = Number((await pool.query(
      `SELECT count(*) FROM jobs WHERE ${where.join(" AND ")}`,
      values
    )).rows[0].count);
    values.push(limit, offset);
    const rows = (await pool.query(
      `SELECT * FROM jobs WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    )).rows;
    res.json({
      success: true,
      count: rows.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows.map(job),
    });
  }));

  r.get("/all", ...roles("admin"), asyncHandler(async (req, res) => {
    const { page, limit, offset } = pageParams(req.query);
    const rows = (await pool.query(
      "SELECT * FROM jobs ORDER BY created_at DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    )).rows;
    const count = Number((await pool.query("SELECT count(*) FROM jobs")).rows[0].count);
    res.json({
      success: true,
      data: {
        jobs: rows.map(job),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit) || 1,
          totalJobs: count,
          hasNext: page * limit < count,
          hasPrev: page > 1,
        },
      },
    });
  }));

  r.get("/my-jobs", ...roles("employer", "admin"), asyncHandler(async (req, res) => {
    const { page, limit, offset } = pageParams(req.query);
    const ownerId = req.user.role === "admin" && req.query.employerId
      ? req.query.employerId
      : req.user.id;
    const rows = (await pool.query(
      "SELECT * FROM jobs WHERE employer_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
      [ownerId, limit, offset]
    )).rows;
    res.json({ success: true, data: rows.map(job), pagination: { page, limit } });
  }));

  r.get("/:id/image", asyncHandler(async (req, res) => {
    const row = (await pool.query(
      "SELECT image_object_key,image_mime_type FROM jobs WHERE id=$1",
      [req.params.id]
    )).rows[0];
    if (!row?.image_object_key || !store) {
      return res.status(404).json({ success: false, error: "Job image not found" });
    }
    const object = await store.send(new GetObjectCommand({ Bucket: bucket, Key: row.image_object_key }));
    res.set({
      "Content-Type": row.image_mime_type || object.ContentType || "application/octet-stream",
      "Cache-Control": "public, max-age=86400",
      "Content-Disposition": "inline",
    });
    object.Body.pipe(res);
  }));

  r.get("/:id", asyncHandler(async (req, res) => {
    const row = (await pool.query("SELECT * FROM jobs WHERE id=$1", [req.params.id])).rows[0];
    if (!row) return res.status(404).json({ success: false, error: "Job not found" });
    res.json({ success: true, data: job(row) });
  }));

  r.post("/", ...roles("admin", "employer"), asyncHandler(async (req, res) => {
    for (const key of ["title", "company", "location", "description", "requirements", "type", "experience"]) {
      if (!req.body[key]) return res.status(400).json({ success: false, error: `${key} is required` });
    }
    const row = await withTransaction(pool, async (client) => {
      const result = await client.query(
        "INSERT INTO jobs(company_id,company,employer_id,title,location,description,requirements,responsibilities,education,benefits,application_deadline,contact_email,contact_phone,salary,type,experience,skills,status,approval_status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb,$18,$19) RETURNING *",
        [
          req.body.companyId || null,
          req.body.company,
          req.user.id,
          req.body.title,
          req.body.location,
          req.body.description,
          req.body.requirements,
          req.body.responsibilities || null,
          req.body.education || null,
          req.body.benefits || null,
          req.body.applicationDeadline || null,
          req.body.contactEmail || null,
          req.body.contactPhone || null,
          req.body.salary || null,
          req.body.type,
          req.body.experience,
          skillsJson(req.body.skills),
          req.body.status || "active",
          req.body.approvalStatus || "approved",
        ]
      );
      await addOutbox(client, "job", result.rows[0].id, "job.created", job(result.rows[0]));
      return result.rows[0];
    });
    res.status(201).json({ success: true, data: job(row) });
  }));

  const update = asyncHandler(async (req, res) => {
    const current = (await pool.query("SELECT * FROM jobs WHERE id=$1", [req.params.id])).rows[0];
    if (!current) return res.status(404).json({ success: false, error: "Job not found" });
    if (!canManage(req, current)) {
      return res.status(403).json({ success: false, error: "You can only update your own jobs" });
    }
    const entries = Object.entries(req.body).filter(([key]) => columns[key]);
    if (!entries.length) return res.json({ success: true, data: job(current) });
    const sets = entries.map(([key], index) => `${columns[key]}=$${index + 2}${key === "skills" ? "::jsonb" : ""}`);
    const values = entries.map(([key, value]) => key === "skills" ? skillsJson(value) : value);
    const row = await withTransaction(pool, async (client) => {
      const output = (await client.query(
        `UPDATE jobs SET ${sets.join(",")},updated_at=now() WHERE id=$1 RETURNING *`,
        [req.params.id, ...values]
      )).rows[0];
      await addOutbox(client, "job", output.id, "job.updated", job(output));
      return output;
    });
    res.json({ success: true, data: job(row) });
  });

  r.post("/:id/image", ...roles("admin", "employer"), upload.single("image"), asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, error: "Please select an image" });
    if (!store) return res.status(503).json({ success: false, error: "Image storage is unavailable" });
    const current = (await pool.query("SELECT * FROM jobs WHERE id=$1", [req.params.id])).rows[0];
    if (!current) return res.status(404).json({ success: false, error: "Job not found" });
    if (!canManage(req, current)) {
      return res.status(403).json({ success: false, error: "You can only update your own jobs" });
    }
    const extension = req.file.mimetype === "image/jpeg" ? "jpg" : req.file.mimetype.split("/")[1];
    const key = `jobs/${current.id}/hero-${crypto.randomUUID()}.${extension}`;
    await store.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      CacheControl: "public, max-age=86400",
      Metadata: { owner: req.user.id, mediaType: "job-hero" },
    }));
    const row = await withTransaction(pool, async (client) => {
      const output = (await client.query(
        "UPDATE jobs SET image_object_key=$2,image_mime_type=$3,updated_at=now() WHERE id=$1 RETURNING *",
        [current.id, key, req.file.mimetype]
      )).rows[0];
      await addOutbox(client, "job", output.id, "job.updated", job(output));
      return output;
    });
    res.json({ success: true, data: job(row) });
  }));

  r.put("/:id", ...roles("admin", "employer"), update);
  r.patch("/:id/status", ...roles("admin", "employer"), update);

  r.delete("/:id", ...roles("admin", "employer"), asyncHandler(async (req, res) => {
    const current = (await pool.query("SELECT * FROM jobs WHERE id=$1", [req.params.id])).rows[0];
    if (!current) return res.status(404).json({ success: false, error: "Job not found" });
    if (!canManage(req, current)) {
      return res.status(403).json({ success: false, error: "You can only delete your own jobs" });
    }
    await withTransaction(pool, async (client) => {
      await client.query("DELETE FROM jobs WHERE id=$1", [req.params.id]);
      await addOutbox(client, "job", current.id, "job.deleted", { jobId: current.id });
    });
    res.json({ success: true, data: {} });
  }));

  return r;
}

const service = createService({ name: "job-service", mount: "/api/jobs", router });
const publisher = createEventPublisher({ service: "job-service", pool: service.pool, logger: service.logger });
ensureBucket()
  .then(() => service.start())
  .then(() => publisher.start())
  .catch((error) => {
    service.logger.fatal({ err: error }, "startup failed");
    process.exit(1);
  });
