# Bloom-Tech-Dashboard — Railway Deployment Guide

## Overview

You already have **BloomERP Production** running on Railway with:
| Service | URL | Port |
|---|---|---|
| Postgres | (internal) | 5432 |
| Backend (Bloom_Audit_Website) | bloomit-production.up.railway.app | 5000 |
| Frontend (Bloom_Audit_Website) | adaptable-connection-prod… | — |

This guide adds **Bloom-Tech-Dashboard** as a **new service** inside the same Railway project,
connected to the **same Postgres database**.

---

## How the Two Projects Share the Database

| | Bloom_Audit_Website | Bloom-Tech-Dashboard |
|---|---|---|
| Password column | `password` | `password_hash` |
| Users table | creates it | reuses + extends it |
| Extra tables needed | none | `packages`, `sub_users`, `notifications` |
| Port | 5000 | 5001 |
| Role | Customer-facing website | Admin management dashboard |

**These two columns do NOT conflict.** Project 2's startup script runs
`ADD COLUMN IF NOT EXISTS password_hash` — it simply adds the column alongside
the existing `password` column. Project 1 keeps reading `password`, Project 2
reads `password_hash`. Each project ignores the other's column.

---

## Prerequisites

- [ ] Bloom-Tech-Dashboard pushed to a GitHub repository
- [ ] Access to Railway dashboard (railway.app)
- [ ] PostgreSQL `DATABASE_URL` copied from your existing Railway Postgres service

---

## Step 1 — Push Bloom-Tech-Dashboard to GitHub

If the dashboard is not yet on GitHub, push it now.

```bash
# Inside D:/GitHub/Bloom_Audit_website_new/Bloom-Tech-Dashboard
git init            # skip if already a git repo
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/bloom-tech-dashboard.git
git push -u origin main
```

> If it is already connected to a GitHub repo, just push any latest changes:
> `git push`

---

## Step 2 — Get DATABASE_URL from Railway

1. Open **railway.app** → select **BloomERP Production** project.
2. Click the **Postgres** service tile.
3. Go to **Variables** tab.
4. Copy the value of **`DATABASE_URL`** (looks like `postgresql://postgres:xxx@monorail.proxy.rlwy.net:PORT/railway`).

Keep this value — you will paste it in Step 4.

---

## Step 3 — Add a New Service for the Dashboard

1. Inside **BloomERP Production** project, click **+ Add** (top-right).
2. Choose **GitHub Repo**.
3. Select your `bloom-tech-dashboard` repository and the `main` branch.
4. Railway will detect `nixpacks.toml` automatically and start building.

> Railway uses `nixpacks.toml` which runs:
> - `npm install && npm run install-all` (installs root + client + server deps)
> - `npm run build` (compiles TypeScript + builds React)
> - `node server/dist/index.js` (starts the server)

---

## Step 4 — Set Environment Variables for the New Service

In Railway, click the new Dashboard service → **Variables** tab → add these:

```
DATABASE_URL       = <paste the value you copied in Step 2>
JWT_SECRET         = bloomaudit_super_secret_key
PORT               = 5001
NODE_ENV           = production
```

> `DATABASE_URL` makes `server/db.ts` use the Railway Postgres directly with SSL.
> You do **not** need individual `DB_USER` / `DB_HOST` / etc. when `DATABASE_URL` is set.

---

## Step 5 — Fix the CORS Origin in the Dashboard Backend

The dashboard backend currently allows all origins (`*`).
After deploying, you should restrict it to your Railway frontend domain.

Open `server/index.ts` line 19–21 and update:

```typescript
// Before
export const io = new SocketIOServer(http, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] },
});

// After — replace YOUR_DASHBOARD_FRONTEND_URL with the Railway URL for this service
export const io = new SocketIOServer(http, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});
```

Then add to Railway Variables:
```
CLIENT_ORIGIN = https://your-dashboard-frontend.up.railway.app
```

---

## Step 6 — Database Migration (Run Once)

When the Dashboard server starts for the first time it automatically runs
`initSchema()` which safely adds all required tables and columns using
`CREATE TABLE IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`.

**No manual SQL migration is needed** — the server handles it on startup.

Tables added to the shared database:
```
packages       — package definitions (monthly/yearly pricing)
sub_users      — sub-users per customer account
notifications  — real-time admin notifications
```

