const crypto = require("node:crypto");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const pino = require("pino");
const pinoHttp = require("pino-http");
const { Pool } = require("pg");
const { createClient } = require("redis");
const { Registry, Counter, Histogram, collectDefaultMetrics } = require("prom-client");

const redact = ["req.headers.authorization", "req.headers.cookie", "password", "passwordHash", "fileData"];

function createLogger(service) {
  return pino({ name: service, level: process.env.LOG_LEVEL || "info", redact });
}

function createPool(service) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DB_POOL_MAX || 10),
    min: Number(process.env.DB_POOL_MIN || 0),
    idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
    connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS || 5000),
    query_timeout: Number(process.env.DB_QUERY_TIMEOUT_MS || 5000),
    statement_timeout: Number(process.env.DB_STATEMENT_TIMEOUT_MS || 5000),
    application_name: service,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" } : false,
  });
  pool.on("error", (error) => console.error(JSON.stringify({ service, level: "error", message: "idle postgres client error", error: error.message })));
  return pool;
}

function requestId(req, res, next) {
  const candidate = req.get("x-request-id");
  req.id = candidate && /^[A-Za-z0-9._:-]{8,128}$/.test(candidate) ? candidate : crypto.randomUUID();
  res.set("x-request-id", req.id);
  next();
}

function auth(required = true) {
  return (req, res, next) => {
    const value = req.get("authorization") || "";
    if (!value.startsWith("Bearer ")) return required ? res.status(401).json({ success: false, error: "Authentication required" }) : next();
    try {
      req.user = jwt.verify(value.slice(7), process.env.JWT_SECRET, { algorithms: ["HS256"] });
      return next();
    } catch {
      return res.status(401).json({ success: false, error: "Invalid or expired token" });
    }
  };
}

function roles(...allowed) {
  return [auth(), (req, res, next) => allowed.includes(req.user.role) ? next() : res.status(403).json({ success: false, error: "Insufficient permissions" })];
}

function internalAuth(req, res, next) {
  const expected = Buffer.from(process.env.INTERNAL_SERVICE_TOKEN || "");
  const supplied = Buffer.from(req.get("x-internal-service-token") || "");
  if (!expected.length || expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
    return res.status(401).json({ success: false, error: "Invalid service credential" });
  }
  next();
}

async function withTransaction(pool, work) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function addOutbox(client, aggregateType, aggregateId, eventType, payload) {
  await client.query(
    `INSERT INTO outbox_events (aggregate_type, aggregate_id, event_type, event_version, payload)
     VALUES ($1, $2, $3, 1, $4::jsonb)`,
    [aggregateType, aggregateId, eventType, JSON.stringify(payload)]
  );
}

function asyncHandler(fn) { return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next); }
function isUuid(value) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || ""); }
function pageParams(query, defaultLimit = 20) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, offset: (page - 1) * limit };
}

function isDependencyError(error) {
  const dependencyCodes = new Set(["08000", "08003", "08006", "08001", "08004", "08007", "08P01", "53300", "57P01", "57P02", "57P03"]);
  return dependencyCodes.has(error?.code) || /connection|query read timeout|terminat(?:ed|ing)|database system is starting/i.test(error?.message || "");
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function createService({ name, mount = "/", router, extraReady }) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const logger = createLogger(name);
  const pool = createPool(name);
  const registry = new Registry();
  collectDefaultMetrics({ register: registry, prefix: "jobportal_" });
  const requests = new Counter({ name: "jobportal_http_requests_total", help: "HTTP requests", labelNames: ["service", "method", "status"], registers: [registry] });
  const latency = new Histogram({ name: "jobportal_http_duration_seconds", help: "HTTP latency", labelNames: ["service", "method", "route", "status"], registers: [registry] });
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: (process.env.ALLOWED_ORIGINS || "http://localhost:5173").split(","), credentials: true }));
  app.use(requestId);
  app.use(pinoHttp({ logger, genReqId: (req) => req.id }));
  app.use(express.json({ limit: process.env.JSON_LIMIT || "2mb" }));
  app.use((req, res, next) => { const end = latency.startTimer(); res.on("finish", () => { requests.inc({ service: name, method: req.method, status: res.statusCode }); end({ service: name, method: req.method, route: req.route?.path || "unknown", status: res.statusCode }); }); next(); });
  app.get("/live", (_req, res) => res.json({ status: "alive", service: name }));
  const readiness = async (res, includeDependencies) => {
    try { await pool.query("SELECT 1"); if (includeDependencies && extraReady) await extraReady(); res.json({ status: includeDependencies ? "ready" : "healthy", service: name }); }
    catch (error) { logger.warn({ err: error }, "dependency health check failed"); res.status(503).json({ status: "unavailable", service: name }); }
  };
  app.get("/health", (_req, res) => readiness(res, false));
  app.get("/ready", (_req, res) => readiness(res, true));
  app.get("/metrics", asyncHandler(async (_req, res) => { res.type(registry.contentType).send(await registry.metrics()); }));
  app.use(mount, router(pool));
  app.use((req, res) => res.status(404).json({ success: false, error: "Route not found" }));
  app.use((error, req, res, _next) => {
    req.log?.error({ err: error }, "request failed");
    const status = error.status || (isDependencyError(error) ? 503 : 500);
    res.status(status).json({ success: false, error: error.expose ? error.message : (status === 503 ? "Service temporarily unavailable" : "Server error"), requestId: req.id });
  });
  let server;
  async function start() { server = app.listen(Number(process.env.PORT || 3000), "0.0.0.0", () => logger.info({ port: Number(process.env.PORT || 3000) }, "service started")); }
  async function shutdown(signal) { logger.info({ signal }, "graceful shutdown"); server?.close(); await pool.end(); process.exit(0); }
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
  return { app, pool, start, logger };
}

