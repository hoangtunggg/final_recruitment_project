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
  auth,
  roles,
  asyncHandler,
  pageParams,
} = require("@jobportal/service-kit");

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
    await store.send(new CreateBucketCommand({ Bucket: bucket }));
  }
}

const slug = (value) =>
  String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function mediaUrl(id, type, objectKey, updatedAt) {
  if (!objectKey) return null;
  return `/api/companies/${id}/${type}?v=${new Date(updatedAt).getTime()}`;
}

function company(row) {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    website: row.website,
    location: row.location,
    details: row.details,
    status: row.status,
    logoUrl: mediaUrl(row.id, "logo", row.logo_object_key, row.updated_at),
    coverUrl: mediaUrl(row.id, "cover", row.cover_object_key, row.updated_at),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function canManage(req, row) {
  return req.user.role === "admin" || row.owner_user_id === req.user.id;
}

function router(pool) {
  const r = express.Router();

  r.get("/", asyncHandler(async (req, res) => {
    const { limit, offset } = pageParams(req.query, 24);
    const rows = (await pool.query(
      "SELECT * FROM companies WHERE status='active' ORDER BY name LIMIT $1 OFFSET $2",
      [limit, offset]
    )).rows;
    res.json({ success: true, data: rows.map(company) });
  }));

  r.get("/mine", auth(), asyncHandler(async (req, res) => {
    const row = (await pool.query(
      "SELECT * FROM companies WHERE owner_user_id=$1 LIMIT 1",
      [req.user.id]
    )).rows[0];
    res.json({ success: true, data: row ? company(row) : null });
  }));

  for (const type of ["logo", "cover"]) {
    r.get(`/:id/${type}`, asyncHandler(async (req, res) => {
      const keyColumn = type === "logo" ? "logo_object_key" : "cover_object_key";
      const mimeColumn = type === "logo" ? "logo_mime_type" : "cover_mime_type";
      const row = (await pool.query(
        `SELECT ${keyColumn} AS object_key, ${mimeColumn} AS mime_type FROM companies WHERE id=$1`,
        [req.params.id]
      )).rows[0];
      if (!row?.object_key || !store) {
        return res.status(404).json({ success: false, error: "Company image not found" });
      }
      const object = await store.send(new GetObjectCommand({ Bucket: bucket, Key: row.object_key }));
      res.set({
        "Content-Type": row.mime_type || object.ContentType || "application/octet-stream",
        "Cache-Control": "public, max-age=86400",
        "Content-Disposition": "inline",
      });
      object.Body.pipe(res);
    }));
  }

  r.get("/:id", asyncHandler(async (req, res) => {
    const row = (await pool.query("SELECT * FROM companies WHERE id=$1", [req.params.id])).rows[0];
    if (!row) return res.status(404).json({ success: false, error: "Company not found" });
    res.json({ success: true, data: company(row) });
  }));

  r.post("/", ...roles("employer", "admin"), asyncHandler(async (req, res) => {
    if (!req.body.name?.trim()) {
      return res.status(400).json({ success: false, error: "Company name is required" });
    }
    const existing = (await pool.query(
      "SELECT id FROM companies WHERE owner_user_id=$1",
      [req.user.id]
    )).rows[0];
    if (existing) {
      return res.status(409).json({ success: false, error: "This account already manages a company" });
    }
    const row = (await pool.query(
      "INSERT INTO companies(owner_user_id,name,slug,description,website,location,details) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb) RETURNING *",
      [
        req.user.id,
        req.body.name.trim(),
        `${slug(req.body.name)}-${crypto.randomUUID().slice(0, 8)}`,
        req.body.description?.trim() || null,
        req.body.website?.trim() || null,
        req.body.location?.trim() || null,
        JSON.stringify(req.body.details || {}),
      ]
    )).rows[0];
    res.status(201).json({ success: true, data: company(row) });
  }));

  r.put("/:id", auth(), asyncHandler(async (req, res) => {
    const current = (await pool.query("SELECT * FROM companies WHERE id=$1", [req.params.id])).rows[0];
    if (!current) return res.status(404).json({ success: false, error: "Company not found" });
    if (!canManage(req, current)) {
      return res.status(403).json({ success: false, error: "Insufficient permissions" });
    }
    const row = (await pool.query(
      "UPDATE companies SET name=coalesce($2,name),description=$3,website=$4,location=$5,details=coalesce($6::jsonb,details),updated_at=now() WHERE id=$1 RETURNING *",
      [
        req.params.id,
        req.body.name?.trim() || null,
        req.body.description?.trim() || null,
        req.body.website?.trim() || null,
        req.body.location?.trim() || null,
        req.body.details ? JSON.stringify(req.body.details) : null,
      ]
    )).rows[0];
    res.json({ success: true, data: company(row) });
  }));

  r.post("/:id/media/:type", auth(), upload.single("image"), asyncHandler(async (req, res) => {
    const type = req.params.type;
    if (!["logo", "cover"].includes(type)) {
      return res.status(400).json({ success: false, error: "Media type must be logo or cover" });
    }
    if (!req.file) return res.status(400).json({ success: false, error: "Please select an image" });
    if (!store) return res.status(503).json({ success: false, error: "Image storage is unavailable" });
    const current = (await pool.query("SELECT * FROM companies WHERE id=$1", [req.params.id])).rows[0];
    if (!current) return res.status(404).json({ success: false, error: "Company not found" });
    if (!canManage(req, current)) {
      return res.status(403).json({ success: false, error: "Insufficient permissions" });
    }
    const extension = req.file.mimetype === "image/jpeg" ? "jpg" : req.file.mimetype.split("/")[1];
    const key = `companies/${current.id}/${type}-${crypto.randomUUID()}.${extension}`;
    await store.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      CacheControl: "public, max-age=86400",
      Metadata: { owner: req.user.id, mediaType: type },
    }));
    const keyColumn = type === "logo" ? "logo_object_key" : "cover_object_key";
    const mimeColumn = type === "logo" ? "logo_mime_type" : "cover_mime_type";
    const row = (await pool.query(
      `UPDATE companies SET ${keyColumn}=$2,${mimeColumn}=$3,updated_at=now() WHERE id=$1 RETURNING *`,
      [current.id, key, req.file.mimetype]
    )).rows[0];
    res.json({ success: true, data: company(row) });
  }));

  return r;
}

const service = createService({ name: "company-service", mount: "/api/companies", router });
ensureBucket()
  .then(() => service.start())
  .catch((error) => {
    service.logger.fatal({ err: error }, "startup failed");
    process.exit(1);
  });
