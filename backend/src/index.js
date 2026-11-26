require("dotenv").config();
const { validateJwtSecret } = require("./middleware/auth");

// Fail safely at startup if JWT_SECRET is missing or insecure
try {
  validateJwtSecret();
} catch (err) {
  console.error("FATAL CONFIGURATION ERROR:", err.message);
  process.exit(1);
}

const express = require("express");
const cors = require("cors");
const compression = require("compression");
const pinoHttp = require("pino-http");
const { sequelize, createDatabaseIfNotExists } = require("./config/database");
const { connectRedis, closeRedis, redisReady } = require("./config/redis");
const logger = require("./lib/logger");
const { register, metricsMiddleware } = require("./observability/metrics");
const { apiLimiter } = require("./middleware/rateLimiter");
const { ensureResumePersistenceColumns } = require("./utils/dbResumePersistence");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const auditRoutes = require("./routes/auditRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const settingRoutes = require("./routes/settingRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const Job = require("./models/Job");
const Application = require("./models/Application");
const User = require("./models/User");
const Audit = require("./models/Audit");
const Resume = require("./models/Resume");
const Setting = require("./models/Setting");
const Notification = require("./models/Notification");

const app = express();

// Trust reverse proxy (required for Render, Vercel, and rate limiting behind proxies)
app.set("trust proxy", 1);

// Configure allowed frontend origins (supports local development, Vercel production, and preview URLs)
const defaultOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
];

const configuredOrigins = [];
if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(",").forEach((url) => {
    const trimmed = url.trim().replace(/\/$/, "");
    if (trimmed) configuredOrigins.push(trimmed);
  });
}
if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(",").forEach((url) => {
    const trimmed = url.trim().replace(/\/$/, "");
    if (trimmed) configuredOrigins.push(trimmed);
  });
}

const allowedOrigins = Array.from(
  new Set([...defaultOrigins, ...configuredOrigins])
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like health checks, server-to-server, curl)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }
      // Allow any Vercel deployment domain (production and preview URLs)
      if (cleanOrigin.endsWith(".vercel.app")) {
        return callback(null, true);
      }
      // Allow any localhost port in development
      if (
        process.env.NODE_ENV !== "production" &&
        (cleanOrigin.startsWith("http://localhost:") ||
          cleanOrigin.startsWith("http://127.0.0.1:"))
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === "/health" || req.url === "/api/health",
    },
    customLogLevel: (req, res, error) => {
      if (error || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
  })
);
app.use((req, res, next) => {
  res.setHeader("X-Backend-Instance", process.env.HOSTNAME || "local");
  next();
});
app.use(metricsMiddleware);

// Setup model associations
const setupAssociations = () => {
  User.associate({ Application, Audit, Job, Resume, Setting, Notification });
  Application.associate({ User, Job });
  Job.associate({ Application, User });
  Audit.associate({ User });
  Resume.associate({ User });
  Setting.associate({ User });
  Notification.associate({ User });
};

// Health check endpoint for uptime monitoring and deployment verification
const healthCheckHandler = async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || "development",
      database: "connected",
      redis: redisReady() ? "connected" : process.env.REDIS_URL ? "degraded" : "not_configured",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || "development",
      database: "disconnected",
      error: error.message,
    });
  }
};

app.get("/health", healthCheckHandler);
app.get("/api/health", healthCheckHandler);
app.get("/live", (req, res) => res.status(200).json({ status: "alive" }));
app.get("/ready", healthCheckHandler);
app.get("/metrics", async (req, res, next) => {
  try {
    res.setHeader("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    next(error);
  }
});

// Initialize database and tables
const initializeDatabase = async () => {
  try {
    // Only attempt auto-creation in development when explicitly enabled
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.DB_AUTO_CREATE === "true"
    ) {
      await createDatabaseIfNotExists();
    }

    // Connect to the database
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    // Setup model associations
    setupAssociations();

    // Existing databases can opt out of startup schema writes in Docker development.
    if (process.env.DB_SKIP_SCHEMA_INIT !== "true") {
      const syncOptions = {};
      if (process.env.DB_SYNC_FORCE === "true") {
        syncOptions.force = true;
      } else if (process.env.DB_SYNC_ALTER === "true") {
        syncOptions.alter = true;
      }

      await sequelize.sync(syncOptions);
      console.log("All tables were synchronized successfully.");
      await ensureResumePersistenceColumns(sequelize);
    }
  } catch (error) {
    logger.error({ err: error }, "Unable to initialize database");
    throw error;
  }
};

