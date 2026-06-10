"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.ts
var server_exports = {};
__export(server_exports, {
  io: () => io
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"));
var import_http = require("http");
var import_socket = require("socket.io");
var import_cors = __toESM(require("cors"));
var import_dotenv2 = __toESM(require("dotenv"));
var import_path = __toESM(require("path"));

// db.ts
var import_pg = require("pg");
var import_dotenv = __toESM(require("dotenv"));
import_dotenv.default.config();
var pool = new import_pg.Pool(
  process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  } : {
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "bloomaudit",
    password: process.env.DB_PASSWORD || "password",
    port: parseInt(process.env.DB_PORT || "5432")
  }
);
var db_default = pool;

// index.ts
var import_bcrypt = __toESM(require("bcrypt"));
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
import_dotenv2.default.config();
var app = (0, import_express.default)();
var http = (0, import_http.createServer)(app);
var PORT = parseInt(process.env.PORT || "5001", 10);
var JWT_SECRET = process.env.JWT_SECRET || "bloomaudit_super_secret_key";
var io = new import_socket.Server(http, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
  }
});
io.on("connection", (socket) => {
  socket.join("admins");
  socket.on("disconnect", () => {
  });
});
async function emitNotification(type, userId, title, message, metadata = {}) {
  try {
    const result = await db_default.query(
      `INSERT INTO notifications (type, user_id, title, message, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [type, userId, title, message, JSON.stringify(metadata)]
    );
    io.to("admins").emit("notification:new", result.rows[0]);
    return result.rows[0];
  } catch (err) {
    console.error("Notification emit error:", err.message);
  }
}
var allowedOrigins = process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(",").map((o) => o.trim()) : ["http://localhost:5173"];
app.use((0, import_cors.default)({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin))
      return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(import_express.default.json());
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ success: false, error: "No token provided." });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    if (decoded.role !== "admin")
      return res.status(403).json({ success: false, error: "Admins only." });
    req.adminUser = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Invalid or expired token." });
  }
}
app.get("/health", (_req, res) => res.json({ status: "OK", timestamp: (/* @__PURE__ */ new Date()).toISOString() }));
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, tenant_id, source, package_id: reqPackageId, package_name, plan_type } = req.body;
    let resolvedPackageId = reqPackageId || null;
    if (!resolvedPackageId && package_name) {
      const pkgRes = await db_default.query("SELECT id FROM packages WHERE name=$1", [package_name]);
      if (pkgRes.rows.length)
        resolvedPackageId = pkgRes.rows[0].id;
    }
    const password_hash = await import_bcrypt.default.hash(password, 10);
    const result = await db_default.query(
      `INSERT INTO users (name,email,password_hash,role,tenant_id,source,package_id,plan_type,account_status,purchase_date)
       VALUES($1,$2,$3,'customer',$4,$5,$6,$7,'active',CURRENT_DATE)
       RETURNING id,name,email,role,created_at`,
      [name, email, password_hash, tenant_id || null, source || "manual", resolvedPackageId, plan_type || "monthly"]
    );
    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (err) {
    if (err.code === "23505")
      return res.status(400).json({ success: false, error: "Email already exists." });
    res.status(500).json({ success: false, error: "Registration failed." });
  }
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const r = await db_default.query("SELECT * FROM users WHERE email=$1", [email]);
    if (!r.rows.length)
      return res.status(401).json({ success: false, error: "Invalid credentials." });
    const user = r.rows[0];
    if (!await import_bcrypt.default.compare(password, user.password_hash))
      return res.status(401).json({ success: false, error: "Invalid credentials." });
    const token = import_jsonwebtoken.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role, account_status: user.account_status, tenant_id: user.tenant_id, source: user.source } });
  } catch {
    res.status(500).json({ success: false, error: "Login failed." });
  }
});
app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const r = await db_default.query("SELECT * FROM dashboard_admins WHERE email=$1 AND is_active=TRUE", [email]);
    if (!r.rows.length)
      return res.status(401).json({ success: false, error: "Invalid credentials or not an admin." });
    const admin = r.rows[0];
    if (!await import_bcrypt.default.compare(password, admin.password_hash))
      return res.status(401).json({ success: false, error: "Invalid credentials or not an admin." });
    await db_default.query("UPDATE dashboard_admins SET last_login_at=NOW() WHERE id=$1", [admin.id]);
    const token = import_jsonwebtoken.default.sign({ id: admin.id, email: admin.email, role: "admin" }, JWT_SECRET, { expiresIn: "8h" });
    res.json({ success: true, token, admin: { id: admin.id, name: admin.name, email: admin.email, role: "admin" } });
  } catch {
    res.status(500).json({ success: false, error: "Admin login failed." });
  }
});
app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
  try {
    const [total, active, suspended, revenue, pkgs] = await Promise.all([
      db_default.query(`SELECT COUNT(*) FROM users WHERE role!='admin'`),
      db_default.query(`SELECT COUNT(*) FROM users WHERE account_status='active' AND role!='admin'`),
      db_default.query(`SELECT COUNT(*) FROM users WHERE account_status='suspended' AND role!='admin'`),
      db_default.query(`
        SELECT COALESCE(SUM(
          CASE WHEN u.plan_type='monthly' THEN COALESCE(p.price_monthly, 0)
               WHEN u.plan_type='yearly'  THEN COALESCE(p.price_yearly, 0)
               ELSE COALESCE(p.price_monthly, p.price_yearly, 0) END
        ), 0) AS total
        FROM users u
        LEFT JOIN packages p ON p.id = u.package_id
        WHERE u.role!='admin' AND u.account_status='active'
      `),
      db_default.query(`
        SELECT COALESCE(p.display_name, p.name, 'No Package') AS package_name, COUNT(u.id)::text AS count
        FROM users u
        LEFT JOIN packages p ON p.id = u.package_id
        WHERE u.role!='admin'
        GROUP BY p.id, p.display_name, p.name
        ORDER BY COUNT(u.id) DESC
      `)
    ]);
    res.json({ success: true, stats: { totalUsers: +total.rows[0].count, activeUsers: +active.rows[0].count, suspendedUsers: +suspended.rows[0].count, totalRevenue: +revenue.rows[0].total, packageBreakdown: pkgs.rows } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch stats." });
  }
});
app.get("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const search = req.query.search || "";
    const status = req.query.status || "";
    const pkg = req.query.package || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const conditions = [`u.role!='admin'`];
    const params = [];
    let idx = 1;
    if (search) {
      conditions.push(`(u.name ILIKE $${idx} OR u.email ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (status) {
      conditions.push(`u.account_status=$${idx}`);
      params.push(status);
      idx++;
    }
    if (pkg) {
      conditions.push(`p.name=$${idx}`);
      params.push(pkg);
      idx++;
    }
    const where = `WHERE ${conditions.join(" AND ")}`;
    const [users, countResult] = await Promise.all([
      db_default.query(
        `SELECT u.id, u.name, u.email, u.role, u.role_id, u.tenant_id, u.source,
                u.password_must_change, u.account_status, u.created_at, u.package_id,
                u.plan_type, u.purchase_date,
                p.name AS package_name, COALESCE(p.display_name, p.name) AS package_display_name,
                p.price_monthly, p.price_yearly, p.max_users AS package_max_users
         FROM users u
         LEFT JOIN packages p ON p.id = u.package_id
         ${where} ORDER BY u.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
      db_default.query(
        `SELECT COUNT(*) FROM users u LEFT JOIN packages p ON p.id = u.package_id ${where}`,
        params
      )
    ]);
    res.json({ success: true, users: users.rows, total: +countResult.rows[0].count, page, totalPages: Math.ceil(+countResult.rows[0].count / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch users." });
  }
});
app.get("/api/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const [userResult, subStats, pkgResult] = await Promise.all([
      db_default.query(
        `SELECT u.id, u.name, u.email, u.role, u.role_id, u.tenant_id, u.source,
                u.password_must_change, u.account_status, u.created_at, u.package_id,
                u.plan_type, u.purchase_date, u.subscription_end_date,
                p.name AS package_name, COALESCE(p.display_name, p.name) AS package_display_name,
                p.price_monthly, p.price_yearly,
                COALESCE(u.subscription_end_date,
                  CASE WHEN u.plan_type='monthly' THEN u.purchase_date+INTERVAL '1 month'
                       WHEN u.plan_type='yearly'  THEN u.purchase_date+INTERVAL '1 year'
                       ELSE NULL END)::date AS computed_end_date,
                CASE WHEN COALESCE(u.subscription_end_date,
                  CASE WHEN u.plan_type='monthly' THEN u.purchase_date+INTERVAL '1 month'
                       WHEN u.plan_type='yearly'  THEN u.purchase_date+INTERVAL '1 year'
                       ELSE NULL END) IS NOT NULL
                THEN (COALESCE(u.subscription_end_date,
                  CASE WHEN u.plan_type='monthly' THEN u.purchase_date+INTERVAL '1 month'
                       WHEN u.plan_type='yearly'  THEN u.purchase_date+INTERVAL '1 year'
                       ELSE NULL END)::date - CURRENT_DATE)
                ELSE NULL END AS days_remaining
         FROM users u
         LEFT JOIN packages p ON p.id = u.package_id
         WHERE u.id=$1`,
        [userId]
      ),
      db_default.query(
        `SELECT COUNT(*) AS total,
                COUNT(*) FILTER(WHERE is_active)     AS active,
                COUNT(*) FILTER(WHERE NOT is_active) AS inactive
         FROM sub_users WHERE main_user_id=$1`,
        [userId]
      ),
      db_default.query(
        `SELECT p.max_users, p.features, p.description
         FROM packages p
         JOIN users u ON u.package_id = p.id
         WHERE u.id=$1 LIMIT 1`,
        [userId]
      )
    ]);
    if (!userResult.rows.length)
      return res.status(404).json({ success: false, error: "User not found." });
    const user = userResult.rows[0];
    const sub = subStats.rows[0];
    res.json({
      success: true,
      user: {
        ...user,
        sub_user_stats: { total: +sub.total, active: +sub.active, inactive: +sub.inactive },
        package_details: pkgResult.rows[0] ?? null
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch user." });
  }
});
app.put("/api/admin/users/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!["active", "suspended", "inactive"].includes(status))
      return res.status(400).json({ success: false, error: "Invalid status." });
    const r = await db_default.query(
      `UPDATE users SET account_status=$1 WHERE id=$2 RETURNING id,name,email,account_status`,
      [status, req.params.id]
    );
    if (!r.rows.length)
      return res.status(404).json({ success: false, error: "User not found." });
    res.json({ success: true, user: r.rows[0] });
  } catch {
    res.status(500).json({ success: false, error: "Failed to update status." });
  }
});
app.get("/api/admin/users/:id/sub-users", requireAdmin, async (req, res) => {
  try {
    const r = await db_default.query(
      `SELECT id,name,email,role,department,is_active,created_at FROM sub_users WHERE main_user_id=$1 ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, sub_users: r.rows });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch sub users." });
  }
});
app.post("/api/admin/users/:id/sub-users", requireAdmin, async (req, res) => {
  try {
    const { name, email, role, department } = req.body;
    const mainUserId = req.params.id;
    if (!name?.trim())
      return res.status(400).json({ success: false, error: "Name is required." });
    const mainUser = await db_default.query(
      `SELECT u.name AS main_name, p.max_users,
              (SELECT COUNT(*) FROM sub_users WHERE main_user_id=u.id) AS current_count
       FROM users u LEFT JOIN packages p ON p.id=u.package_id WHERE u.id=$1`,
      [mainUserId]
    );
    if (!mainUser.rows.length)
      return res.status(404).json({ success: false, error: "User not found." });
    const { max_users, current_count, main_name } = mainUser.rows[0];
    if (max_users !== null && +current_count >= +max_users) {
      await emitNotification(
        "user_limit_exceeded",
        +mainUserId,
        "User Limit Exceeded",
        `${main_name} tried to add an additional user but their package limit of ${max_users} has been reached.`,
        { main_user_id: +mainUserId, main_user_name: main_name, limit: max_users, attempted_at: (/* @__PURE__ */ new Date()).toISOString() }
      );
      return res.status(400).json({ success: false, error: `User limit reached. Package allows up to ${max_users} users.` });
    }
    const r = await db_default.query(
      `INSERT INTO sub_users(main_user_id,name,email,role,department) VALUES($1,$2,$3,$4,$5)
       RETURNING id,name,email,role,department,is_active,created_at`,
      [mainUserId, name.trim(), email?.trim() || null, role?.trim() || "user", department?.trim() || null]
    );
    res.status(201).json({ success: true, sub_user: r.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to add sub user." });
  }
});
app.patch("/api/admin/sub-users/:subId/toggle", requireAdmin, async (req, res) => {
  try {
    const r = await db_default.query(
      `UPDATE sub_users SET is_active=NOT is_active WHERE id=$1 RETURNING id,name,is_active`,
      [req.params.subId]
    );
    if (!r.rows.length)
      return res.status(404).json({ success: false, error: "Sub user not found." });
    res.json({ success: true, sub_user: r.rows[0] });
  } catch {
    res.status(500).json({ success: false, error: "Failed to toggle." });
  }
});
app.delete("/api/admin/sub-users/:subId", requireAdmin, async (req, res) => {
  try {
    const r = await db_default.query(`DELETE FROM sub_users WHERE id=$1 RETURNING id`, [req.params.subId]);
    if (!r.rows.length)
      return res.status(404).json({ success: false, error: "Sub user not found." });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: "Failed to delete." });
  }
});
app.get("/api/admin/packages", requireAdmin, async (_req, res) => {
  try {
    const r = await db_default.query(
      `SELECT p.id, p.name,
              COALESCE(p.display_name, p.name) AS display_name,
              p.price_monthly, p.price_yearly,
              p.description, p.features, p.max_users,
              COUNT(u.id) AS total_subscribers,
              COUNT(u.id) FILTER(WHERE u.account_status='active')    AS active_subscribers,
              COUNT(u.id) FILTER(WHERE u.account_status='suspended') AS suspended_subscribers,
              COALESCE(SUM(
                CASE WHEN u.plan_type='yearly' THEN COALESCE(p.price_yearly,0)
                     ELSE COALESCE(p.price_monthly,0) END
              ) FILTER(WHERE u.account_status='active'),0) AS revenue
       FROM packages p
       LEFT JOIN users u ON u.package_id=p.id AND u.role!='admin'
       WHERE p.is_active=TRUE
       GROUP BY p.id,p.name,p.display_name,p.price_monthly,p.price_yearly,p.description,p.features,p.max_users
       ORDER BY COALESCE(p.price_monthly, p.price_yearly) ASC NULLS LAST`
    );
    res.json({ success: true, packages: r.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch packages." });
  }
});
app.post("/api/admin/packages", requireAdmin, async (req, res) => {
  try {
    const { name, display_name, price_monthly, price_yearly, description, max_users, features, is_active } = req.body;
    if (!name?.trim())
      return res.status(400).json({ success: false, error: "Package name is required." });
    if ((!price_monthly || isNaN(+price_monthly)) && (!price_yearly || isNaN(+price_yearly)))
      return res.status(400).json({ success: false, error: "At least one price (monthly or yearly) is required." });
    const fallbackPrice = price_monthly ? +price_monthly : +price_yearly;
    const fallbackPlanType = price_monthly ? "monthly" : "yearly";
    const r = await db_default.query(
      `INSERT INTO packages(name,display_name,price,plan_type,price_monthly,price_yearly,description,max_users,features,is_active)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        name.trim(),
        display_name?.trim() || name.trim(),
        fallbackPrice,
        fallbackPlanType,
        price_monthly ? +price_monthly : null,
        price_yearly ? +price_yearly : null,
        description?.trim() || null,
        max_users ? +max_users : null,
        JSON.stringify(Array.isArray(features) ? features : []),
        is_active !== false
      ]
    );
    res.status(201).json({ success: true, package: r.rows[0] });
  } catch (err) {
    if (err.code === "23505")
      return res.status(400).json({ success: false, error: "Package name already exists." });
    res.status(500).json({ success: false, error: "Failed to create package." });
  }
});
app.put("/api/admin/users/:id/package", requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { package_id, plan_type, purchase_date } = req.body;
    if (!package_id)
      return res.status(400).json({ success: false, error: "Package is required." });
    if (!["monthly", "yearly"].includes(plan_type))
      return res.status(400).json({ success: false, error: "Plan type must be monthly or yearly." });
    const date = purchase_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const interval = plan_type === "yearly" ? "1 year" : "1 month";
    const pkgCheck = await db_default.query(
      `SELECT id, COALESCE(display_name, name) AS display_name FROM packages WHERE id=$1 AND is_active=TRUE`,
      [package_id]
    );
    if (!pkgCheck.rows.length)
      return res.status(404).json({ success: false, error: "Package not found." });
    const r = await db_default.query(
      `UPDATE users
       SET package_id=$1, plan_type=$2, purchase_date=$3::date,
           subscription_end_date=($3::date + $4::interval)
       WHERE id=$5
       RETURNING id, name, email, package_id, plan_type, purchase_date, subscription_end_date`,
      [package_id, plan_type, date, interval, userId]
    );
    if (!r.rows.length)
      return res.status(404).json({ success: false, error: "User not found." });
    const updated = r.rows[0];
    await emitNotification(
      "package_updated",
      updated.id,
      "Package Updated",
      `${updated.name}'s package was updated to ${pkgCheck.rows[0].display_name} (${plan_type}).`,
      { package_id, plan_type, purchase_date: date, updated_by: req.adminUser?.email }
    );
    res.json({ success: true, user: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to update package." });
  }
});
async function checkExpiryNotifications() {
  try {
    const expiring = await db_default.query(
      `SELECT u.id, u.name, u.email, COALESCE(p.display_name, p.name) AS package_name,
              u.plan_type, u.purchase_date,
              COALESCE(u.subscription_end_date,
                CASE WHEN u.plan_type='monthly' THEN u.purchase_date+INTERVAL '1 month'
                     WHEN u.plan_type='yearly'  THEN u.purchase_date+INTERVAL '1 year'
                     ELSE NULL END)::date AS end_date,
              (COALESCE(u.subscription_end_date,
                CASE WHEN u.plan_type='monthly' THEN u.purchase_date+INTERVAL '1 month'
                     WHEN u.plan_type='yearly'  THEN u.purchase_date+INTERVAL '1 year'
                     ELSE NULL END)::date - CURRENT_DATE) AS days_remaining
       FROM users u
       LEFT JOIN packages p ON p.id = u.package_id
       WHERE u.role!='admin'
         AND u.account_status='active'
         AND (COALESCE(u.subscription_end_date,
               CASE WHEN u.plan_type='monthly' THEN u.purchase_date+INTERVAL '1 month'
                    WHEN u.plan_type='yearly'  THEN u.purchase_date+INTERVAL '1 year'
                    ELSE NULL END)::date - CURRENT_DATE)
             BETWEEN 0 AND
             CASE WHEN u.plan_type='yearly' THEN 30 ELSE 7 END`
    );
    for (const u of expiring.rows) {
      const existing = await db_default.query(
        `SELECT id FROM notifications WHERE type='expire_warning' AND user_id=$1
         AND created_at::date=CURRENT_DATE`,
        [u.id]
      );
      if (existing.rows.length)
        continue;
      await emitNotification(
        "expire_warning",
        u.id,
        "Package Expiring Soon",
        `${u.name}'s ${u.package_name} package expires in ${u.days_remaining} day${u.days_remaining === 1 ? "" : "s"} (${new Date(u.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}).`,
        { days_remaining: u.days_remaining, end_date: u.end_date, package_name: u.package_name, email: u.email }
      );
    }
  } catch (err) {
    console.error("Expiry check error:", err.message);
  }
}
app.get("/api/admin/notifications", requireAdmin, async (req, res) => {
  try {
    const type = req.query.type || "";
    const unread = req.query.unread === "true";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let idx = 1;
    if (type) {
      const typeList = type.split(",").map((t) => t.trim()).filter(Boolean);
      if (typeList.length === 1) {
        conditions.push(`n.type=$${idx}`);
        params.push(typeList[0]);
        idx++;
      } else if (typeList.length > 1) {
        conditions.push(`n.type=ANY($${idx}::text[])`);
        params.push(typeList);
        idx++;
      }
    }
    if (unread) {
      conditions.push(`n.is_read=FALSE`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows, countResult] = await Promise.all([
      db_default.query(
        `SELECT n.*, u.name AS user_name, u.email AS user_email,
                COALESCE(p.display_name, p.name) AS user_package
         FROM notifications n
         LEFT JOIN users u ON u.id=n.user_id
         LEFT JOIN packages p ON p.id=u.package_id
         ${where} ORDER BY n.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
      db_default.query(`SELECT COUNT(*) FROM notifications n ${where}`, params)
    ]);
    const unreadCount = await db_default.query(`SELECT COUNT(*) FROM notifications WHERE is_read=FALSE`);
    res.json({ success: true, notifications: rows.rows, total: +countResult.rows[0].count, page, totalPages: Math.ceil(+countResult.rows[0].count / limit), unreadCount: +unreadCount.rows[0].count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch notifications." });
  }
});
app.get("/api/admin/notifications/expiring", requireAdmin, async (_req, res) => {
  try {
    const r = await db_default.query(
      `SELECT u.id, u.name, u.email, u.tenant_id, u.plan_type, u.purchase_date,
              COALESCE(p.display_name, p.name) AS package_name,
              COALESCE(
                CASE WHEN u.plan_type='monthly' THEN p.price_monthly
                     WHEN u.plan_type='yearly'  THEN p.price_yearly
                     ELSE COALESCE(p.price_monthly, p.price_yearly) END, 0
              ) AS package_price,
              COALESCE(u.subscription_end_date,
                CASE WHEN u.plan_type='monthly' THEN u.purchase_date+INTERVAL '1 month'
                     WHEN u.plan_type='yearly'  THEN u.purchase_date+INTERVAL '1 year'
                     ELSE NULL END)::date AS end_date,
              (COALESCE(u.subscription_end_date,
                CASE WHEN u.plan_type='monthly' THEN u.purchase_date+INTERVAL '1 month'
                     WHEN u.plan_type='yearly'  THEN u.purchase_date+INTERVAL '1 year'
                     ELSE NULL END)::date - CURRENT_DATE) AS days_remaining
       FROM users u
       LEFT JOIN packages p ON p.id = u.package_id
       WHERE u.role!='admin'
         AND u.account_status='active'
         AND (COALESCE(u.subscription_end_date,
               CASE WHEN u.plan_type='monthly' THEN u.purchase_date+INTERVAL '1 month'
                    WHEN u.plan_type='yearly'  THEN u.purchase_date+INTERVAL '1 year'
                    ELSE NULL END)::date - CURRENT_DATE)
             BETWEEN 0 AND
             CASE WHEN u.plan_type='yearly' THEN 30 ELSE 7 END
       ORDER BY days_remaining ASC`
    );
    res.json({ success: true, users: r.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch expiring users." });
  }
});
app.get("/api/admin/notifications/counts", requireAdmin, async (_req, res) => {
  try {
    const r = await db_default.query(
      `SELECT
         COUNT(*) FILTER(WHERE is_read=FALSE) AS total_unread,
         COUNT(*) FILTER(WHERE type='expire_warning'      AND is_read=FALSE) AS expire_unread,
         COUNT(*) FILTER(WHERE type!='expire_warning'     AND is_read=FALSE) AS other_unread
       FROM notifications`
    );
    const row = r.rows[0];
    res.json({ success: true, total: +row.total_unread, expire: +row.expire_unread, other: +row.other_unread });
  } catch {
    res.status(500).json({ success: false, error: "Failed to fetch counts." });
  }
});
app.patch("/api/admin/notifications/:id/read", requireAdmin, async (req, res) => {
  try {
    await db_default.query(`UPDATE notifications SET is_read=TRUE WHERE id=$1`, [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: "Failed to mark read." });
  }
});
app.patch("/api/admin/notifications/read-all", requireAdmin, async (req, res) => {
  try {
    const { type, types } = req.body;
    if (Array.isArray(types) && types.length) {
      await db_default.query(`UPDATE notifications SET is_read=TRUE WHERE type=ANY($1::text[]) AND is_read=FALSE`, [types]);
    } else if (type) {
      await db_default.query(`UPDATE notifications SET is_read=TRUE WHERE type=$1 AND is_read=FALSE`, [type]);
    } else {
      await db_default.query(`UPDATE notifications SET is_read=TRUE WHERE is_read=FALSE`);
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: "Failed to mark all read." });
  }
});
var clientBuild = import_path.default.resolve(
  __dirname,
  import_path.default.basename(__dirname) === "dist" ? "../../client/dist" : "../client/dist"
);
app.use(import_express.default.static(clientBuild));
app.get("*", (_req, res) => {
  res.sendFile(import_path.default.join(clientBuild, "index.html"));
});
async function initSchema() {
  await db_default.query(`
    CREATE TABLE IF NOT EXISTS users (
      id                SERIAL PRIMARY KEY,
      name              VARCHAR(255) NOT NULL,
      email             VARCHAR(255) NOT NULL UNIQUE,
      password_hash     VARCHAR(255) NOT NULL,
      role              VARCHAR(50)  NOT NULL DEFAULT 'customer',
      company_type      VARCHAR(100),
      package_name      VARCHAR(100),
      package_price     NUMERIC(10,2),
      no_of_users       INTEGER      DEFAULT 1,
      plan_type         VARCHAR(50)  DEFAULT 'monthly',
      account_status    VARCHAR(50)  NOT NULL DEFAULT 'active',
      package_status    VARCHAR(50)  NOT NULL DEFAULT 'active',
      purchase_date     DATE,
      created_at        TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      status_changed_at TIMESTAMP WITHOUT TIME ZONE,
      status_changed_by INTEGER,
      status_reason     TEXT,
      subscription_end_date DATE
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS package_status    VARCHAR(50) DEFAULT 'active';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS no_of_users       INTEGER DEFAULT 1;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMP WITHOUT TIME ZONE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS status_changed_by INTEGER;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS status_reason     TEXT;

    CREATE TABLE IF NOT EXISTS packages (
      id            SERIAL PRIMARY KEY,
      name          VARCHAR(100) NOT NULL UNIQUE,
      display_name  VARCHAR(100),
      price         NUMERIC(10,2),
      plan_type     VARCHAR(50)  DEFAULT 'monthly',
      price_monthly NUMERIC(10,2),
      price_yearly  NUMERIC(10,2),
      description   TEXT,
      features      JSONB        NOT NULL DEFAULT '[]',
      max_users     INTEGER,
      is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
      created_at    TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE packages ADD COLUMN IF NOT EXISTS display_name  VARCHAR(100);
    ALTER TABLE packages ADD COLUMN IF NOT EXISTS price_monthly NUMERIC(10,2);
    ALTER TABLE packages ADD COLUMN IF NOT EXISTS price_yearly  NUMERIC(10,2);

    CREATE TABLE IF NOT EXISTS sub_users (
      id            SERIAL PRIMARY KEY,
      main_user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name          VARCHAR(255) NOT NULL,
      email         VARCHAR(255),
      role          VARCHAR(100) DEFAULT 'user',
      department    VARCHAR(100),
      is_active     BOOLEAN NOT NULL DEFAULT TRUE,
      created_at    TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id         SERIAL PRIMARY KEY,
      type       VARCHAR(60)  NOT NULL,
      user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title      VARCHAR(255) NOT NULL,
      message    TEXT         NOT NULL,
      metadata   JSONB        DEFAULT '{}',
      is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_end_date   DATE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id                 INTEGER;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id               VARCHAR(100);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS source                  VARCHAR(50) DEFAULT 'manual';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_must_change    BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS package_id              INTEGER;

    CREATE TABLE IF NOT EXISTS dashboard_admins (
      id            SERIAL PRIMARY KEY,
      name          VARCHAR(255) NOT NULL,
      email         VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
      created_at    TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      last_login_at TIMESTAMP WITHOUT TIME ZONE
    );
  `);
  try {
    await db_default.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_package'
        ) THEN
          ALTER TABLE users
            ADD CONSTRAINT fk_users_package
            FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL;
        END IF;
      END $$;
      UPDATE users u SET package_id = p.id
      FROM packages p
      WHERE u.package_name = p.name AND u.package_id IS NULL;
    `);
  } catch (err) {
    console.warn("Package FK/migration warning:", err.message);
  }
  console.log("Schema verified.");
}
async function seedData() {
  try {
    const dashAdminHash = await import_bcrypt.default.hash("Admin@123456", 10);
    await db_default.query(
      `INSERT INTO dashboard_admins (name, email, password_hash, is_active)
       VALUES ('Bloom Admin', 'admin@bloomtech.com', $1, TRUE)
       ON CONFLICT (email) DO NOTHING`,
      [dashAdminHash]
    );
    console.log("Seed: dashboard admin admin@bloomtech.com upserted.");
    await db_default.query(`
      INSERT INTO packages (name, display_name, price, plan_type, price_monthly, description, max_users, features, is_active)
      VALUES (
        'Starter', 'Starter Plan', 29.99, 'monthly', 29.99,
        'A starter plan for small teams with essential audit tools.',
        5,
        '["Up to 5 sub users","Basic audit reporting","Email support","Monthly billing","Dashboard access"]'::jsonb,
        TRUE
      )
      ON CONFLICT (name) DO UPDATE
        SET display_name  = EXCLUDED.display_name,
            price_monthly = EXCLUDED.price_monthly
    `);
    const pkgRes = await db_default.query(`SELECT id FROM packages WHERE name='Starter'`);
    const starterId = pkgRes.rows[0]?.id ?? null;
    const hash = await import_bcrypt.default.hash("John@12345", 10);
    const ur = await db_default.query(
      `INSERT INTO users (name, email, password_hash, role, tenant_id, source, package_id, plan_type, account_status, purchase_date)
       VALUES ('John Smith', 'john@gmail.com', $1, 'customer', 'john-tenant', 'seed', $2, 'monthly', 'active', CURRENT_DATE)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             package_id    = EXCLUDED.package_id,
             plan_type     = EXCLUDED.plan_type,
             account_status = EXCLUDED.account_status
       RETURNING id`,
      [hash, starterId]
    );
    const johnId = ur.rows[0].id;
    console.log(`Seed: john@gmail.com upserted (id=${johnId}).`);
    const subCount = await db_default.query(
      `SELECT COUNT(*) FROM sub_users WHERE main_user_id=$1`,
      [johnId]
    );
    if (+subCount.rows[0].count === 0) {
      await db_default.query(
        `INSERT INTO sub_users (main_user_id, name, email, role, department, is_active)
         VALUES ($1, 'Alex Thompson', 'alex@johncompany.com', 'analyst', 'Finance', TRUE)`,
        [johnId]
      );
      console.log("Seed: sample sub-user Alex Thompson created.");
    }
  } catch (err) {
    console.error("Seed error:", err.message);
  }
}
http.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on 0.0.0.0:${PORT}`);
  initSchema().then(() => seedData()).then(() => {
    checkExpiryNotifications();
    setInterval(checkExpiryNotifications, 60 * 60 * 1e3);
  }).catch((err) => {
    console.error("Schema init failed:", err.message);
  });
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  io
});
