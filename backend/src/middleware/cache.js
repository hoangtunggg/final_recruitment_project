const crypto = require("crypto");
const { getRedisClient } = require("../config/redis");
const { cacheOperations } = require("../observability/metrics");

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");

const releaseLock = async (redis, key, owner) => {
  try {
    await redis.eval(
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
      { keys: [key], arguments: [owner] }
    );
  } catch (_) {}
};

const cachePublicResponse = (namespace, ttlSeconds = 30) => async (req, res, next) => {
  const redis = getRedisClient();
  if (!redis?.isReady) {
    cacheOperations.inc({ namespace, result: "bypass" });
    res.setHeader("X-Cache", "BYPASS");
    return next();
  }

  let key;
  let lockKey;
  let lockOwner;
  try {
    const version = (await redis.get(`cache:${namespace}:version`)) || "1";
    key = `cache:${namespace}:v${version}:${hash(req.originalUrl)}`;
    const cached = await redis.get(key);
    if (cached) {
      cacheOperations.inc({ namespace, result: "hit" });
      res.setHeader("X-Cache", "HIT");
      return res.json(JSON.parse(cached));
    }

    lockKey = `${key}:lock`;
    lockOwner = crypto.randomUUID();
    const acquired = await redis.set(lockKey, lockOwner, { NX: true, PX: 2500 });
    if (!acquired) {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        await sleep(25 * (attempt + 1));
        const filled = await redis.get(key);
        if (filled) {
          cacheOperations.inc({ namespace, result: "coalesced_hit" });
          res.setHeader("X-Cache", "HIT");
          return res.json(JSON.parse(filled));
        }
      }
    }

    cacheOperations.inc({ namespace, result: "miss" });
    res.setHeader("X-Cache", "MISS");
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        redis.setEx(key, ttlSeconds, JSON.stringify(body)).catch(() => {});
      }
      if (acquired) releaseLock(redis, lockKey, lockOwner);
      return originalJson(body);
    };
    return next();
  } catch (_) {
    cacheOperations.inc({ namespace, result: "error" });
    if (lockKey && lockOwner) releaseLock(redis, lockKey, lockOwner);
    res.setHeader("X-Cache", "BYPASS");
    return next();
  }
};

const invalidateNamespace = async (namespace) => {
  const redis = getRedisClient();
  if (!redis?.isReady) return false;
  try {
    const version = `${Date.now()}-${crypto.randomUUID()}`;
    await redis.set(`cache:${namespace}:version`, version);
    cacheOperations.inc({ namespace, result: "invalidation" });
    return true;
  } catch (_) {
    return false;
  }
};

const invalidateOnSuccess = (namespace) => (req, res, next) => {
  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      invalidateNamespace(namespace);
    }
  });
  next();
};

module.exports = { cachePublicResponse, invalidateNamespace, invalidateOnSuccess };