function createEventPublisher({ service, pool, logger }) {
  let redis;
  let timer;
  async function publishBatch() {
    let client;
    try {
      if (!redis?.isReady) return;
      client = await pool.connect();
      await client.query("BEGIN");
      const { rows } = await client.query("SELECT * FROM outbox_events WHERE published_at IS NULL ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 50");
      for (const event of rows) {
        await redis.xAdd(process.env.EVENT_STREAM || "jobportal.events.v1", "*", {
          id: event.id, type: event.event_type, version: String(event.event_version), source: service,
          aggregateId: event.aggregate_id, occurredAt: new Date(event.created_at).toISOString(), payload: JSON.stringify(event.payload)
        });
        await client.query("UPDATE outbox_events SET published_at=now(), attempts=attempts+1 WHERE id=$1", [event.id]);
      }
      await client.query("COMMIT");
    } catch (error) { if (client) await client.query("ROLLBACK").catch(() => {}); logger.warn({ err: error }, "outbox publish deferred"); }
    finally { client?.release(); }
  }
  async function start() {
    if (!process.env.REDIS_URL) return;
    redis = createClient({ url: process.env.REDIS_URL });
    redis.on("error", (error) => logger.warn({ err: error }, "redis unavailable"));
    redis.connect().catch((error) => logger.warn({ err: error }, "redis connection deferred"));
    timer = setInterval(publishBatch, Number(process.env.OUTBOX_POLL_MS || 1000)); timer.unref();
  }
  async function stop() { if (timer) clearInterval(timer); if (redis?.isOpen) await redis.quit(); }
  return { start, stop, publishBatch };
}

function createEventConsumer({ service, pool, logger, handlers }) {
  let redis;
  let stopped = false;
  const stream = process.env.EVENT_STREAM || "jobportal.events.v1";
  const group = `${service}.v1`;
  async function handle(message) {
    const event = message.message;
    const exists = await pool.query("SELECT 1 FROM processed_events WHERE event_id=$1", [event.id]);
    if (exists.rowCount) return;
    const handler = handlers[event.type];
    if (!handler) { await pool.query("INSERT INTO processed_events(event_id,event_type) VALUES($1,$2) ON CONFLICT DO NOTHING", [event.id, event.type]); return; }
    await withTransaction(pool, async (client) => { await handler(client, { ...event, payload: JSON.parse(event.payload) }); await client.query("INSERT INTO processed_events(event_id,event_type) VALUES($1,$2) ON CONFLICT DO NOTHING", [event.id, event.type]); });
  }
  async function loop() {
    let groupReady = false;
    while (!stopped) {
      try {
        if (!redis.isReady) { await delay(1000); continue; }
        if (!groupReady) {
          try { await redis.xGroupCreate(stream, group, "0", { MKSTREAM: true }); }
          catch (error) { if (!String(error.message).includes("BUSYGROUP")) throw error; }
          groupReady = true;
        }
        const batches = await redis.xReadGroup(group, service, [{ key: stream, id: ">" }], { COUNT: 20, BLOCK: 2000 });
        for (const batch of batches || []) for (const message of batch.messages) {
          try { await handle(message); await redis.xAck(stream, group, message.id); }
          catch (error) {
            logger.error({ err: error, eventId: message.message.id }, "event handling failed");
            const failures = await redis.hIncrBy(`${group}:failures`, message.message.id, 1);
            if (failures >= Number(process.env.EVENT_MAX_RETRIES || 5)) { await redis.xAdd(`${stream}.dead-letter`, "*", { ...message.message, failedBy: service, error: error.message.slice(0, 500) }); await redis.xAck(stream, group, message.id); }
          }
        }
      } catch (error) { groupReady = false; logger.warn({ err: error }, "event consumer deferred"); await delay(1000); }
    }
  }
  async function start() { if (!process.env.REDIS_URL) return; redis = createClient({ url: process.env.REDIS_URL }); redis.on("error", (error) => logger.warn({ err: error }, "redis consumer error")); redis.connect().catch((error) => logger.warn({ err: error }, "redis connection deferred")); loop().catch((error) => logger.error({ err: error }, "event loop stopped")); }
  async function stop() { stopped = true; if (redis?.isOpen) await redis.quit(); }
  return { start, stop };
}

module.exports = { createService, createPool, createLogger, createEventPublisher, createEventConsumer, auth, roles, internalAuth, asyncHandler, withTransaction, addOutbox, isUuid, pageParams };
