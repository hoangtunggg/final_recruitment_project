const crypto = require("crypto");
const { getRedisClient } = require("../config/redis");
const { rateLimitFallbacks } = require("../observability/metrics");

const localWindows = new Map();
const RATE_LIMIT_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
local ttl = redis.call('PTTL', KEYS[1])
return {current, ttl}
`;

const clientKey = (req) =>
  crypto.createHash("sha256").update(req.ip || req.socket.remoteAddress || "unknown").digest("hex");

const localIncrement = (key, windowMs) => {
  const now = Date.now();
  const existing = localWindows.get(key);
  if (!existing || existing.resetAt <= now) {
    const created = { count: 1, resetAt: now + windowMs };
    localWindows.set(key, created);
    return created;
  }
  existing.count += 1;
  return existing;
};

const localDecrement = (key) => {
  const entry = localWindows.get(key);
  if (entry && entry.count > 0) entry.count -= 1;
};

const createRateLimiter = ({ name, windowMs, max, skipSuccessfulRequests = false, message }) =>
  async (req, res, next) => {
    const identity = clientKey(req);
    const key = `rate-limit:${name}:${identity}`;
    const redis = getRedisClient();
    let count;
    let resetMs;
    let usedRedis = false;

    if (redis?.isReady) {
      try {
        const result = await redis.eval(RATE_LIMIT_SCRIPT, {
          keys: [key],
          arguments: [String(windowMs)],
        });
        count = Number(result[0]);
        resetMs = Math.max(0, Number(result[1]));
        usedRedis = true;
      } catch (_) {}
    }

    if (!usedRedis) {
      rateLimitFallbacks.inc({ limiter: name });
      const entry = localIncrement(key, windowMs);
      count = entry.count;
      resetMs = Math.max(0, entry.resetAt - Date.now());
    }

    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, max - count)));
    res.setHeader("RateLimit-Reset", String(Math.ceil(resetMs / 1000)));

    if (skipSuccessfulRequests) {
      res.on("finish", () => {
        if (res.statusCode < 400) {
          if (usedRedis && redis?.isReady) redis.decr(key).catch(() => {});
          else localDecrement(key);
        }
      });
    }

    if (count > max) {
      res.setHeader("Retry-After", String(Math.ceil(resetMs / 1000)));
      return res.status(429).json(message);
    }
    return next();
  };

const loginLimiter = createRateLimiter({
  name: "login",
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: "Too many login attempts from this IP, please try again after 15 minutes",
  },
});

const registerLimiter = createRateLimiter({
  name: "register",
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: "Too many accounts created from this IP, please try again after an hour",
  },
});

const apiLimiter = createRateLimiter({
  name: "api",
  windowMs: 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_PER_MINUTE) || 3000,
  message: { success: false, error: "Too many requests, please try again shortly" },
});

const uploadLimiter = createRateLimiter({
  name: "upload",
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.UPLOAD_RATE_LIMIT_PER_HOUR) || 60,
  message: { success: false, error: "Too many uploads, please try again later" },
});

module.exports = { loginLimiter, registerLimiter, apiLimiter, uploadLimiter };
