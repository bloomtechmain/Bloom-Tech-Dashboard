# BloomAudit — Full System Overview

> Last updated: 2026-06-09  
> This document covers all three projects that share the same Railway PostgreSQL database.

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Railway PostgreSQL                    │
│           (single shared database, public schema)        │
│                                                         │
│  public.users · public.packages · public.tenants        │
│  public.upgrade_requests · public.addons                │
│  public.tenant_addons · public.enterprise_inquiries     │
│  public.dashboard_admins · public.packages · …          │
│                                                         │
│  Per-tenant schemas: tenant_<name>  (ERP data)          │
└────────────┬──────────────┬──────────────┬──────────────┘
             │              │              │
    ┌────────┴──────┐ ┌─────┴──────┐ ┌────┴──────────────┐
    │  BloomAudit   │ │  Bloom     │ │  Admin Dashboard  │
    │  ERP (Bloomit)│ │  Website   │ │  (standalone)     │
    │  Port 3000    │ │  Port 5000 │ │  dashboard_admins │
    │  React+TS     │ │  React+JSX │ │  same DB          │
    └───────────────┘ └────────────┘ └───────────────────┘
```

**Key integration point:** When a user registers on the marketing website
(`source = 'marketing_site'`), the ERP backend detects this on the user's
first login and auto-provisions a private `tenant_<name>` schema for them.

---

## 2. Project 1 — BloomAudit ERP (`bloomtechmain/Bloomit`)

**Local path:** `/home/isuru-gunathilaka/Bloom-Audit/Bloomit`

### 2.1 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts, jsPDF |
| Backend | Node.js, Express, TypeScript, `ts-node` |
| Database | PostgreSQL (Railway) — multi-tenant schema per business |
| Auth | JWT access + refresh tokens; session stored in `active_sessions` |
| Email | Nodemailer (SMTP) |
| File upload | Multer (documents stored as `bytea` in DB) |
| PDF | PDFKit + jsPDF-autotable |
| Payments | Stripe (backend installed, used for Stripe Payment Links on invoices) |
| Validation | Zod |
| Testing | Vitest (frontend) + Jest + Supertest (backend) |
| CI | GitHub Actions — typecheck + test on every push/PR to `main` |
| Deployment | Railway (backend + frontend served separately) |

### 2.2 Repository & Versions

- **GitHub:** `bloomtechmain/Bloomit`
- **Frontend version:** `1.15.1`
- **Backend version:** `1.15.0`
- **Default dev ports:** backend `3000`, frontend `5173`

### 2.3 Directory Structure

```
Bloomit/
├── client/                   # React + TypeScript frontend (Vite)
│   └── src/
│       ├── pages/            # One file per module/page
│       ├── components/       # Shared UI components
│       ├── config/           # permissionHierarchy.ts, etc.
│       ├── test/             # Vitest component tests
│       └── App.tsx           # Routes + auth context
├── backend/
│   └── src/
│       ├── index.ts          # Express app entry — all routes registered here
│       ├── db.ts             # PostgreSQL pool (DATABASE_URL)
│       ├── routes/           # One file per module (43 route files)
│       ├── controllers/      # (inline in index.ts for main flows)
│       ├── middleware/       # auth, requirePlan, tenantSchema, dbClient
│       ├── services/         # tenant-service.ts (schema provisioning)
│       ├── jobs/             # Cron jobs
│       ├── scripts/          # DB migrations, seed scripts
│       ├── utils/            # JWT, email, logger, password utils
│       └── databasse.sql     # Source-of-truth schema (public + tenant sections)
├── docs/
│   ├── marketing/            # Website update prompts and brochures
│   └── features/             # Feature specs (per-module markdown guides)
└── CLAUDE.md                 # AI assistant rules for this project
```

### 2.4 Multi-tenancy Model

- Every business (tenant) gets its own **PostgreSQL schema** named `tenant_<slug>`.
- The `public` schema holds: auth, RBAC, packages, tenants, addons, sessions.
- `databasse.sql` is split at the marker `-- TENANT SCHEMA TEMPLATE`:
  - Before the marker → applied to `public` schema once.
  - After the marker → applied to each new tenant schema on provisioning.
- Tenant schema is provisioned on the user's **first login** to the ERP after registering on the website.

### 2.5 Request Middleware Chain

Every authenticated request goes through:

```
dbClientMiddleware           → acquires pg.PoolClient, sets on req.dbClient
requireAuth                  → verifies JWT, loads user + active session
tenantSchemaMiddleware        → SET search_path TO "tenant_x", public
requirePermission(res, act)  → checks req.user.permissions
```

> Always use `req.dbClient!` in controllers — never import `pool` directly
> in request handlers, as it bypasses `search_path`.

### 2.6 Authentication Flow

1. User logs in → backend validates credentials → issues **access token** (short-lived) + **refresh token** (long-lived, stored in `active_sessions`).
2. Access token carries: `userId`, `tenantId`, `roleIds`, `roleNames`, `permissions[]`, `planFeatures[]`, `addonFeatures[]`, `sessionToken`.
3. Frontend stores access token in memory; refresh token in `httpOnly` cookie or `localStorage`.
4. If token expires and user has been **active in the last 3 minutes**, auto-refresh silently. Otherwise show the session expiration warning popup.
5. Website users (`source = 'marketing_site'`) are flagged as `is_super_user: true` on login so they automatically get Super Admin role in their tenant.

### 2.7 Plan & Feature Gating

Plans map to feature keys. The `requirePlanFeature(key)` middleware blocks routes for users whose plan/addons don't include that key.

| Plan | Monthly | Yearly | Users | Feature Keys |
|---|---|---|---|---|
| Starter | $29 | $290 | 5 | Core accounting (`coa`, `gl`, `journal_entries`, `invoices`, `customers`, `receivables`, `bills`, `vendors`, `payables`, `tax`, `reports`, `documents`, `import_export`, `analytics`, `settings`, `notes_todos`) |
| Growth | $79 | $790 | 25 | Starter + `quotes`, `sales_orders`, `purchase_orders`, `petty_cash`, `subscriptions`, `bank_reconciliation`, `stripe_payments` |
| Business | $149 | $1,490 | 100 | Growth + `employees`, `payroll`, `pto`, `attendance`, `employee_onboarding`, `performance_reviews`, `employee_portal`, `expense_claims`, `time_tracking`, `inventory`, `projects`, `job_costing`, `assets`, `loans`, `currency`, `budgets` |
| Enterprise | $299 | $2,990 | Unlimited | Business + `advanced_analytics`, `custom_reports`, `audit_log`, `api_webhooks`, `vendor_portal`, `debit_cards`, `import_export_advanced` |

Add-ons can extend any plan with individual features at extra monthly cost (19 available add-ons). Add-on modules are stored in `public.tenant_addons` and merged into `addonFeatures[]` in the JWT at login.

### 2.8 Backend Route Map

| Prefix | Plan Feature Required | Module |
|---|---|---|
| `/coa` | — | Chart of Accounts |
| `/gl` | — | General Ledger |
| `/journal-entries` | — | Journal Entries |
| `/invoices` | — | Invoices |
| `/customers` | — | Customers |
| `/receivables` | — | Receivables |
| `/bills` | — | Bills |
| `/vendors` | — | Vendors |
| `/payables` | — | Payables |
| `/tax` | — | Tax |
| `/reports` | — | Financial Statements |
| `/documents` | — | Document Bank |
| `/import-export` | — | Bulk Import/Export |
| `/analytics` | — | Analytics Dashboard |
| `/notes`, `/todos` | — | Notes & Todos |
| `/settings`, `/api/settings` | — | Settings + RBAC |
| `/rbac` | — | Roles & Permissions |
| `/addons` | — | Add-on Store |
| `/quotes` | `quotes` | Quotes |
| `/sales-orders` | `sales_orders` | Sales Orders |
| `/purchase-orders` | `purchase_orders` | Purchase Orders |
| `/petty-cash` | `petty_cash` | Petty Cash |
| `/subscriptions` | `subscriptions` | Subscriptions |
| `/accounts` | `bank_reconciliation` | Bank Accounts |
| `/reconciliations` | `bank_reconciliation` | Bank Reconciliation |
| `/employees` | `employees` | Employee Directory |
| `/payroll` | `payroll` | Payroll |
| `/pto-requests` | `pto` | PTO / Time Off |
| `/attendance` | `attendance` | Attendance |
| `/api/employee-onboarding` | `employee_onboarding` | Onboarding |
| `/performance` | `performance_reviews` | Performance Reviews |
| `/api/employee-portal` | `employee_portal` | Employee Portal |
| `/expense-claims` | `expense_claims` | Expense Claims |
| `/time-entries` | `time_tracking` | Time Tracking |
| `/inventory` | `inventory` | Inventory |
| `/projects` | `projects` | Projects + Job Costing |
| `/assets` | `assets` | Asset Management |
| `/loans` | `loans` | Loans |
| `/currency` | `currency` | Multi-Currency |
| `/budgets` | `budgets` | Budgets |
| `/audit` | `audit_log` | Compliance Audit Log |
| `/webhooks` | `api_webhooks` | Webhooks |
| `/api/v1` | API key per-route | Public REST API v1 |
| `/vendor-portal` | vendor JWT / `vendor_portal` | Vendor Self-Service Portal |

**Special auth routes** (no `requireAuth`):
- `POST /login` — issues tokens
- `POST /refresh` — refresh access token
- `/vendor-portal/auth/*` — vendor login/invite (vendor JWT)
- `/api/employee-portal/auth/*` — employee sub-user login

### 2.9 RBAC (Role-Based Access Control)

- Permissions stored as `(resource, action)` rows in `public.permissions`.
- Roles defined in `public.roles`; linked via `public.role_permissions`.
- User roles in `public.user_roles`.
- On login the full permission set is embedded in the JWT as `permissions: string[]` (`"resource:action"` format).
- Super Admin role auto-gets all permissions via seed script.
- Frontend `PermissionHierarchy.tsx` component renders the full tree, filtered by the user's `planFeatures` so only in-plan modules are visible in Settings.

### 2.10 Cron Jobs

| Job | Schedule | Action |
|---|---|---|
| `reminderCron` | Configurable | Payment reminders, due date alerts |
| `overdueInvoiceCron` | Daily | Marks invoices as overdue |
| `attendanceCron` | Daily | Auto attendance / shift processing |
| `purgeTerminatedEmployees` | Daily | Purges terminated employee records after scheduled date |

### 2.11 Environment Variables (ERP Backend)

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Railway PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Access token signing key |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token signing key |
| `FRONTEND_URL` | ✅ | CORS allowed origin |
| `SMTP_HOST` | optional | Email (nodemailer) |
| `SMTP_PORT` | optional | |
| `SMTP_USER` | optional | |
| `SMTP_PASS` | optional | |
| `SMTP_FROM` | optional | |
| `SMTP_SECURE` | optional | |
| `ENCRYPTION_KEY` | optional | Data encryption |
| `ADMIN_EMAIL` | optional | Seeded Railway admin account |
| `APP_URL` | optional | Used in email links |
| `PORT` | optional | Defaults to `3000` |
| `NODE_ENV` | optional | `production` enables SSL, disables dev endpoints |
| `ENABLE_DEV_ENDPOINTS` | optional | Exposes debug routes (non-production only) |
| `TZ` | optional | Timezone for cron jobs |

---

## 3. Project 2 — Bloom Audit Marketing Website (`bloomtechmain/Bloom_Audit_Website`)

**Local path:** `/home/isuru-gunathilaka/Bloom-Website`

### 3.1 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (JSX), Vite, Tailwind CSS, Framer Motion, React Icons, React Router |
| Auth (social) | `@react-oauth/google` — Google OAuth login |
| Backend | Node.js, Express (JavaScript), Socket.IO |
| Database | Same Railway PostgreSQL (public schema only — no tenant schemas) |
| Email | Nodemailer |
| Real-time | Socket.IO (live chat widget) |
| Deployment | Railway (nixpacks) |

### 3.2 Repository & Version

- **GitHub:** `bloomtechmain/Bloom_Audit_Website`
- **Version:** `0.0.0` (frontend) / `1.0.0` (backend)
- **Default dev ports:** backend `5000`, frontend `5173`

### 3.3 Directory Structure

```
Bloom-Website/
├── frontend/
│   └── src/
│       ├── pages/            # Route-level pages
│       ├── Components/       # Shared UI components
│       ├── config/
│       │   └── pricingData.jsx  # Single source of truth for all plans + add-ons
│       └── api.js            # API_URL export
├── backend/
│   ├── controllers/          # authController, adminController, userController,
│   │                         # upgradeController, inquiryController
│   ├── models/               # userModel, upgradeRequestModel, inquiryModel, chatModel
│   ├── routes/               # authRoutes, adminRoutes, userRoutes,
│   │                         # upgradeRoutes, inquiryRoutes
│   ├── middleware/
│   │   └── authMiddleware.js # protect (user JWT), admin (role check)
│   ├── cron/
│   │   └── packageCron.js    # Daily: expiry warnings + mark expired
│   ├── utils/
│   │   └── emailService.js   # Nodemailer wrapper
│   ├── config/
│   │   └── db.js             # pg.Pool (same DATABASE_URL as ERP)
│   └── server.js             # Express entry point
└── Database file/            # Schema reference docs
```

### 3.4 Frontend Pages

| Route | Page | Purpose |
|---|---|---|
| `/` | `Home.jsx` | Landing page (Hero, features, pricing preview) |
| `/pricing` | `Pricing.jsx` | Full plan cards + add-ons section; upgrade modal for logged-in users |
| `/features` | `Features.jsx` | Feature comparison table (all 4 plans) |
| `/register` | `Register.jsx` | 3-step registration: details → plan selection → review & confirm |
| `/login` | `Login.jsx` | Email/password + Google OAuth |
| `/my-package` | `MyPackage.jsx` | Logged-in user's subscription; Change Plan → PayHere checkout |
| `/admin` | `AdminDashboard.jsx` | Admin panel: users, upgrade requests, stats |
| `/small-business/pricing` | `SmallPricing.jsx` | Compact pricing for small business landing |

### 3.5 Key Components

| Component | Purpose |
|---|---|
| `PayHereCheckout.jsx` | Checkout modal: billing toggle, order summary, PayHere-branded "Pay Now" button. Currently bypasses PayHere and calls `POST /api/user/activate-upgrade` directly. **TODO**: replace `handlePay` body with PayHere redirect when keys are configured. |
| `UpgradeConfirmationModal.jsx` | Simple confirm modal used on the `/pricing` page for upgrade requests |
| `AdminUpgradeRequests.jsx` | Admin table: view/approve/reject upgrade requests; Enterprise gets custom price modal |
| `EnterpriseInquiryModal.jsx` | Enterprise contact form → `POST /api/inquiries` → `public.enterprise_inquiries` |

### 3.6 Backend API Routes

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | public | Create user + look up package_id → insert `public.users` |
| `POST` | `/api/auth/login` | public | Return JWT + user object |
| `POST` | `/api/auth/google-login` | public | Google OAuth login/register |
| `GET` | `/api/auth/me` | user | Return current user from DB |
| `POST` | `/api/user/activate-upgrade` | user | **Activate upgrade immediately**: update `package_id`, `package_status=confirmed`, `purchase_date`, `subscription_end_date`; write approved `upgrade_requests` row for audit |
| `POST` | `/api/user/update-package` | user | Legacy: update package to pending status (kept for backward compat) |
| `POST` | `/api/upgrades/request` | public | Create pending upgrade request (used by `/pricing` page for logged-in users) |
| `GET` | `/api/upgrades` | public | Fetch all upgrade requests (admin view) |
| `PUT` | `/api/upgrades/:id/status` | public | Update request status (approve/reject) |
| `GET` | `/api/admin/users` | admin | List all non-admin users |
| `POST` | `/api/admin/confirm-package` | admin | Manually confirm a user's package |
| `PUT` | `/api/admin/users/:id` | admin | Update user details |
| `DELETE` | `/api/admin/users/:id` | admin | Delete user |
| `POST` | `/api/admin/update-package` | admin | Admin-side package update (used by `AdminUpgradeRequests` on approval) |
| `GET` | `/api/admin/stats` | admin | Dashboard stats: pending users + pending upgrades |
| `POST` | `/api/inquiries` | public | Submit enterprise inquiry |

### 3.7 User Registration Flow

```
/register (step 1)         /register (step 2)        /register (step 3)
Name, Email, Password  →   Plan selection         →   Review & Confirm
Company, CompanyType        Billing: Monthly/Yearly    POST /api/auth/register
                                                       → inserts public.users
                                                         (source='marketing_site',
                                                          package_status='active')
                                                       → ERP provisions tenant
                                                         on first ERP login
```

### 3.8 Package Upgrade Flow (current)

```
/my-package
  ↓ "Change Plan"
  ↓ Plan selector (inline edit mode)
  ↓ "Switch to X"
  ↓ PayHereCheckout modal
      - Billing cycle toggle (monthly / yearly)
      - Order summary with total
      - "Pay Now" button
        [BYPASS — direct to backend]
        POST /api/user/activate-upgrade
          → package_status = 'confirmed'
          → subscription_end_date = today + 30/365 days
          → upgrade_requests row inserted (status='approved', for audit)
        ↓
      - Success screen with renewal date
      ↓
  Page reflects new plan immediately (localStorage + state updated)
```

**PayHere integration TODO** (in `PayHereCheckout.jsx → handlePay`):
1. `POST /api/payments/create-order` → get `{ orderId, hash, merchantId }`
2. Submit HTML form to `https://www.payhere.lk/pay/checkout`
3. PayHere calls `POST /api/payments/notify` on success
4. Notify endpoint calls `activateUpgrade` logic

### 3.9 Cron Jobs (Website Backend)

| Schedule | Action |
|---|---|
| Daily midnight | Check users expiring within 3 days → send renewal email |
| Daily midnight | Mark `package_status = 'expired'` for past `subscription_end_date` users |

### 3.10 Environment Variables (Website Backend)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Same Railway PostgreSQL as ERP |
| `JWT_SECRET` | User token signing |
| `FRONTEND_URL` | CORS allowed origin |
| `PORT` | Defaults to `5000` |
| `SMTP_*` | Email config (same pattern as ERP) |
| `GOOGLE_CLIENT_ID` | Google OAuth |

---

## 4. Project 3 — Admin Dashboard (Standalone)

> Connected to the same Railway PostgreSQL database.  
> Uses the `public.dashboard_admins` table for its own admin accounts
> (separate from the website's `role='admin'` users).

### 4.1 Database Table

```sql
CREATE TABLE public.dashboard_admins (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);
```

Admin accounts are seeded via `backend/src/scripts/createDashboardAdminTable.ts` in the ERP project.

### 4.2 Integration Points

- Reads from the same `public` schema tables as the other projects.
- Can view/manage: `public.users`, `public.upgrade_requests`, `public.packages`, `public.enterprise_inquiries`, `public.tenants`.
- Auth is separate — uses `dashboard_admins` table, not `users`.

---

## 5. Shared Database (Railway PostgreSQL)

All three projects connect to the **same** Railway PostgreSQL instance using `DATABASE_URL`.

### 5.1 Public Schema Tables (shared)

| Table | Owner | Purpose |
|---|---|---|
| `users` | All | Central user accounts; `source='marketing_site'` for website registrations |
| `packages` | All | Plan catalog: Starter / Growth / Business / Enterprise |
| `addons` | ERP | Add-on feature catalog |
| `tenant_addons` | ERP | Per-user active add-ons |
| `tenants` | ERP | Maps user → schema_name |
| `upgrade_requests` | Website+ERP | Plan upgrade history (pending/approved/rejected) |
| `enterprise_inquiries` | Website | Enterprise contact form submissions |
| `dashboard_admins` | Admin dashboard | Separate admin user accounts |
| `active_sessions` | ERP | JWT session tracking |
| `roles` / `permissions` / `role_permissions` / `user_roles` | ERP | RBAC |
| `notifications` | ERP | In-app notifications |
| `messages` | Website | Live chat messages (Socket.IO) |
| `announcements` | ERP | Company-wide announcements |
| `api_keys` | ERP | REST API v1 key management |
| `password_history` | ERP | Prevent password reuse |
| `rbac_audit_log` | ERP | Permission change audit trail |
| `payslip_*` | ERP | Payslip signing and storage |
| `employee_audit_log` | ERP | Employee action audit trail |
| `currencies` | ERP | Multi-currency FX rates |

### 5.2 Tenant Schema Tables

Each business gets a private schema `tenant_<slug>` containing all business data tables:

`chart_of_accounts`, `gl_entries`, `journal_entries`, `invoices`, `invoice_items`, `customers`, `bills`, `bill_items`, `vendors`, `payments`, `tax_rates`, `documents`, `bank_accounts` (company_bank_accounts), `bank_transactions`, `reconciliations`, `notes`, `todos`, `quotes`, `sales_orders`, `purchase_orders`, `petty_cash`, `subscriptions`, `employees`, `payroll`, `pto_requests`, `attendance`, `performance_reviews`, `expense_claims`, `time_entries`, `inventory`, `projects`, `contracts`, `assets`, `loans`, `budgets`, `debit_cards`, `audit_log`, `webhook_subscriptions`, and more.

### 5.3 Cross-Project Writes

| Action | Writer | What it writes |
|---|---|---|
| User registers on website | Website backend | `public.users` (source='marketing_site') |
| User activates upgrade on website | Website backend | `public.users` (package fields); `public.upgrade_requests` (status='approved') |
| Admin approves upgrade on website | Website backend | `public.users` (via `/api/admin/update-package`) |
| First ERP login | ERP backend | `public.tenants`; creates `tenant_<name>` schema |
| Add-on purchase | ERP backend | `public.tenant_addons` |
| Enterprise inquiry | Website backend | `public.enterprise_inquiries` |

---

## 6. Package Plans Reference

| Plan | Monthly | Yearly | Users | Key additions over previous tier |
|---|---|---|---|---|
| **Starter** | $29 | $290 | 5 | Full core accounting (invoices, bills, GL, reports, tax, documents) |
| **Growth** | $79 | $790 | 25 | Quotes, Sales/Purchase Orders, Petty Cash, Bank Reconciliation, Stripe |
| **Business** | $149 | $1,490 | 100 | HR & Payroll, Inventory, Projects, Assets, Loans, Multi-Currency, Budgets |
| **Enterprise** | $299 | $2,990 | Unlimited | Advanced Analytics, API, Audit Log, Vendor Portal, Debit Cards |

19 individual add-ons are available for any plan (from $10/mo). See `pricingData.jsx` for the full list.

---

## 7. Development Commands

### BloomAudit ERP

```bash
# Backend (from Bloomit/backend/)
npm run dev          # ts-node dev server on port 3000
npm test             # Jest integration tests (bloomtech_test DB)
npm run typecheck    # tsc --noEmit
npm run build        # Compile to dist/
npm run seed:admin   # Create local admin@example.com / admin123

# Frontend (from Bloomit/client/)
npm run dev          # Vite dev server on port 5173
npm test             # Vitest run (all tests once)
npm run build        # Production build

# Run a single test file
# Backend:  cross-env NODE_ENV=test dotenv -e .env.test npx jest src/tests/routes/invoices.test.ts
# Frontend: npx vitest run src/test/Bills.test.tsx
```

### Bloom Audit Website

```bash
# Backend (from Bloom-Website/backend/)
node server.js       # Start server on port 5000

# Frontend (from Bloom-Website/frontend/)
npm run dev          # Vite dev server on port 5173
npm run build        # Production build
```

---

## 8. Git Workflow

### BloomAudit ERP (`bloomtechmain/Bloomit`)

- Work on feature branches (e.g. `feat/module-name`, `fix/issue-description`)
- Push branch only — open PR on GitHub
- CI must pass (Backend — Typecheck & Tests + Frontend — Typecheck) before merge
- After feature PR merges, `release-please` auto-opens a release PR
- Merge release PR to bump version + update `CHANGELOG.md`
- Commit prefix convention: `feat:` (minor), `fix:` (patch), `feat!:` (major)

### Bloom Audit Website (`bloomtechmain/Bloom_Audit_Website`)

- Direct pushes to `main` (no CI configured)
- Deployed automatically to Railway on push to `main`

### Rules (from CLAUDE.md)

- Never commit `.env`, `node_modules/`, `dist/`
- Never use `gh pr create` / `gh pr merge` — user handles PRs on GitHub
- Never include `Co-Authored-By` referencing Claude/Anthropic
- Always run `npx tsc --noEmit` and `npm test` before pushing ERP changes

---

## 9. Deployment (Railway)

| Service | Repo / Branch | Start Command |
|---|---|---|
| ERP Backend | `bloomtechmain/Bloomit` — `main` | `npm run build && node dist/index.js` |
| ERP Frontend | `bloomtechmain/Bloomit` — `main` | `npm run build` (static) |
| Website Backend | `bloomtechmain/Bloom_Audit_Website` — `main` | `node server.js` (nixpacks) |
| Website Frontend | `bloomtechmain/Bloom_Audit_Website` — `main` | `npm run build` (static) |
| PostgreSQL | Railway managed | — |

All services share the same Railway PostgreSQL instance via the `DATABASE_URL` environment variable.

---

## 10. Key Files Quick Reference

| File | Project | Purpose |
|---|---|---|
| `backend/src/databasse.sql` | ERP | Source-of-truth DB schema (public + tenant sections) |
| `backend/src/index.ts` | ERP | All Express routes registered here |
| `backend/src/services/tenant-service.ts` | ERP | Tenant provisioning logic |
| `backend/src/middleware/requirePlan.ts` | ERP | Plan feature gating |
| `client/src/pages/Dashboard.tsx` | ERP | Main shell — all ERP pages render here via tab/subtab state |
| `client/src/config/permissionHierarchy.ts` | ERP | Full permission tree for Settings UI |
| `client/src/App.tsx` | ERP | Routes + idle-detection session management |
| `frontend/src/config/pricingData.jsx` | Website | Single source of truth for all plans + add-ons |
| `frontend/src/Components/PayHereCheckout.jsx` | Website | Checkout UI (PayHere bypass — see TODO comment inside `handlePay`) |
| `backend/models/userModel.js` | Website | All user DB operations including `activateUpgrade` |
| `backend/cron/packageCron.js` | Website | Subscription expiry notifications + status updates |
| `CLAUDE.md` | ERP | AI assistant rules (plan first, no co-author, no gh CLI) |
