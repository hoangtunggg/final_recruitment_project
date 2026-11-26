const client = require("prom-client");
const { sequelize } = require("../config/database");
const { redisReady } = require("../config/redis");

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: "job_portal_node_" });

const httpRequests = new client.Counter({
  name: "job_portal_http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});
const httpDuration = new client.Histogram({
  name: "job_portal_http_request_duration_seconds",
  help: "HTTP request latency in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});
const httpErrors = new client.Counter({
  name: "job_portal_http_errors_total",
  help: "HTTP responses with status 500 or greater",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});
const cacheOperations = new client.Counter({
  name: "job_portal_cache_operations_total",
  help: "Redis cache outcomes",
  labelNames: ["namespace", "result"],
  registers: [register],
});
const rateLimitFallbacks = new client.Counter({
  name: "job_portal_rate_limit_fallback_total",
  help: "Rate-limit operations handled by local memory after Redis was unavailable",
  labelNames: ["limiter"],
  registers: [register],
});

new client.Gauge({
  name: "job_portal_redis_ready",
  help: "Whether the Redis client is ready",
  collect() {
    this.set(redisReady() ? 1 : 0);
  },
  registers: [register],
});

const poolGauge = new client.Gauge({
  name: "job_portal_database_pool_connections",
  help: "Sequelize pool connections by state",
  labelNames: ["state"],
  collect() {
    const pool = sequelize.connectionManager?.pool;
    this.set({ state: "size" }, pool?.size || 0);
    this.set({ state: "available" }, pool?.available || 0);
    this.set({ state: "using" }, pool?.using || 0);
    this.set({ state: "waiting" }, pool?.waiting || 0);
  },
  registers: [register],
});
void poolGauge;

const normalizePath = (path) =>
  (path || "/")
    .replace(/\/[0-9]+(?=\/|$)/g, "/:id")
    .replace(/\/[0-9a-f]{16,}(?=\/|$)/gi, "/:token");

const metricsMiddleware = (req, res, next) => {
  const started = process.hrtime.bigint();
  res.on("finish", () => {
    const route = req.route?.path
      ? `${req.baseUrl || ""}${req.route.path}`
      : normalizePath(req.path);
    const labels = {
      method: req.method,
      route: normalizePath(route),
      status_code: String(res.statusCode),
    };
    const seconds = Number(process.hrtime.bigint() - started) / 1e9;
    httpRequests.inc(labels);
    httpDuration.observe(labels, seconds);
    if (res.statusCode >= 500) httpErrors.inc(labels);
  });
  next();
};

module.exports = {
  register,
  metricsMiddleware,
  cacheOperations,
  rateLimitFallbacks,
};
