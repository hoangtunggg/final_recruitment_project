const { createClient } = require("redis");
const logger = require("../lib/logger");

const redisUrl = process.env.REDIS_URL;
let client = null;
let connectPromise = null;

const getRedisClient = () => {
  if (!redisUrl) return null;
  if (client) return client;

  client = createClient({
    url: redisUrl,
    socket: {
      connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT_MS) || 2000,
      reconnectStrategy: (retries) => Math.min(100 * 2 ** retries, 3000),
    },
  });

  client.on("ready", () => logger.info("Redis connection ready"));
  client.on("reconnecting", () => logger.warn("Redis reconnecting"));
  client.on("error", (error) =>
    logger.warn({ err: error }, "Redis unavailable; using graceful fallbacks")
  );
  return client;
};

const connectRedis = async () => {
  const redis = getRedisClient();
  if (!redis) {
    logger.info("Redis is not configured; cache and rate limits use local fallbacks");
    return false;
  }
  if (redis.isReady) return true;
  if (!connectPromise) {
    connectPromise = redis.connect().catch((error) => {
      logger.warn({ err: error }, "Initial Redis connection failed");
      return false;
    });
  }
  await connectPromise;
  return redis.isReady;
};

const closeRedis = async () => {
  if (!client?.isOpen) return;
  try {
    await client.quit();
  } catch (_) {
    client.disconnect();
  }
};

const redisReady = () => Boolean(client?.isReady);

module.exports = { getRedisClient, connectRedis, closeRedis, redisReady };