Columns added to the existing `users` table:
```
password_hash          TEXT
account_status         VARCHAR(50)  DEFAULT 'active'
subscription_end_date  DATE
role_id                INTEGER
tenant_id              VARCHAR(100)
source                 VARCHAR(50)  DEFAULT 'manual'
password_must_change   BOOLEAN      DEFAULT FALSE
package_id             INTEGER      (FK → packages)
```

None of these affect Project 1 since it never reads these columns.

---

## Step 7 — Create an Admin User for the Dashboard

The dashboard seed only creates a demo `customer` user (john@gmail.com).
You need at least one user with `role = 'admin'` to log in.

Connect to your Railway Postgres using the **Data** tab in Railway (or any
PostgreSQL client with the `DATABASE_URL`) and run:

```sql
-- Replace the values in <> with your own
INSERT INTO users (
  name, email, password_hash, role,
  account_status, source, plan_type
)
VALUES (
  'Admin',
  'admin@bloomaudit.com',
  -- bcrypt hash of your chosen password
  -- generate at: https://bcrypt-generator.com (rounds = 10)
  '$2b$10$REPLACE_WITH_YOUR_BCRYPT_HASH',
  'admin',
  'active',
  'manual',
  'monthly'
);
```

**To generate the bcrypt hash locally:**
```bash
cd D:/GitHub/Bloom_Audit_website_new/Bloom-Tech-Dashboard/server
npx tsx -e "import bcrypt from 'bcrypt'; bcrypt.hash('YourPassword123', 10).then(console.log)"
```

Paste the printed hash into the SQL above and run it on Railway.

---

## Step 8 — Deploy & Verify

1. Push any code changes to GitHub — Railway auto-deploys.
2. Watch the **Deployments** tab — build takes ~2–3 minutes.
3. Once green, open the service URL.
4. You should see: `BloomAudit Backend v3 (Socket.IO) running`
5. Navigate to `/health` — should return `{ "status": "OK" }`.

---

## Step 9 — Update the React Client API Base URL

The React client (`client/src/api/axios.ts`) has `baseURL: ''` which relies on
Vite's proxy in development. In production the frontend is **not served by Vite**
— the Express server serves the built React files via `express.static`.

Because `railway.json` starts the server with `node server/dist/index.js` and
`server/index.ts` serves `client/dist` when `NODE_ENV=production`, both frontend
and backend run on **the same Railway service URL and port**.

No base URL change is needed — API calls like `/api/admin/login` resolve
correctly against the same origin.

---

## Final Architecture on Railway

```
BloomERP Production (Railway Project)
│
├── Postgres ──────────────────────── shared database (bloomaudit / railway)
│     └── Tables: users, packages, sub_users, notifications,
│                 enterprise_inquiries, upgrade_requests, messages
│
├── Backend (Bloom_Audit_Website) ─── bloomit-production.up.railway.app
│     └── Port 5000 | JS | reads: users.password
│
├── Frontend (Bloom_Audit_Website) ── adaptable-connection-prod…
│     └── Static React build
│
└── Bloom-Tech-Dashboard ──────────── <new-service>.up.railway.app
      └── Port 5001 | TS | reads: users.password_hash
          Serves its own React build (client/dist) via Express static
```

---

## Environment Variable Summary

### Existing Backend (Bloom_Audit_Website) — no changes needed
```
PORT=5000
DB_USER=...
DB_HOST=...
DB_NAME=...
DB_PASSWORD=...
DB_PORT=5432
EMAIL_USER=...
EMAIL_PASS=...
```

### New Service (Bloom-Tech-Dashboard)
```
DATABASE_URL=postgresql://...   ← from Railway Postgres Variables tab
JWT_SECRET=bloomaudit_super_secret_key
PORT=5001
NODE_ENV=production
CLIENT_ORIGIN=https://your-dashboard-url.up.railway.app   ← optional, for CORS
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `relation "users" does not exist` | DB not connected | Check `DATABASE_URL` is set correctly |
| `column password_hash does not exist` | Schema not initialized | Restart the service to re-run `initSchema()` |
| Admin login returns 401 | No admin user in DB | Run the SQL in Step 7 |
| Build fails on Railway | TypeScript compile error | Run `npm run build` locally first to catch errors |
| `Cannot find module './db'` | Server built before `.env` loaded | Ensure `DATABASE_URL` is set as Railway env var, not in `.env` file |
| Socket.IO not connecting | CORS mismatch | Set `CLIENT_ORIGIN` env var to match your frontend URL |
