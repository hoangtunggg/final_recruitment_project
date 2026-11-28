const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createService, createEventPublisher, auth, internalAuth, asyncHandler, withTransaction, addOutbox, pageParams } = require("@jobportal/service-kit");

const publicUser = (row) => ({ id: row.id, name: row.name, email: row.email, role: row.role, status: row.status, emailVerified: row.email_verified, lastLogin: row.last_login, createdAt: row.created_at, updatedAt: row.updated_at });
const tokenFor = (user) => jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { algorithm: "HS256", expiresIn: process.env.JWT_EXPIRE || "30d" });

function router(pool) {
  const router = express.Router();
  router.post("/register", asyncHandler(async (req, res) => {
    const { name, password, role = "jobseeker" } = req.body;
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!name?.trim() || !email || typeof password !== "string") return res.status(400).json({ success: false, error: "Name, email, and password are required" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, error: "Please provide a valid email address" });
    if (password.length < 6) return res.status(400).json({ success: false, error: "Password must be at least 6 characters long" });
    const assignedRole = ["jobseeker", "employer"].includes(role) ? role : "jobseeker";
    const passwordHash = await bcrypt.hash(password, 10);
    try {
      const user = await withTransaction(pool, async (client) => {
        const { rows } = await client.query("INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING *", [name.trim(), email, passwordHash, assignedRole]);
        await addOutbox(client, "user", rows[0].id, "user.registered", { userId: rows[0].id, name: rows[0].name, email, role: assignedRole });
        return rows[0];
      });
      const data = { ...publicUser(user), token: tokenFor(user) };
      return res.status(201).json({ success: true, message: "User registered successfully", data });
    } catch (error) {
      if (error.code === "23505") return res.status(400).json({ success: false, error: "User with this email already exists" });
      throw error;
    }
  }));
  router.post("/login", asyncHandler(async (req, res) => {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!email || !req.body.password) return res.status(400).json({ success: false, error: "Email and password are required" });
    const { rows } = await pool.query("SELECT * FROM users WHERE lower(email)=lower($1)", [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(req.body.password, user.password_hash))) return res.status(401).json({ success: false, error: "Invalid email or password" });
    if (user.status === "blocked") return res.status(403).json({ success: false, error: "Your account has been blocked. Please contact support." });
    const updated = (await pool.query("UPDATE users SET last_login=now(), updated_at=now() WHERE id=$1 RETURNING *", [user.id])).rows[0];
    res.json({ success: true, message: "Login successful", data: { ...publicUser(updated), token: tokenFor(updated) } });
  }));
  router.get("/me", auth(), asyncHandler(async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM users WHERE id=$1", [req.user.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true, data: publicUser(rows[0]) });
  }));
  router.get("/internal/users", internalAuth, asyncHandler(async (req, res) => {
    const { page, limit, offset } = pageParams(req.query);
    const search = `%${String(req.query.search || "").trim()}%`;
    const values = [search, limit, offset];
    const where = req.query.search ? "WHERE name ILIKE $1 OR email ILIKE $1" : "";
    const params = req.query.search ? values : [limit, offset];
    const shift = req.query.search ? 0 : -1;
    const { rows } = await pool.query(`SELECT * FROM users ${where} ORDER BY created_at DESC LIMIT $${2 + shift} OFFSET $${3 + shift}`, params);
    const count = Number((await pool.query(`SELECT count(*) FROM users ${where}`, req.query.search ? [search] : [])).rows[0].count);
    res.json({ success: true, data: { users: rows.map(publicUser), pagination: { currentPage: page, totalPages: Math.ceil(count / limit) || 1, totalUsers: count } } });
  }));
  router.get("/internal/users/:id", internalAuth, asyncHandler(async (req, res) => {
    const user = (await pool.query("SELECT * FROM users WHERE id=$1", [req.params.id])).rows[0];
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true, data: publicUser(user) });
  }));
  router.patch("/internal/users/:id", internalAuth, asyncHandler(async (req, res) => {
    const allowed = { name: "name", role: "role", status: "status", emailVerified: "email_verified" };
    const entries = Object.entries(req.body).filter(([key]) => allowed[key]);
    if (!entries.length) return res.status(400).json({ success: false, error: "No supported fields" });
    const sets = entries.map(([key], index) => `${allowed[key]}=$${index + 1}`);
    const user = (await pool.query(`UPDATE users SET ${sets.join(",")}, updated_at=now() WHERE id=$${entries.length + 1} RETURNING *`, [...entries.map(([, value]) => value), req.params.id])).rows[0];
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true, data: publicUser(user) });
  }));
  router.delete("/internal/users/:id", internalAuth, asyncHandler(async (req, res) => {
    const user = await withTransaction(pool, async (client) => {
      const current = (await client.query("SELECT * FROM users WHERE id=$1 FOR UPDATE", [req.params.id])).rows[0];
      if (!current) return null;
      await client.query("DELETE FROM users WHERE id=$1", [req.params.id]);
      await addOutbox(client, "user", current.id, "user.deleted", { userId: current.id, email: current.email, role: current.role });
      return current;
    });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true, data: publicUser(user) });
  }));
  return router;
}

const service = createService({ name: "identity-service", mount: "/api/auth", router });
const publisher = createEventPublisher({ service: "identity-service", pool: service.pool, logger: service.logger });
service.start().then(() => publisher.start()).catch((error) => { service.logger.fatal({ err: error }, "startup failed"); process.exit(1); });
