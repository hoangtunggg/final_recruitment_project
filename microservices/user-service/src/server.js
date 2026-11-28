const express = require("express");
const { createService, auth, roles, asyncHandler, pageParams } = require("@jobportal/service-kit");

const identityUrl = () => process.env.IDENTITY_SERVICE_URL || "http://identity-service:3000";
async function identity(path, options = {}) {
  const response = await fetch(`${identityUrl()}/api/auth/internal${path}`, { ...options, headers: { "content-type": "application/json", "x-internal-service-token": process.env.INTERNAL_SERVICE_TOKEN, ...(options.headers || {}) } });
  const body = await response.json();
  if (!response.ok) { const error = new Error(body.error || "Identity service request failed"); error.status = response.status; error.expose = true; throw error; }
  return body;
}
async function allIdentityUsers() {
  const first = await identity("/users?limit=100&page=1");
  const pages = first.data.pagination.totalPages;
  const rest = await Promise.all(Array.from({ length: Math.max(0, pages - 1) }, (_, index) => identity(`/users?limit=100&page=${index + 2}`)));
  return [first, ...rest].flatMap((result) => result.data.users);
}
async function domainStats(baseUrl) {
  const response = await fetch(`${baseUrl}/internal/stats`, { headers: { "x-internal-service-token": process.env.INTERNAL_SERVICE_TOKEN } });
  if (!response.ok) { const error = new Error("Domain statistics unavailable"); error.status = 503; throw error; }
  return (await response.json()).data;
}
function profile(row) {
  if (!row) return {};
  return { phone: row.phone, profilePicture: row.profile_picture, resumePath: row.resume_path, skills: row.skills, experience: row.experience, education: row.education, bio: row.bio, location: row.location, website: row.website, linkedin: row.linkedin, github: row.github, applicationsCount: row.applications_count, savedJobsCount: row.saved_jobs_count, subscriptionPlan: row.subscription?.plan || "free", subscriptionExpires: row.subscription?.expiresAt, employerDetails: row.employer_details };
}
function auditLog(row) {
  const details = typeof row.details === "string" ? row.details : row.details?.text || JSON.stringify(row.details || {});
  return { id: row.id, action: row.action, targetUserId: row.target_user_id, performedBy: row.performed_by, details, ipAddress: row.ip_address, userAgent: row.user_agent, createdAt: row.created_at };
}
const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
function router(pool) {
  const r = express.Router();
  r.get("/settings", ...roles("admin"), asyncHandler(async (_req, res) => { const rows=(await pool.query("SELECT category,value FROM system_settings ORDER BY category")).rows; res.json({success:true,data:Object.fromEntries(rows.map(x=>[x.category,x.value]))}); }));
  r.put("/settings", ...roles("admin"), asyncHandler(async (req,res)=>{for(const[category,value]of Object.entries(req.body||{}))await pool.query("INSERT INTO system_settings(category,value,updated_by) VALUES($1,$2::jsonb,$3) ON CONFLICT(category) DO UPDATE SET value=excluded.value,updated_by=excluded.updated_by,updated_at=now()",[category,JSON.stringify(value),req.user.id]);res.json({success:true,message:"Settings updated successfully",data:req.body});}));
  const resetSettings=asyncHandler(async(req,res)=>{if(req.params.category)await pool.query("DELETE FROM system_settings WHERE category=$1",[req.params.category]);else await pool.query("DELETE FROM system_settings");res.json({success:true,message:"Settings reset successfully",data:{}});});
  r.post("/settings/reset", ...roles("admin"), resetSettings);
  r.post("/settings/reset/:category", ...roles("admin"), resetSettings);
  r.post("/audit/log", ...roles("admin"), asyncHandler(async(req,res)=>{const row=(await pool.query("INSERT INTO audit_logs(action,target_user_id,performed_by,details,ip_address,user_agent) VALUES($1,$2,$3,$4::jsonb,$5,$6) RETURNING *",[req.body.action,req.body.targetUserId||null,req.user.id,JSON.stringify(req.body.details||{}),req.ip,req.get("user-agent")])).rows[0];res.status(201).json({success:true,data:auditLog(row)});}));
  r.get("/audit/export", ...roles("admin"), asyncHandler(async(req,res)=>{const values=[];const where=[];if(req.query.action&&req.query.action!=="all"){values.push(req.query.action);where.push(`action=$${values.length}`);}if(req.query.userId&&req.query.userId!=="all"){values.push(req.query.userId);where.push(`(performed_by=$${values.length} OR target_user_id=$${values.length})`);}if(req.query.startDate){values.push(req.query.startDate);where.push(`created_at >= $${values.length}::timestamptz`);}if(req.query.endDate){values.push(req.query.endDate);where.push(`created_at <= $${values.length}::timestamptz`);}const rows=(await pool.query(`SELECT * FROM audit_logs ${where.length?`WHERE ${where.join(" AND ")}`:""} ORDER BY created_at DESC LIMIT 10000`,values)).rows.map(auditLog);const header=["id","createdAt","action","performedBy","targetUserId","details","ipAddress"];const csv=[header.join(","),...rows.map(row=>header.map(key=>csvCell(row[key])).join(","))].join("\n");res.set({"content-type":"text/csv; charset=utf-8","content-disposition":`attachment; filename="audit-logs-${new Date().toISOString().slice(0,10)}.csv"`}).send(`\uFEFF${csv}`);}));
  r.get("/audit/logs", ...roles("admin"), asyncHandler(async(req,res)=>{const{page,limit,offset}=pageParams(req.query);const rows=(await pool.query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2",[limit,offset])).rows;const count=Number((await pool.query("SELECT count(*) FROM audit_logs")).rows[0].count);res.json({success:true,data:{logs:rows.map(auditLog),pagination:{currentPage:page,totalPages:Math.ceil(count/limit)||1,totalLogs:count,hasNext:page*limit<count,hasPrev:page>1}}});}));
  r.get("/audit/user/:userId/activity", ...roles("admin"), asyncHandler(async(req,res)=>{const rows=(await pool.query("SELECT * FROM audit_logs WHERE target_user_id=$1 OR performed_by=$1 ORDER BY created_at DESC LIMIT 100",[req.params.userId])).rows;res.json({success:true,data:rows.map(auditLog)});}));
  r.get("/audit/stats", ...roles("admin"), asyncHandler(async(_req,res)=>{const rows=(await pool.query("SELECT action,count(*)::int count FROM audit_logs GROUP BY action ORDER BY count DESC")).rows;res.json({success:true,data:{total:rows.reduce((n,x)=>n+x.count,0),byAction:rows}});}));
  r.get("/", ...roles("admin"), asyncHandler(async (req, res) => res.json(await identity(`/users?${new URLSearchParams(req.query)}`))));
  r.get("/statistics", ...roles("admin"), asyncHandler(async (_req, res) => {
    const [list, jobStats, applicationStats] = await Promise.all([
      allIdentityUsers(),
      domainStats(process.env.JOB_SERVICE_URL || "http://job-service:3000/api/jobs"),
      domainStats(process.env.APPLICATION_SERVICE_URL || "http://application-service:3000/api/applications"),
    ]);
    const roleCounts = Object.fromEntries(["jobseeker", "employer", "admin"].map((role) => [role, list.filter((user) => user.role === role).length]));
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const byDate = new Map();
    for (const user of list) if (new Date(user.createdAt).getTime() >= cutoff) { const date = new Date(user.createdAt).toISOString().slice(0, 10); byDate.set(date, (byDate.get(date) || 0) + 1); }
    res.json({ success: true, data: {
      totalUsers: list.length, totalJobs: jobStats.totalJobs, totalApplications: applicationStats.totalApplications, recentActivity: applicationStats.recentActivity,
      activeUsers: list.filter((user) => user.status === "active").length, inactiveUsers: list.filter((user) => user.status === "inactive").length, blockedUsers: list.filter((user) => user.status === "blocked").length,
      jobseekers: roleCounts.jobseeker, employers: roleCounts.employer, admins: roleCounts.admin,
      roleStats: Object.entries(roleCounts).map(([role, count]) => ({ role, count })), recentUsers: list.slice(0, 5), registrationTrend: [...byDate].sort().map(([date, count]) => ({ date, count })),
    } });
  }));
  r.get("/profile", auth(), asyncHandler(async (req, res) => {
    const [user, result] = await Promise.all([identity(`/users/${req.user.id}`), pool.query("SELECT * FROM profiles WHERE user_id=$1", [req.user.id])]);
    res.json({ success: true, data: { ...user.data, ...profile(result.rows[0]) } });
  }));
  r.put("/profile", auth(), asyncHandler(async (req, res) => {
    const structured = (value, fallback) => typeof value === "string" ? (() => { try { return JSON.parse(value); } catch { return fallback; } })() : (value ?? fallback);
    const values = [req.user.id, req.body.phone || null, req.body.profilePicture || null, structured(req.body.skills, []), structured(req.body.experience, []), structured(req.body.education, []), req.body.bio || null, req.body.location || null, req.body.website || null, req.body.linkedin || null, req.body.github || null, structured(req.body.employerDetails, {})];
    const row = (await pool.query(`INSERT INTO profiles(user_id,phone,profile_picture,skills,experience,education,bio,location,website,linkedin,github,employer_details)
      VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,$7,$8,$9,$10,$11,$12::jsonb)
      ON CONFLICT(user_id) DO UPDATE SET phone=excluded.phone,profile_picture=excluded.profile_picture,skills=excluded.skills,experience=excluded.experience,education=excluded.education,bio=excluded.bio,location=excluded.location,website=excluded.website,linkedin=excluded.linkedin,github=excluded.github,employer_details=excluded.employer_details,updated_at=now() RETURNING *`, values.map((v, i) => [3,4,5,11].includes(i) ? JSON.stringify(v) : v))).rows[0];
    res.json({ success: true, data: profile(row) });
  }));
  r.get("/:id/activity", ...roles("admin"), asyncHandler(async (req, res) => {
    const { page, limit, offset } = pageParams(req.query);
    const { rows } = await pool.query("SELECT * FROM audit_logs WHERE target_user_id=$1 OR performed_by=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3", [req.params.id, limit, offset]);
    res.json({ success: true, data: { activities: rows.map(auditLog), pagination: { page, limit } } });
  }));
  r.get("/:id", ...roles("admin"), asyncHandler(async (req, res) => {
    const [user, p] = await Promise.all([identity(`/users/${req.params.id}`), pool.query("SELECT * FROM profiles WHERE user_id=$1", [req.params.id])]);
    res.json({ success: true, data: { ...user.data, ...profile(p.rows[0]) } });
  }));
  for (const endpoint of ["role", "status"]) r.put(`/:id/${endpoint}`, ...roles("admin"), asyncHandler(async (req, res) => {
    const result = await identity(`/users/${req.params.id}`, { method: "PATCH", body: JSON.stringify({ [endpoint]: req.body[endpoint] }) });
    await pool.query("INSERT INTO audit_logs(action,target_user_id,performed_by,details,ip_address,user_agent) VALUES($1,$2,$3,$4::jsonb,$5,$6)", [endpoint === "role" ? "ROLE_CHANGE" : "STATUS_CHANGE", req.params.id, req.user.id, JSON.stringify(req.body), req.ip, req.get("user-agent")]);
    res.json({ success: true, data: result.data });
  }));
  r.put("/:id", ...roles("admin"), asyncHandler(async (req, res) => res.json(await identity(`/users/${req.params.id}`, { method: "PATCH", body: JSON.stringify(req.body) }))));
  r.delete("/:id", ...roles("admin"), asyncHandler(async (req, res) => {
    const user = await identity(`/users/${req.params.id}`);
    await identity(`/users/${req.params.id}`, { method: "DELETE" });
    await pool.query("DELETE FROM profiles WHERE user_id=$1", [req.params.id]);
    await pool.query("INSERT INTO audit_logs(action,performed_by,details,ip_address,user_agent) VALUES('USER_DELETE',$1,$2::jsonb,$3,$4)", [req.user.id, JSON.stringify({ text: `Deleted user: ${user.data.name} (${user.data.email}), ID: ${req.params.id}, Role: ${user.data.role}` }), req.ip, req.get("user-agent")]);
    res.json({ success: true, message: "User deleted successfully" });
  }));
  return r;
}
const service = createService({ name: "user-service", mount: "/api/users", router });
service.start().catch((error) => { service.logger.fatal({ err: error }, "startup failed"); process.exit(1); });
