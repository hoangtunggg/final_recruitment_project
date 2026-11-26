const pino = require("pino");

const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  base: {
    service: "job-portal-api",
    instance: process.env.HOSTNAME || "local",
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.password",
      "req.body.token",
      "res.headers['set-cookie']",
    ],
    censor: "[REDACTED]",
  },
});

module.exports = logger;