const startServer = async () => {
  await initializeDatabase();
  await connectRedis();

  // API Routes
  app.use("/api", apiLimiter);
  app.use("/api/auth", authRoutes);
  app.use("/api/jobs", jobRoutes);
  app.use("/api/applications", applicationRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/audit", auditRoutes);
  app.use("/api/resumes", resumeRoutes);
  app.use("/api/settings", settingRoutes);
  app.use("/api/notifications", notificationRoutes);

  // Base route
  app.get("/", (req, res) => {
    res.json({
      message: "Welcome to Job Portal API",
      endpoints: {
        auth: {
          register: "POST /api/auth/register",
          login: "POST /api/auth/login",
          getCurrentUser: "GET /api/auth/me (auth required)",
        },
        jobs: {
          getAll: "GET /api/jobs",
          getOne: "GET /api/jobs/:id",
          create: "POST /api/jobs",
          update: "PUT /api/jobs/:id",
          delete: "DELETE /api/jobs/:id",
        },
        applications: {
          submit: "POST /api/applications",
          getByEmail: "GET /api/applications/email/:email",
          getAll: "GET /api/applications (auth required)",
          getOne: "GET /api/applications/:id (auth required)",
          updateStatus: "PUT /api/applications/:id/status (auth required)",
          delete: "DELETE /api/applications/:id (auth required)",
        },
        users: {
          getAll: "GET /api/users (admin required)",
          getOne: "GET /api/users/:id (admin required)",
          update: "PUT /api/users/:id (admin required)",
          delete: "DELETE /api/users/:id (admin required)",
          updateRole: "PUT /api/users/:id/role (admin required)",
          updateStatus: "PUT /api/users/:id/status (admin required)",
          getStatistics: "GET /api/users/statistics (admin required)",
          getActivity: "GET /api/users/:id/activity (admin required)",
        },
        settings: {
          getSettings: "GET /api/settings (admin required)",
          updateSettings: "PUT /api/settings (admin required)",
          resetSettings: "POST /api/settings/reset (admin required)",
          resetCategory: "POST /api/settings/reset/:category (admin required)",
        },
        notifications: {
          getAll: "GET /api/notifications (auth required)",
          getUnreadCount: "GET /api/notifications/unread-count (auth required)",
          markAsRead: "PATCH /api/notifications/:id/read (auth required)",
          markAsUnread: "PATCH /api/notifications/:id/unread (auth required)",
          markAllAsRead: "PATCH /api/notifications/mark-all-read (auth required)",
          delete: "DELETE /api/notifications/:id (auth required)",
          clearAll: "DELETE /api/notifications/clear-all (auth required)",
          create: "POST /api/notifications (admin required)",
        },
        health: "GET /api/health (and GET /health)",
      },
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ success: false, error: "Route not found" });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Internal server error",
    });
  });

  const PORT = process.env.PORT || 3001;
  const server = app.listen(PORT, process.env.HOST || "0.0.0.0", () => {
    logger.info({ port: Number(PORT) }, "Server is ready");
  });

  server.requestTimeout = Number(process.env.REQUEST_TIMEOUT_MS) || 30000;
  server.headersTimeout = Number(process.env.HEADERS_TIMEOUT_MS) || 35000;
  server.keepAliveTimeout = Number(process.env.KEEP_ALIVE_TIMEOUT_MS) || 5000;

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "Graceful shutdown started");
    const forcedExit = setTimeout(() => {
      logger.error("Graceful shutdown timed out");
      process.exit(1);
    }, Number(process.env.SHUTDOWN_TIMEOUT_MS) || 10000);
    forcedExit.unref();
    server.close(async (error) => {
      try {
        await Promise.allSettled([sequelize.close(), closeRedis()]);
      } finally {
        clearTimeout(forcedExit);
        process.exit(error ? 1 : 0);
      }
    });
  };
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
  return server;
};

startServer().catch((error) => {
  logger.fatal({ err: error }, "Server startup failed");
  process.exit(1);
});
