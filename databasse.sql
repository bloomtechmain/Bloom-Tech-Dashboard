-- ============================================================
-- PUBLIC SCHEMA: shared system/auth/RBAC tables (29 tables)
-- Business tables live in tenant schemas only
-- ============================================================

CREATE TABLE IF NOT EXISTS active_sessions (id SERIAL, user_id integer NOT NULL, session_token uuid NOT NULL DEFAULT gen_random_uuid(), expires_at timestamp without time zone NOT NULL, last_activity_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, ip_address character varying(100), user_agent text, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS active_timers (id SERIAL, employee_id integer NOT NULL, time_entry_id integer NOT NULL, started_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP, is_on_break boolean DEFAULT false, total_break_time_minutes integer DEFAULT 0, last_break_start timestamp without time zone);
CREATE TABLE IF NOT EXISTS announcements (id SERIAL, title character varying(255) NOT NULL, content text NOT NULL, author_id integer, priority character varying(20) DEFAULT 'normal'::character varying, category character varying(50), start_date timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP, end_date timestamp without time zone, target_audience jsonb DEFAULT '{"type": "all"}'::jsonb, is_active boolean DEFAULT true, views_count integer DEFAULT 0, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS application_settings (id SERIAL, setting_key character varying(100) NOT NULL, setting_value text, description text, updated_by integer, updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS dashboard_admins (id SERIAL, name character varying(255) NOT NULL, email character varying(255) NOT NULL, password_hash character varying(255) NOT NULL, is_active boolean NOT NULL DEFAULT true, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, last_login_at timestamp without time zone);
CREATE TABLE IF NOT EXISTS email_log (id SERIAL, employee_id integer, email_type character varying(50) NOT NULL, recipient_email character varying(255) NOT NULL, subject character varying(255), sent_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, delivery_status character varying(20) DEFAULT 'sent'::character varying, error_message text, metadata jsonb);
CREATE TABLE IF NOT EXISTS employee_audit_log (id SERIAL, employee_id integer, action character varying(100) NOT NULL, resource_type character varying(50), resource_id integer, old_value jsonb, new_value jsonb, ip_address character varying(45), user_agent text, session_id character varying(255), status character varying(20) DEFAULT 'success'::character varying, error_message text, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS employee_documents (document_id SERIAL, employee_id integer NOT NULL, document_type character varying(50) NOT NULL, document_category character varying(50), file_name character varying(255) NOT NULL, original_name character varying(255) NOT NULL, file_path character varying(500) NOT NULL, file_size integer NOT NULL, mime_type character varying(100) NOT NULL, description text, uploaded_by integer, uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, expires_at timestamp without time zone);
CREATE TABLE IF NOT EXISTS employee_notifications (notification_id SERIAL, employee_id integer NOT NULL, notification_type character varying(50) NOT NULL, title character varying(255) NOT NULL, message text, link character varying(500), priority character varying(20) DEFAULT 'normal'::character varying, is_read boolean DEFAULT false, is_archived boolean DEFAULT false, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, read_at timestamp without time zone, expires_at timestamp without time zone);
CREATE TABLE IF NOT EXISTS employee_portal_settings (id SERIAL, employee_id integer NOT NULL, theme character varying(20) DEFAULT 'light'::character varying, dashboard_layout jsonb DEFAULT '{"widgets": ["stats", "notes", "calendar", "announcements"]}'::jsonb, email_notifications boolean DEFAULT true, push_notifications boolean DEFAULT false, language character varying(10) DEFAULT 'en'::character varying, timezone character varying(50) DEFAULT 'UTC'::character varying, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, email_preferences jsonb DEFAULT '{"pto_notifications": true, "time_entry_reminders": true, "announcement_notifications": true}'::jsonb, show_in_directory boolean DEFAULT true, hide_phone_in_directory boolean DEFAULT false);
CREATE TABLE IF NOT EXISTS enterprise_inquiries (id SERIAL, name character varying(100) NOT NULL, email character varying(100) NOT NULL, phone character varying(50) NOT NULL, company_name character varying(100) NOT NULL, requirements text NOT NULL, status character varying(20) DEFAULT 'pending'::character varying, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS messages (id SERIAL, user_id integer, user_name character varying(255) NOT NULL, message text NOT NULL, channel character varying(50) DEFAULT 'general'::character varying, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS notifications (id SERIAL, type character varying(60) NOT NULL, user_id integer, title character varying(255) NOT NULL, message text NOT NULL, metadata jsonb DEFAULT '{}'::jsonb, is_read boolean NOT NULL DEFAULT false, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS packages (id SERIAL, name character varying(50) NOT NULL, display_name character varying(100) NOT NULL, price_monthly numeric(10,2) DEFAULT 0, price_yearly numeric(10,2) DEFAULT 0, features jsonb NOT NULL DEFAULT '{}'::jsonb, is_active boolean DEFAULT true, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, max_users integer, description text);
CREATE TABLE IF NOT EXISTS password_history (id SERIAL, user_id integer NOT NULL, password_hash text NOT NULL, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS payslip_documents (document_id SERIAL, payslip_id integer NOT NULL, file_path character varying(500) NOT NULL, file_name character varying(255) NOT NULL, file_type character varying(10) DEFAULT 'PDF'::character varying, file_size bigint, generated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS payslip_signature_tokens (id SERIAL, payslip_id integer NOT NULL, employee_id integer NOT NULL, token character varying(255) NOT NULL, expires_at timestamp without time zone NOT NULL, used_at timestamp without time zone, is_used boolean DEFAULT false, ip_address character varying(45), user_agent text, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS payslip_signatures (signature_id SERIAL, payslip_id integer NOT NULL, signer_user_id integer NOT NULL, signer_role character varying(50) NOT NULL, signature_hash character varying(255) NOT NULL, signed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, ip_address character varying(45));
CREATE TABLE IF NOT EXISTS payslips (payslip_id SERIAL, employee_id integer NOT NULL, payslip_month integer NOT NULL, payslip_year integer NOT NULL, basic_salary numeric(15,2) NOT NULL, allowances jsonb DEFAULT '{}'::jsonb, gross_salary numeric(15,2) NOT NULL, epf_employee_deduction numeric(15,2) DEFAULT 0, epf_employee_rate numeric(5,2) DEFAULT 8.00, other_deductions jsonb DEFAULT '{}'::jsonb, total_deductions numeric(15,2) DEFAULT 0, epf_employer_contribution numeric(15,2) DEFAULT 0, etf_employer_contribution numeric(15,2) DEFAULT 0, net_salary numeric(15,2) NOT NULL, status character varying(50) DEFAULT 'DRAFT'::character varying, rejection_reason text, created_by_user_id integer NOT NULL, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS permissions (id SERIAL, resource character varying(50) NOT NULL, action character varying(20) NOT NULL, description text, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS project_items (project_id integer NOT NULL, requirements text NOT NULL, service_category text NOT NULL, unit_cost numeric NOT NULL, requirement_type text NOT NULL);
CREATE TABLE IF NOT EXISTS rbac_audit_log (id SERIAL, user_id integer, action character varying(100) NOT NULL, details jsonb, ip_address character varying(50), created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS role_permissions (role_id integer NOT NULL, permission_id integer NOT NULL, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS roles (id SERIAL, name character varying(50) NOT NULL, description text, is_system_role boolean DEFAULT false, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sub_users (id SERIAL, main_user_id integer NOT NULL, name character varying(255) NOT NULL, email character varying(255), role character varying(100) DEFAULT 'user'::character varying, department character varying(100), is_active boolean NOT NULL DEFAULT true, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS tenants (id SERIAL, name character varying(100) NOT NULL, schema_name character varying(100) NOT NULL, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS upgrade_requests (id SERIAL, user_id integer, user_name character varying(100) NOT NULL, user_email character varying(100) NOT NULL, current_plan character varying(50), requested_plan character varying(50) NOT NULL, requirements text, status character varying(20) DEFAULT 'pending'::character varying, request_type character varying(20) DEFAULT 'plan_upgrade', addon_name character varying(50), created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS addons (id SERIAL PRIMARY KEY, name VARCHAR(50) NOT NULL UNIQUE, display_name VARCHAR(100) NOT NULL, description TEXT, price_monthly NUMERIC(10,2) NOT NULL, price_yearly NUMERIC(10,2), modules JSONB NOT NULL DEFAULT '[]', required_plan VARCHAR(50) DEFAULT 'starter', required_addons JSONB DEFAULT '[]', is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS tenant_addons (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, addon_id INTEGER NOT NULL REFERENCES addons(id), status VARCHAR(20) DEFAULT 'active', purchase_date DATE NOT NULL DEFAULT CURRENT_DATE, expiry_date DATE, price_paid NUMERIC(10,2), UNIQUE(user_id, addon_id));
CREATE TABLE IF NOT EXISTS user_roles (user_id integer NOT NULL, role_id integer NOT NULL, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS users (id SERIAL, name text NOT NULL, email text NOT NULL, password_hash text NOT NULL, role text DEFAULT 'user'::text, role_id integer, tenant_id integer, source character varying(50) DEFAULT NULL::character varying, password_must_change boolean DEFAULT false, account_status character varying(20) DEFAULT 'active'::character varying, created_at timestamp without time zone DEFAULT now(), package_id integer, package_status character varying(50) DEFAULT 'active'::character varying, no_of_users integer DEFAULT 1, status_changed_at timestamp without time zone, status_changed_by integer, status_reason text, subscription_end_date date, plan_type character varying(50), purchase_date date, company_type character varying(50));

-- ── Feature 13: Multi-Currency — global currency lookup (public schema) ────────
CREATE TABLE IF NOT EXISTS currencies (
  code           VARCHAR(3) PRIMARY KEY,
  name           VARCHAR(50) NOT NULL,
  symbol         VARCHAR(5)  NOT NULL,
  decimal_places INT DEFAULT 2,
  is_active      BOOLEAN DEFAULT TRUE
);
INSERT INTO currencies (code, name, symbol) VALUES
  ('LKR', 'Sri Lankan Rupee',  'Rs'),
  ('USD', 'US Dollar',         '$'),
  ('EUR', 'Euro',              '€'),
  ('GBP', 'British Pound',     '£'),
  ('AUD', 'Australian Dollar', 'A$'),
  ('SGD', 'Singapore Dollar',  'S$'),
  ('INR', 'Indian Rupee',      '₹'),
  ('JPY', 'Japanese Yen',      '¥'),
  ('CNY', 'Chinese Yuan',      '¥')
ON CONFLICT (code) DO NOTHING;

-- Public API keys table (cross-tenant lookup by apiKeyAuth middleware)
CREATE TABLE IF NOT EXISTS public.api_keys (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL,
  name         VARCHAR(100) NOT NULL,
  key_hash     TEXT NOT NULL UNIQUE,
  scopes       TEXT[] NOT NULL DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ,
  created_by   INTEGER,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_apikey_tenant ON public.api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_apikey_hash   ON public.api_keys(key_hash);

-- ============================================================
-- TENANT SCHEMA TEMPLATE: business tables (34 tables)
-- Applied per-tenant with: SET search_path TO tenant_<name>
-- ============================================================

CREATE TABLE IF NOT EXISTS assets (id SERIAL, asset_name text NOT NULL, value numeric NOT NULL, purchase_date date NOT NULL, depreciation_method text, salvage_value numeric, useful_life integer, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS bank_transactions (id SERIAL, bank_account_id integer NOT NULL, transaction_type character varying(10), amount numeric(15,2) NOT NULL, description text, transaction_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS banks (id SERIAL, bank_name character varying(100) NOT NULL, branch character varying(100), created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS chart_of_accounts (id SERIAL, code character varying(10) NOT NULL, name character varying(150) NOT NULL, account_type character varying(20) NOT NULL, sub_type character varying(50), parent_id integer, is_system boolean DEFAULT false, is_active boolean DEFAULT true, description text, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS company_bank_accounts (id SERIAL, bank_id integer NOT NULL, account_number character varying(50) NOT NULL, account_name character varying(100), opening_balance numeric(15,2) NOT NULL, current_balance numeric(15,2) NOT NULL, is_active boolean DEFAULT true, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS contract_items (contract_id integer NOT NULL, requirements text NOT NULL, service_category text NOT NULL, unit_cost numeric NOT NULL, requirement_type text NOT NULL);
CREATE TABLE IF NOT EXISTS contracts (contract_id SERIAL, project_id integer NOT NULL, contract_name character varying(200) NOT NULL, customer_name character varying(200), description text, initial_cost_budget numeric(12,2) DEFAULT 0, extra_budget_allocation numeric(12,2) DEFAULT 0, payment_type character varying(50), status character varying(50) DEFAULT 'pending'::character varying, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS debit_card (id SERIAL, bank_account_id integer NOT NULL, card_number_last4 character varying(4) NOT NULL, card_holder_name character varying(100) NOT NULL, expiry_date date NOT NULL, is_active boolean NOT NULL DEFAULT true, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS debit_cards (id SERIAL, bank_account_id integer NOT NULL, card_number_last4 character varying(4) NOT NULL, card_holder_name character varying(100) NOT NULL, expiry_date date NOT NULL, is_active boolean NOT NULL DEFAULT true, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS documents (id SERIAL, document_name character varying(255) NOT NULL, original_filename character varying(255) NOT NULL, file_type character varying(100) NOT NULL, file_size integer NOT NULL, file_data bytea NOT NULL, uploaded_by integer NOT NULL, upload_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP, description text, tenant_id integer);
CREATE TABLE IF NOT EXISTS employees (id SERIAL, employee_number character varying(50), first_name character varying(100) NOT NULL, last_name character varying(100) NOT NULL, email character varying(150), phone character varying(30), dob date, nic character varying(50), address text, role character varying(100), designation character varying(150), employee_department character varying(100), tax character varying(100), hire_date date, manager_id integer, user_id integer, tenant_id integer, is_active boolean DEFAULT true, base_salary numeric(12,2) DEFAULT 0, allowances jsonb DEFAULT '{}'::jsonb, epf_enabled boolean DEFAULT true, epf_contribution_rate numeric(5,2) DEFAULT 8.00, etf_enabled boolean DEFAULT true, pto_allowance integer DEFAULT 20, bank_name character varying(100), bank_account_number character varying(50), bank_branch character varying(100), emergency_contact_name character varying(100), emergency_contact_relationship character varying(50), emergency_contact_phone character varying(20), suspended_at timestamp without time zone, suspended_by integer, suspended_reason text, terminated_at timestamp without time zone, terminated_by integer, terminated_reason text, scheduled_purge_date date, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS gl_entries (id SERIAL, entry_date date NOT NULL, reference character varying(50), description text NOT NULL, account_id integer NOT NULL, debit numeric(15,2) DEFAULT 0, credit numeric(15,2) DEFAULT 0, journal_id integer, source_module character varying(30), source_id integer, posted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, posted_by integer);
CREATE TABLE IF NOT EXISTS loan_installments (id SERIAL, loan_id integer NOT NULL, installment_number integer NOT NULL, due_date date NOT NULL, scheduled_amount numeric(15,2) NOT NULL, payment_date date, amount_paid numeric(15,2), paid_bank character varying(150), payment_description text, status character varying(20) NOT NULL DEFAULT 'PENDING'::character varying, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS loans (id SERIAL, loan_account_number character varying(100) NOT NULL, borrower_name character varying(200) NOT NULL, bank_name character varying(150) NOT NULL, loan_amount numeric(15,2) NOT NULL, total_installments integer NOT NULL, monthly_installment_amount numeric(15,2) NOT NULL, interest_rate numeric(5,2), loan_type character varying(50) NOT NULL DEFAULT 'BUSINESS'::character varying, start_date date NOT NULL, calculated_end_date date NOT NULL, status character varying(20) NOT NULL DEFAULT 'ACTIVE'::character varying, notes text, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS note_shares (id SERIAL, note_id integer NOT NULL, shared_with_user_id integer NOT NULL, permission character varying(10) DEFAULT 'read'::character varying, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS notes (id SERIAL, user_id integer NOT NULL, title character varying(200) NOT NULL, content text, color character varying(20) DEFAULT '#ffffff'::character varying, is_pinned boolean DEFAULT false, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS payables (payable_id SERIAL, vendor_id integer NOT NULL, payable_name character varying(150) NOT NULL, description text, payable_type character varying(20), amount numeric(12,2) NOT NULL, frequency character varying(20), start_date date, end_date date, contract_id integer, bank_account_id integer, payment_method character varying(50), reference_number character varying(100), is_active boolean DEFAULT true, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS payment_payables (payment_id SERIAL, payable_id integer, payment_method character varying(50), bank_account_id integer, payment_date date DEFAULT CURRENT_DATE, amount numeric(12,2) NOT NULL, reference_number character varying(100), status character varying(50) DEFAULT 'Pending'::character varying, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS petty_cash_account (id SERIAL, account_name character varying(100) DEFAULT 'Petty Cash'::character varying, current_balance numeric(15,2) DEFAULT 0.00, monthly_float_amount numeric(15,2) DEFAULT 0.00, last_replenished_date date, updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS petty_cash_transactions (id SERIAL, petty_cash_account_id integer, transaction_type character varying(50) NOT NULL, amount numeric(15,2) NOT NULL, description text, project_id integer, source_bank_account_id integer, payable_id integer, transaction_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS projects (project_id SERIAL, project_name character varying(200) NOT NULL, project_description text, status character varying(50) DEFAULT 'active'::character varying, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS pto_requests (id SERIAL, employee_id integer NOT NULL, manager_id integer, absence_type character varying(50) NOT NULL, from_date date NOT NULL, to_date date NOT NULL, total_hours numeric(6,2) NOT NULL, project_id integer, cover_person_id integer, cover_person_name character varying(200), description text, status character varying(20) DEFAULT 'pending'::character varying, manager_comments text, approved_at timestamp without time zone, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS purchase_order_items (id SERIAL, purchase_order_id integer, quantity integer NOT NULL, description text NOT NULL, unit_price numeric(12,2) NOT NULL, total numeric(12,2) NOT NULL, line_order integer DEFAULT 0, project_id integer, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS purchase_orders (id SERIAL, po_number character varying(50) NOT NULL, requested_by_user_id integer, requested_by_name character varying(255), requested_by_title character varying(255), vendor_id integer, vendor_invoice_number character varying(100), project_id integer, subtotal numeric(12,2) DEFAULT 0, sales_tax numeric(12,2) DEFAULT 0, shipping_handling numeric(12,2) DEFAULT 0, banking_fee numeric(12,2) DEFAULT 0, total_amount numeric(12,2) NOT NULL, payment_method character varying(50), check_number character varying(100), payment_amount numeric(12,2), payment_date date, status character varying(50) DEFAULT 'PENDING'::character varying, approved_by_user_id integer, approved_by_name character varying(255), approved_by_title character varying(255), approved_at timestamp without time zone, rejection_reason text, receipt_document_url text, receipt_uploaded_at timestamp without time zone, notes text, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS quote_additional_services (service_id SERIAL, quote_id integer, service_name character varying(200) NOT NULL, price numeric(12,2) NOT NULL);
CREATE TABLE IF NOT EXISTS quote_items (item_id SERIAL, quote_id integer, description character varying(200) NOT NULL, quantity integer NOT NULL DEFAULT 1, unit_price numeric(12,2) NOT NULL, total numeric(12,2) NOT NULL);
CREATE TABLE IF NOT EXISTS quote_reminder_settings (setting_id SERIAL, days_after_sent integer NOT NULL DEFAULT 3, days_after_follow_up integer NOT NULL DEFAULT 7, enable_email_notifications boolean DEFAULT true, enable_dashboard_notifications boolean DEFAULT true, updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS quote_reminders (reminder_id SERIAL, quote_id integer NOT NULL, reminder_date date NOT NULL, reminder_type character varying(20) DEFAULT 'MANUAL'::character varying, reminder_status character varying(20) DEFAULT 'PENDING'::character varying, created_by integer, assigned_to integer, notes text, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS quote_status_history (history_id SERIAL, quote_id integer, old_status character varying(20), new_status character varying(20), changed_by integer, notes text, changed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS quotes (quote_id SERIAL, quote_number character varying(20) NOT NULL, template_type character varying(20), company_name character varying(200) NOT NULL, company_address text, date_of_issue date NOT NULL, subtotal numeric(12,2) NOT NULL, total_due numeric(12,2) NOT NULL, notes text, status character varying(20) DEFAULT 'DRAFT'::character varying, assigned_to integer, created_by integer, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS receivables (receivable_id SERIAL, payer_name character varying(150) NOT NULL, receivable_name character varying(150) NOT NULL, description text, receivable_type character varying(50), amount numeric(12,2) NOT NULL, frequency character varying(50), start_date date, end_date date, contract_id integer, is_active boolean DEFAULT true, bank_account_id integer, payment_method character varying(50), reference_number character varying(100), created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS subscriptions (id SERIAL, description character varying(200) NOT NULL, amount numeric(12,2) NOT NULL, due_date date NOT NULL, frequency character varying(20), auto_pay boolean DEFAULT false, is_active boolean DEFAULT true, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS time_entries (id SERIAL, employee_id integer, project_id integer, contract_id integer, date date NOT NULL, clock_in timestamp without time zone, clock_out timestamp without time zone, total_hours numeric(5,2), break_time_minutes integer DEFAULT 0, description text, is_timer_based boolean DEFAULT false, status character varying(20) DEFAULT 'pending'::character varying, approved_by integer, approved_at timestamp without time zone, rejection_note text, cost_rate numeric(10,2), created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS todo_shares (id SERIAL, todo_id integer NOT NULL, shared_with_user_id integer NOT NULL, permission character varying(10) DEFAULT 'read'::character varying, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS todos (id SERIAL, user_id integer NOT NULL, title character varying(200) NOT NULL, description text, status character varying(20) DEFAULT 'pending'::character varying, priority character varying(10) DEFAULT 'medium'::character varying, due_date date, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP, updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS vendors (vendor_id SERIAL, vendor_name character varying(150) NOT NULL, contact_email character varying(100), contact_phone character varying(30), is_active boolean DEFAULT true, created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP);

-- Primary keys (public schema)
ALTER TABLE public.active_sessions ADD PRIMARY KEY (id);
ALTER TABLE public.active_timers ADD PRIMARY KEY (id);
ALTER TABLE public.announcements ADD PRIMARY KEY (id);
ALTER TABLE public.application_settings ADD PRIMARY KEY (id);
ALTER TABLE public.dashboard_admins ADD PRIMARY KEY (id);
ALTER TABLE public.email_log ADD PRIMARY KEY (id);
ALTER TABLE public.employee_audit_log ADD PRIMARY KEY (id);
ALTER TABLE public.employee_documents ADD PRIMARY KEY (document_id);
ALTER TABLE public.employee_notifications ADD PRIMARY KEY (notification_id);
ALTER TABLE public.employee_portal_settings ADD PRIMARY KEY (id);
ALTER TABLE public.enterprise_inquiries ADD PRIMARY KEY (id);
ALTER TABLE public.messages ADD PRIMARY KEY (id);
ALTER TABLE public.notifications ADD PRIMARY KEY (id);
ALTER TABLE public.packages ADD PRIMARY KEY (id);
ALTER TABLE public.password_history ADD PRIMARY KEY (id);
ALTER TABLE public.payslip_documents ADD PRIMARY KEY (document_id);
ALTER TABLE public.payslip_signature_tokens ADD PRIMARY KEY (id);
ALTER TABLE public.payslip_signatures ADD PRIMARY KEY (signature_id);
ALTER TABLE public.payslips ADD PRIMARY KEY (payslip_id);
ALTER TABLE public.permissions ADD PRIMARY KEY (id);
ALTER TABLE public.permissions ADD CONSTRAINT permissions_resource_action_unique UNIQUE (resource, action);
ALTER TABLE public.project_items ADD PRIMARY KEY (project_id, requirements);
ALTER TABLE public.rbac_audit_log ADD PRIMARY KEY (id);
ALTER TABLE public.role_permissions ADD PRIMARY KEY (role_id, permission_id);
ALTER TABLE public.roles ADD PRIMARY KEY (id);
ALTER TABLE public.roles ADD CONSTRAINT roles_name_unique UNIQUE (name);
ALTER TABLE public.users ADD CONSTRAINT users_email_unique UNIQUE (email);
ALTER TABLE public.sub_users ADD PRIMARY KEY (id);
ALTER TABLE public.tenants ADD PRIMARY KEY (id);
ALTER TABLE public.upgrade_requests ADD PRIMARY KEY (id);
ALTER TABLE public.user_roles ADD PRIMARY KEY (user_id, role_id);
ALTER TABLE public.users ADD PRIMARY KEY (id);
ALTER TABLE assets ADD PRIMARY KEY (id);
ALTER TABLE bank_transactions ADD PRIMARY KEY (id);
ALTER TABLE banks ADD PRIMARY KEY (id);
ALTER TABLE chart_of_accounts ADD PRIMARY KEY (id);
ALTER TABLE chart_of_accounts ADD CONSTRAINT chart_of_accounts_code_unique UNIQUE (code);
ALTER TABLE company_bank_accounts ADD PRIMARY KEY (id);
ALTER TABLE contract_items ADD PRIMARY KEY (contract_id, requirements);
ALTER TABLE contracts ADD PRIMARY KEY (contract_id);
ALTER TABLE debit_card ADD PRIMARY KEY (id);
ALTER TABLE debit_cards ADD PRIMARY KEY (id);
ALTER TABLE documents ADD PRIMARY KEY (id);
ALTER TABLE employees ADD PRIMARY KEY (id);
ALTER TABLE gl_entries ADD PRIMARY KEY (id);
ALTER TABLE loan_installments ADD PRIMARY KEY (id);
ALTER TABLE loans ADD PRIMARY KEY (id);
ALTER TABLE note_shares ADD PRIMARY KEY (id);
ALTER TABLE notes ADD PRIMARY KEY (id);
ALTER TABLE payables ADD PRIMARY KEY (payable_id);
ALTER TABLE payment_payables ADD PRIMARY KEY (payment_id);
ALTER TABLE petty_cash_account ADD PRIMARY KEY (id);
ALTER TABLE petty_cash_transactions ADD PRIMARY KEY (id);
ALTER TABLE projects ADD PRIMARY KEY (project_id);
ALTER TABLE pto_requests ADD PRIMARY KEY (id);
ALTER TABLE purchase_order_items ADD PRIMARY KEY (id);
ALTER TABLE purchase_orders ADD PRIMARY KEY (id);
ALTER TABLE quote_additional_services ADD PRIMARY KEY (service_id);
ALTER TABLE quote_items ADD PRIMARY KEY (item_id);
ALTER TABLE quote_reminder_settings ADD PRIMARY KEY (setting_id);
ALTER TABLE quote_reminders ADD PRIMARY KEY (reminder_id);
ALTER TABLE quote_status_history ADD PRIMARY KEY (history_id);
ALTER TABLE quotes ADD PRIMARY KEY (quote_id);
ALTER TABLE receivables ADD PRIMARY KEY (receivable_id);
ALTER TABLE subscriptions ADD PRIMARY KEY (id);
ALTER TABLE time_entries ADD PRIMARY KEY (id);
ALTER TABLE todo_shares ADD PRIMARY KEY (id);
ALTER TABLE todos ADD PRIMARY KEY (id);
ALTER TABLE vendors ADD PRIMARY KEY (vendor_id);

-- Column backfills: idempotent ADD COLUMN IF NOT EXISTS for columns added after initial schema creation.
-- These run for every tenant on startup via syncAllTenantSchemas so older schemas stay up to date.
ALTER TABLE assets ADD COLUMN IF NOT EXISTS depreciation_method TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS salvage_value NUMERIC;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS useful_life INTEGER;
ALTER TABLE payables ADD COLUMN IF NOT EXISTS contract_id INTEGER;
ALTER TABLE payables ADD COLUMN IF NOT EXISTS bank_account_id INTEGER;
ALTER TABLE payables ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE payables ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100);
ALTER TABLE receivables ADD COLUMN IF NOT EXISTS contract_id INTEGER;
ALTER TABLE petty_cash_transactions ADD COLUMN IF NOT EXISTS transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE petty_cash_transactions ADD COLUMN IF NOT EXISTS petty_cash_account_id INTEGER;
ALTER TABLE petty_cash_transactions ADD COLUMN IF NOT EXISTS source_bank_account_id INTEGER;
ALTER TABLE petty_cash_transactions ADD COLUMN IF NOT EXISTS payable_id INTEGER;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_gl_entry_date ON gl_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_gl_account ON gl_entries(account_id);

-- Journal Entries (Feature 02 — Double-Entry Bookkeeping)
CREATE TABLE IF NOT EXISTS journal_entries (
  id           SERIAL PRIMARY KEY,
  entry_number VARCHAR(20)  NOT NULL,
  entry_date   DATE         NOT NULL,
  description  TEXT         NOT NULL,
  entry_type   VARCHAR(20)  NOT NULL DEFAULT 'MANUAL',
  source_module VARCHAR(30),
  source_id    INTEGER,
  status       VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
  reversed_by  INTEGER,
  created_by   INTEGER,
  approved_by  INTEGER,
  approved_at  TIMESTAMP WITH TIME ZONE,
  posted_at    TIMESTAMP WITH TIME ZONE,
  project_id   INTEGER,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id          SERIAL PRIMARY KEY,
  journal_id  INTEGER      NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id  INTEGER      NOT NULL REFERENCES chart_of_accounts(id),
  description TEXT,
  debit       NUMERIC(15,2) NOT NULL DEFAULT 0,
  credit      NUMERIC(15,2) NOT NULL DEFAULT 0,
  CONSTRAINT  debit_or_credit CHECK (
    (debit > 0 AND credit = 0) OR (debit = 0 AND credit > 0)
  )
);
CREATE INDEX IF NOT EXISTS idx_je_entry_date   ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_je_status       ON journal_entries(status);
CREATE INDEX IF NOT EXISTS idx_je_project_id   ON journal_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_jel_journal_id  ON journal_entry_lines(journal_id);

-- Account Mappings (GL Refactor — Configurable GL Account Routing)
-- Maps system purposes (e.g. 'bank_main') to chart_of_accounts codes.
-- Seeded with defaults matching current hardcoded codes; users can reconfigure in Settings.
CREATE TABLE IF NOT EXISTS account_mappings (
  id           SERIAL PRIMARY KEY,
  purpose      VARCHAR(50)  NOT NULL UNIQUE,
  account_code VARCHAR(10)  NOT NULL,
  label        VARCHAR(100),
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_am_purpose ON account_mappings(purpose);

-- Feature 03 / 07 — Customers (full schema)
CREATE TABLE IF NOT EXISTS customers (
  id               SERIAL PRIMARY KEY,
  tenant_id        INTEGER,
  customer_number  VARCHAR(20),
  name             VARCHAR(150) NOT NULL,
  email            VARCHAR(150),
  phone            VARCHAR(30),
  company_name     VARCHAR(150),
  tax_id           VARCHAR(50),
  billing_address  TEXT,
  shipping_address TEXT,
  payment_terms    VARCHAR(20)  DEFAULT 'NET30',
  credit_limit     NUMERIC(15,2),
  currency         VARCHAR(3)   DEFAULT 'LKR',
  account_manager  INTEGER,
  is_active        BOOLEAN      DEFAULT TRUE,
  created_at       TIMESTAMPTZ  DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS customer_contacts (
  id          SERIAL PRIMARY KEY,
  customer_id INTEGER      NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name        VARCHAR(150) NOT NULL,
  role        VARCHAR(100),
  email       VARCHAR(150),
  phone       VARCHAR(30),
  is_primary  BOOLEAN      DEFAULT FALSE,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ccontacts_customer ON customer_contacts(customer_id);
CREATE TABLE IF NOT EXISTS customer_notes (
  id          SERIAL PRIMARY KEY,
  customer_id INTEGER     NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  note        TEXT        NOT NULL,
  created_by  INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cnotes_customer ON customer_notes(customer_id);
CREATE TABLE IF NOT EXISTS invoices (
  id                   SERIAL PRIMARY KEY,
  invoice_number       VARCHAR(20)   NOT NULL UNIQUE,
  customer_id          INTEGER       REFERENCES customers(id),
  customer_name        VARCHAR(150)  NOT NULL,
  customer_email       VARCHAR(150),
  customer_address     TEXT,
  quote_id             INTEGER       REFERENCES quotes(quote_id),
  sales_order_id       INTEGER,
  issue_date           DATE          NOT NULL,
  due_date             DATE          NOT NULL,
  payment_terms        VARCHAR(20)   DEFAULT 'NET30',
  status               VARCHAR(20)   DEFAULT 'DRAFT',
  subtotal             NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_amount           NUMERIC(15,2) DEFAULT 0,
  discount_amount      NUMERIC(15,2) DEFAULT 0,
  total                NUMERIC(15,2) NOT NULL DEFAULT 0,
  amount_paid          NUMERIC(15,2) DEFAULT 0,
  notes                TEXT,
  terms_and_conditions TEXT,
  created_by           INTEGER,
  project_id           INTEGER       REFERENCES projects(project_id) ON DELETE SET NULL,
  sent_at              TIMESTAMPTZ,
  void_reason          TEXT,
  created_at           TIMESTAMPTZ   DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   DEFAULT NOW()
);
-- Migration: add sales_order_id to existing invoices tables
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sales_order_id INTEGER;
CREATE TABLE IF NOT EXISTS invoice_items (
  id          SERIAL PRIMARY KEY,
  invoice_id  INTEGER       NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT          NOT NULL,
  quantity    NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price  NUMERIC(15,2) NOT NULL,
  tax_rate    NUMERIC(5,2)  DEFAULT 0,
  tax_amount  NUMERIC(15,2) DEFAULT 0,
  total       NUMERIC(15,2) NOT NULL
);
CREATE TABLE IF NOT EXISTS invoice_payments (
  id              SERIAL PRIMARY KEY,
  invoice_id      INTEGER       NOT NULL REFERENCES invoices(id),
  payment_date    DATE          NOT NULL,
  amount          NUMERIC(15,2) NOT NULL,
  payment_method  VARCHAR(30),
  reference       VARCHAR(100),
  bank_account_id INTEGER,
  notes           TEXT,
  recorded_by     INTEGER,
  created_at      TIMESTAMPTZ   DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS credit_notes (
  id                 SERIAL PRIMARY KEY,
  credit_note_number VARCHAR(20)   NOT NULL UNIQUE,
  invoice_id         INTEGER       REFERENCES invoices(id),
  reason             TEXT          NOT NULL,
  amount             NUMERIC(15,2) NOT NULL,
  status             VARCHAR(20)   DEFAULT 'ISSUED',
  issued_date        DATE          NOT NULL,
  created_by         INTEGER,
  created_at         TIMESTAMPTZ   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoices_status      ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date    ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_inv    ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_inv_payments_inv     ON invoice_payments(invoice_id);

-- Backfill: add customer_id to contracts, receivables, quotes (Feature 07)
ALTER TABLE contracts   ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id);
ALTER TABLE receivables ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id);
ALTER TABLE quotes      ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id);

-- Feature 03b — Bills (upgraded Payables)
CREATE TABLE IF NOT EXISTS bills (
  id              SERIAL PRIMARY KEY,
  bill_number     VARCHAR(20)   NOT NULL UNIQUE,
  vendor_id       INTEGER       REFERENCES vendors(vendor_id),
  vendor_name     VARCHAR(150)  NOT NULL,
  vendor_email    VARCHAR(150),
  vendor_address  TEXT,
  bill_date       DATE          NOT NULL,
  due_date        DATE          NOT NULL,
  payment_terms   VARCHAR(20)   DEFAULT 'NET30',
  status          VARCHAR(20)   DEFAULT 'DRAFT',
  subtotal        NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_amount      NUMERIC(15,2) DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  total           NUMERIC(15,2) NOT NULL DEFAULT 0,
  amount_paid     NUMERIC(15,2) DEFAULT 0,
  notes           TEXT,
  created_by      INTEGER,
  received_at     TIMESTAMPTZ,
  void_reason     TEXT,
  project_id      INTEGER       REFERENCES projects(project_id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ   DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bills_project_id ON bills(project_id);
CREATE TABLE IF NOT EXISTS bill_items (
  id          SERIAL PRIMARY KEY,
  bill_id     INTEGER       NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  description TEXT          NOT NULL,
  quantity    NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price  NUMERIC(15,2) NOT NULL,
  tax_rate    NUMERIC(5,2)  DEFAULT 0,
  tax_amount  NUMERIC(15,2) DEFAULT 0,
  total       NUMERIC(15,2) NOT NULL
);
CREATE TABLE IF NOT EXISTS bill_payments (
  id              SERIAL PRIMARY KEY,
  bill_id         INTEGER       NOT NULL REFERENCES bills(id),
  payment_date    DATE          NOT NULL,
  amount          NUMERIC(15,2) NOT NULL,
  payment_method  VARCHAR(30),
  reference       VARCHAR(100),
  bank_account_id INTEGER,
  notes           TEXT,
  recorded_by     INTEGER,
  created_at      TIMESTAMPTZ   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bills_status    ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_vendor_id ON bills(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bills_due_date  ON bills(due_date);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_bill ON bill_payments(bill_id);

-- Feature 10 migrations: enhance bills for full AP lifecycle
ALTER TABLE bills ADD COLUMN IF NOT EXISTS vendor_bill_number   VARCHAR(100);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS purchase_order_id    INTEGER;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS approved_by          INTEGER;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS approved_at          TIMESTAMPTZ;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS scheduled_date       DATE;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS dispute_reason       TEXT;
ALTER TABLE bill_items ADD COLUMN IF NOT EXISTS gl_account_id   INTEGER;

-- Feature 04 — Tax Management (VAT / GST / WHT)
CREATE TABLE IF NOT EXISTS tax_rates (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL UNIQUE,
  rate          NUMERIC(6,4) NOT NULL,
  tax_type      VARCHAR(20)  NOT NULL DEFAULT 'VAT',
  applies_to    VARCHAR(20)  NOT NULL DEFAULT 'BOTH',
  is_compound   BOOLEAN      NOT NULL DEFAULT FALSE,
  gl_account_id INTEGER      REFERENCES chart_of_accounts(id),
  is_default    BOOLEAN      NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  description   TEXT,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS tax_periods (
  id          SERIAL PRIMARY KEY,
  period_name VARCHAR(50)  NOT NULL,
  start_date  DATE         NOT NULL,
  end_date    DATE         NOT NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'OPEN',
  filed_at    TIMESTAMPTZ,
  filed_by    INTEGER,
  notes       TEXT,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS tax_transactions (
  id               SERIAL PRIMARY KEY,
  tax_rate_id      INTEGER       NOT NULL REFERENCES tax_rates(id),
  transaction_date DATE          NOT NULL,
  tax_type         VARCHAR(20)   NOT NULL,
  source_module    VARCHAR(30)   NOT NULL,
  source_id        INTEGER       NOT NULL,
  taxable_amount   NUMERIC(15,2) NOT NULL,
  tax_amount       NUMERIC(15,2) NOT NULL,
  period_id        INTEGER       REFERENCES tax_periods(id),
  created_at       TIMESTAMPTZ   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tax_rates_active        ON tax_rates(is_active);
CREATE INDEX IF NOT EXISTS idx_tax_periods_status      ON tax_periods(status);
CREATE INDEX IF NOT EXISTS idx_tax_tx_rate             ON tax_transactions(tax_rate_id);
CREATE INDEX IF NOT EXISTS idx_tax_tx_date             ON tax_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_tax_tx_source           ON tax_transactions(source_module, source_id);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS tax_rate_id INTEGER REFERENCES tax_rates(id);
ALTER TABLE bill_items    ADD COLUMN IF NOT EXISTS tax_rate_id INTEGER REFERENCES tax_rates(id);

-- Feature 05 — Bank Reconciliation
CREATE TABLE IF NOT EXISTS bank_reconciliations (
  id                    SERIAL PRIMARY KEY,
  bank_account_id       INT NOT NULL,
  statement_date        DATE NOT NULL,
  statement_balance     NUMERIC(15,2) NOT NULL,
  gl_balance            NUMERIC(15,2) NOT NULL,
  adjusted_bank_balance NUMERIC(15,2),
  adjusted_gl_balance   NUMERIC(15,2),
  status                VARCHAR(20) DEFAULT 'IN_PROGRESS',
  completed_at          TIMESTAMPTZ,
  completed_by          INT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS bank_statement_lines (
  id                     SERIAL PRIMARY KEY,
  reconciliation_id      INT NOT NULL REFERENCES bank_reconciliations(id) ON DELETE CASCADE,
  transaction_date       DATE NOT NULL,
  description            TEXT NOT NULL,
  debit                  NUMERIC(15,2) DEFAULT 0,
  credit                 NUMERIC(15,2) DEFAULT 0,
  reference              VARCHAR(100),
  matched_transaction_id INT,
  is_matched             BOOLEAN DEFAULT FALSE,
  match_type             VARCHAR(20),
  created_at             TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_recon_account  ON bank_reconciliations(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_recon_status   ON bank_reconciliations(status);
CREATE INDEX IF NOT EXISTS idx_bsl_recon      ON bank_statement_lines(reconciliation_id);
CREATE INDEX IF NOT EXISTS idx_bsl_matched    ON bank_statement_lines(is_matched);
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS is_reconciled    BOOLEAN DEFAULT FALSE;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS reconciliation_id INT;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS reconciled_at    TIMESTAMPTZ;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS reference        VARCHAR(100);
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS source_module    VARCHAR(50);
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS source_id        INT;

-- ─────────────────────────────────────────────────────────────────────────────
-- FEATURE 08 — INVENTORY & STOCK MANAGEMENT
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
  id                     SERIAL PRIMARY KEY,
  sku                    VARCHAR(50)  NOT NULL,
  name                   VARCHAR(150) NOT NULL,
  description            TEXT,
  category               VARCHAR(100),
  unit_of_measure        VARCHAR(20)  DEFAULT 'unit',
  cost_price             NUMERIC(15,2),
  selling_price          NUMERIC(15,2),
  reorder_point          INT          DEFAULT 0,
  reorder_quantity       INT          DEFAULT 0,
  track_inventory        BOOLEAN      DEFAULT TRUE,
  gl_asset_account_id    INT          REFERENCES chart_of_accounts(id),
  gl_expense_account_id  INT          REFERENCES chart_of_accounts(id),
  gl_revenue_account_id  INT          REFERENCES chart_of_accounts(id),
  is_active              BOOLEAN      DEFAULT TRUE,
  created_at             TIMESTAMPTZ  DEFAULT NOW(),
  updated_at             TIMESTAMPTZ  DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active     ON products(is_active);

CREATE TABLE IF NOT EXISTS warehouses (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  address    TEXT,
  is_default BOOLEAN      DEFAULT FALSE,
  is_active  BOOLEAN      DEFAULT TRUE,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_levels (
  id                 SERIAL PRIMARY KEY,
  product_id         INT          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id       INT          NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity_on_hand   NUMERIC(12,2) DEFAULT 0,
  quantity_reserved  NUMERIC(12,2) DEFAULT 0,
  updated_at         TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(product_id, warehouse_id)
);
CREATE INDEX IF NOT EXISTS idx_stock_product   ON stock_levels(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_warehouse ON stock_levels(warehouse_id);

CREATE TABLE IF NOT EXISTS stock_movements (
  id            SERIAL PRIMARY KEY,
  product_id    INT          NOT NULL REFERENCES products(id),
  warehouse_id  INT          NOT NULL REFERENCES warehouses(id),
  movement_type VARCHAR(30)  NOT NULL,
  quantity      NUMERIC(12,2) NOT NULL,
  unit_cost     NUMERIC(15,2),
  total_cost    NUMERIC(15,2),
  reference     VARCHAR(100),
  source_module VARCHAR(30),
  source_id     INT,
  notes         TEXT,
  moved_by      INT,
  moved_at      TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_movements_product  ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_type     ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_movements_moved_at ON stock_movements(moved_at);

-- ── Feature 09: Sales Orders ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sales_orders (
  id                SERIAL PRIMARY KEY,
  tenant_id         INTEGER,
  order_number      VARCHAR(20) NOT NULL UNIQUE,
  quote_id          INT REFERENCES quotes(quote_id),
  customer_id       INT REFERENCES customers(id),
  order_date        DATE NOT NULL,
  expected_delivery DATE,
  status            VARCHAR(20) DEFAULT 'CONFIRMED',
  shipping_address  TEXT,
  notes             TEXT,
  assigned_to       INT,
  subtotal          NUMERIC(15,2),
  tax_amount        NUMERIC(15,2) DEFAULT 0,
  total             NUMERIC(15,2),
  created_by        INT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_so_tenant    ON sales_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_so_customer  ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_so_status    ON sales_orders(status);

CREATE TABLE IF NOT EXISTS sales_order_items (
  id                  SERIAL PRIMARY KEY,
  order_id            INT NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id          INT REFERENCES products(id),
  description         TEXT NOT NULL,
  quantity_ordered    NUMERIC(12,2) NOT NULL,
  quantity_delivered  NUMERIC(12,2) DEFAULT 0,
  unit_price          NUMERIC(15,2) NOT NULL,
  tax_rate_id         INT,
  total               NUMERIC(15,2) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_soi_order ON sales_order_items(order_id);

CREATE TABLE IF NOT EXISTS deliveries (
  id              SERIAL PRIMARY KEY,
  order_id        INT NOT NULL REFERENCES sales_orders(id),
  delivery_number VARCHAR(20) NOT NULL,
  delivery_date   DATE NOT NULL,
  notes           TEXT,
  delivered_by    INT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_del_order ON deliveries(order_id);

CREATE TABLE IF NOT EXISTS delivery_items (
  id                 SERIAL PRIMARY KEY,
  delivery_id        INT NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  order_item_id      INT NOT NULL REFERENCES sales_order_items(id),
  quantity_delivered NUMERIC(12,2) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_deli_delivery ON delivery_items(delivery_id);

-- ── Feature 11: Expense Claims ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS expense_categories (
  id               SERIAL PRIMARY KEY,
  tenant_id        INTEGER,
  name             VARCHAR(100) NOT NULL,
  gl_account_id    INTEGER,
  daily_limit      NUMERIC(10,2),
  requires_receipt BOOLEAN DEFAULT TRUE,
  is_active        BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_exp_cat_tenant ON expense_categories(tenant_id);

CREATE TABLE IF NOT EXISTS expense_claims (
  id               SERIAL PRIMARY KEY,
  tenant_id        INTEGER,
  claim_number     VARCHAR(20) NOT NULL UNIQUE,
  employee_id      INT NOT NULL REFERENCES employees(id),
  submitted_by     INT,
  title            TEXT NOT NULL,
  period_from      DATE NOT NULL,
  period_to        DATE NOT NULL,
  total_amount     NUMERIC(15,2) NOT NULL DEFAULT 0,
  status           VARCHAR(20) DEFAULT 'DRAFT',
  approved_by      INT,
  approved_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  payment_method   VARCHAR(20),
  paid_at          TIMESTAMPTZ,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exp_claim_employee ON expense_claims(employee_id);
CREATE INDEX IF NOT EXISTS idx_exp_claim_status   ON expense_claims(status);
CREATE INDEX IF NOT EXISTS idx_exp_claim_tenant   ON expense_claims(tenant_id);

CREATE TABLE IF NOT EXISTS expense_items (
  id                  SERIAL PRIMARY KEY,
  claim_id            INT NOT NULL REFERENCES expense_claims(id) ON DELETE CASCADE,
  expense_date        DATE NOT NULL,
  category_id         INT NOT NULL REFERENCES expense_categories(id),
  description         TEXT NOT NULL,
  amount              NUMERIC(10,2) NOT NULL,
  tax_amount          NUMERIC(10,2) DEFAULT 0,
  merchant            VARCHAR(150),
  project_id          INT,
  is_billable         BOOLEAN DEFAULT FALSE,
  customer_id         INT REFERENCES customers(id)
);
CREATE INDEX IF NOT EXISTS idx_exp_items_claim ON expense_items(claim_id);

-- ── Feature 12: Budget Planning & Variance Analysis ───────────────────────────

CREATE TABLE IF NOT EXISTS budget_periods (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER,
  name         VARCHAR(100) NOT NULL,
  fiscal_year  INT NOT NULL,
  period_type  VARCHAR(20) NOT NULL DEFAULT 'ANNUAL',
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  status       VARCHAR(20) DEFAULT 'DRAFT',
  created_by   INT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_budget_tenant ON budget_periods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budget_year   ON budget_periods(fiscal_year);

CREATE TABLE IF NOT EXISTS budget_lines (
  id               SERIAL PRIMARY KEY,
  budget_period_id INT NOT NULL REFERENCES budget_periods(id) ON DELETE CASCADE,
  account_id       INT NOT NULL REFERENCES chart_of_accounts(id),
  month            DATE,
  budgeted_amount  NUMERIC(15,2) NOT NULL DEFAULT 0,
  notes            TEXT,
  UNIQUE(budget_period_id, account_id, month)
);
CREATE INDEX IF NOT EXISTS idx_bline_period  ON budget_lines(budget_period_id);
CREATE INDEX IF NOT EXISTS idx_bline_account ON budget_lines(account_id);

CREATE TABLE IF NOT EXISTS cost_centres (
  id        SERIAL PRIMARY KEY,
  tenant_id INTEGER,
  name      VARCHAR(100) NOT NULL,
  code      VARCHAR(20)  NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_cc_tenant ON cost_centres(tenant_id);

ALTER TABLE gl_entries ADD COLUMN IF NOT EXISTS cost_centre_id INTEGER;

-- ── Feature 13: Multi-Currency Support ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS exchange_rates (
  id            SERIAL PRIMARY KEY,
  tenant_id     INTEGER NOT NULL,
  from_currency VARCHAR(3) NOT NULL,
  to_currency   VARCHAR(3) NOT NULL,
  rate          NUMERIC(18,8) NOT NULL,
  rate_date     DATE NOT NULL,
  source        VARCHAR(20) DEFAULT 'MANUAL',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, from_currency, to_currency, rate_date)
);
CREATE INDEX IF NOT EXISTS idx_exrate_tenant ON exchange_rates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exrate_pair   ON exchange_rates(from_currency, to_currency);

ALTER TABLE invoices              ADD COLUMN IF NOT EXISTS currency         VARCHAR(3) DEFAULT 'LKR';
ALTER TABLE invoices              ADD COLUMN IF NOT EXISTS exchange_rate    NUMERIC(18,8) DEFAULT 1;
ALTER TABLE invoices              ADD COLUMN IF NOT EXISTS functional_total NUMERIC(15,2);
ALTER TABLE payables              ADD COLUMN IF NOT EXISTS currency         VARCHAR(3) DEFAULT 'LKR';
ALTER TABLE payables              ADD COLUMN IF NOT EXISTS exchange_rate    NUMERIC(18,8) DEFAULT 1;
ALTER TABLE payables              ADD COLUMN IF NOT EXISTS functional_total NUMERIC(15,2);
ALTER TABLE company_bank_accounts ADD COLUMN IF NOT EXISTS currency         VARCHAR(3) DEFAULT 'LKR';
ALTER TABLE vendors               ADD COLUMN IF NOT EXISTS default_currency  VARCHAR(3) DEFAULT 'LKR';

-- ── Feature 14: Advanced Analytics & KPI Dashboards ───────────────────────────

CREATE TABLE IF NOT EXISTS dashboard_configs (
  id             SERIAL PRIMARY KEY,
  tenant_id      INTEGER NOT NULL,
  user_id        INTEGER NOT NULL,
  dashboard_name VARCHAR(100) DEFAULT 'Main',
  layout         JSONB NOT NULL DEFAULT '[]',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id, dashboard_name)
);

CREATE TABLE IF NOT EXISTS kpi_targets (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL,
  kpi_key      VARCHAR(100) NOT NULL,
  target_value NUMERIC(15,2) NOT NULL,
  period       VARCHAR(20) DEFAULT 'MONTHLY',
  fiscal_year  INT,
  month        INT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, kpi_key, period, fiscal_year, month)
);

-- ── Feature 15: Compliance & Audit Reports ────────────────────────────────────

CREATE TABLE IF NOT EXISTS financial_audit_log (
  id          SERIAL PRIMARY KEY,
  tenant_id   INTEGER NOT NULL,
  entity_type VARCHAR(50)  NOT NULL,
  entity_id   INTEGER      NOT NULL,
  action      VARCHAR(30)  NOT NULL,
  old_values  JSONB,
  new_values  JSONB,
  changed_by  INTEGER,
  changed_at  TIMESTAMPTZ  DEFAULT NOW(),
  ip_address  TEXT,
  session_id  TEXT
);
CREATE INDEX IF NOT EXISTS idx_fin_audit_entity ON financial_audit_log(tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_fin_audit_user   ON financial_audit_log(tenant_id, changed_by);
CREATE INDEX IF NOT EXISTS idx_fin_audit_time   ON financial_audit_log(tenant_id, changed_at DESC);

CREATE TABLE IF NOT EXISTS statutory_reports (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL,
  report_type  VARCHAR(50) NOT NULL,
  period_from  DATE NOT NULL,
  period_to    DATE NOT NULL,
  generated_at TIMESTAMPTZ,
  generated_by INTEGER,
  filed_at     TIMESTAMPTZ,
  filed_by     INTEGER,
  notes        TEXT
);

-- ── Feature 16: Bulk Import / Export ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS import_jobs (
  id             SERIAL PRIMARY KEY,
  tenant_id      INTEGER NOT NULL,
  import_type    VARCHAR(50)  NOT NULL,
  file_name      VARCHAR(255) NOT NULL,
  total_rows     INT,
  processed_rows INT DEFAULT 0,
  success_rows   INT DEFAULT 0,
  error_rows     INT DEFAULT 0,
  status         VARCHAR(20) DEFAULT 'PENDING',
  errors         JSONB,
  imported_by    INTEGER,
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_import_jobs_tenant ON import_jobs(tenant_id);

-- ── Feature 17: Webhooks & API Keys ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER NOT NULL,
  name       VARCHAR(100) NOT NULL,
  url        TEXT NOT NULL,
  secret     TEXT NOT NULL,
  events     TEXT[] NOT NULL DEFAULT '{}',
  is_active  BOOLEAN DEFAULT TRUE,
  created_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webhook_tenant ON webhook_endpoints(tenant_id);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id             SERIAL PRIMARY KEY,
  endpoint_id    INTEGER NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_type     VARCHAR(50) NOT NULL,
  payload        JSONB NOT NULL,
  response_status INT,
  response_body  TEXT,
  delivered_at   TIMESTAMPTZ,
  duration_ms    INT,
  success        BOOLEAN,
  retry_count    INT DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_whdel_endpoint ON webhook_deliveries(endpoint_id);

-- ── Feature 18: Vendor Self-Service Portal ────────────────────────────────────

CREATE TABLE IF NOT EXISTS vendor_portal_users (
  id             SERIAL PRIMARY KEY,
  vendor_id      INTEGER NOT NULL,
  email          VARCHAR(150) NOT NULL,
  name           VARCHAR(150) NOT NULL,
  password_hash  TEXT NOT NULL,
  is_active      BOOLEAN DEFAULT TRUE,
  last_login     TIMESTAMPTZ,
  invite_token   TEXT,
  invite_expires TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, email)
);

CREATE TABLE IF NOT EXISTS po_acknowledgements (
  id                SERIAL PRIMARY KEY,
  purchase_order_id INTEGER NOT NULL,
  acknowledged_by   INTEGER NOT NULL,
  acknowledged_at   TIMESTAMPTZ DEFAULT NOW(),
  notes             TEXT
);

CREATE TABLE IF NOT EXISTS vendor_invoice_submissions (
  id                    SERIAL PRIMARY KEY,
  vendor_id             INTEGER NOT NULL,
  purchase_order_id     INTEGER,
  vendor_invoice_number VARCHAR(50) NOT NULL,
  invoice_date          DATE NOT NULL,
  due_date              DATE,
  total_amount          NUMERIC(15,2) NOT NULL,
  line_items            JSONB DEFAULT '[]',
  status                VARCHAR(20) DEFAULT 'SUBMITTED',
  bill_id               INTEGER,
  submitted_by          INTEGER,
  reviewed_by           INTEGER,
  review_notes          TEXT,
  submitted_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vis_vendor ON vendor_invoice_submissions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vis_status ON vendor_invoice_submissions(status);

CREATE TABLE IF NOT EXISTS remittance_advices (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL,
  vendor_id    INTEGER NOT NULL,
  payment_date DATE NOT NULL,
  total_amount NUMERIC(15,2) NOT NULL,
  bill_ids     INTEGER[] NOT NULL DEFAULT '{}',
  sent_at      TIMESTAMPTZ,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Feature 19: Employee Performance Reviews ──────────────────────────────────

CREATE TABLE IF NOT EXISTS review_cycles (
  id                   SERIAL PRIMARY KEY,
  tenant_id            INTEGER NOT NULL,
  name                 VARCHAR(100) NOT NULL,
  cycle_type           VARCHAR(20)  NOT NULL DEFAULT 'ANNUAL',
  review_period_from   DATE         NOT NULL,
  review_period_to     DATE         NOT NULL,
  submission_deadline  DATE,
  status               VARCHAR(20)  DEFAULT 'DRAFT',
  created_by           INTEGER,
  created_at           TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rc_tenant ON review_cycles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rc_status ON review_cycles(status);

CREATE TABLE IF NOT EXISTS performance_goals (
  id              SERIAL PRIMARY KEY,
  employee_id     INTEGER NOT NULL,
  review_cycle_id INTEGER REFERENCES review_cycles(id) ON DELETE SET NULL,
  title           TEXT    NOT NULL,
  description     TEXT,
  category        VARCHAR(50) DEFAULT 'PERFORMANCE',
  target          TEXT,
  weight          NUMERIC(5,2) DEFAULT 1,
  status          VARCHAR(20)  DEFAULT 'ACTIVE',
  due_date        DATE,
  set_by          INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pg_employee ON performance_goals(employee_id);
CREATE INDEX IF NOT EXISTS idx_pg_cycle    ON performance_goals(review_cycle_id);

CREATE TABLE IF NOT EXISTS performance_reviews (
  id                    SERIAL PRIMARY KEY,
  tenant_id             INTEGER NOT NULL,
  review_cycle_id       INTEGER NOT NULL REFERENCES review_cycles(id),
  employee_id           INTEGER NOT NULL,
  reviewer_id           INTEGER NOT NULL,
  status                VARCHAR(30) DEFAULT 'DRAFT',
  self_overall_score    NUMERIC(3,1),
  self_comments         TEXT,
  self_submitted_at     TIMESTAMPTZ,
  manager_overall_score NUMERIC(3,1),
  manager_comments      TEXT,
  manager_submitted_at  TIMESTAMPTZ,
  outcome               VARCHAR(30),
  recommended_action    VARCHAR(30),
  salary_increase_pct   NUMERIC(5,2),
  promotion_title       VARCHAR(100),
  hr_notes              TEXT,
  hr_approved_by        INTEGER,
  hr_approved_at        TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_cycle_id, employee_id)
);
CREATE INDEX IF NOT EXISTS idx_pr_tenant   ON performance_reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pr_employee ON performance_reviews(employee_id);
CREATE INDEX IF NOT EXISTS idx_pr_reviewer ON performance_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_pr_cycle    ON performance_reviews(review_cycle_id);

CREATE TABLE IF NOT EXISTS review_scores (
  id               SERIAL PRIMARY KEY,
  review_id        INTEGER NOT NULL REFERENCES performance_reviews(id) ON DELETE CASCADE,
  competency       VARCHAR(100) NOT NULL,
  self_score       NUMERIC(3,1),
  manager_score    NUMERIC(3,1),
  manager_comment  TEXT
);
CREATE INDEX IF NOT EXISTS idx_rs_review ON review_scores(review_id);

-- ── Feature 20: Attendance Management ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shifts (
  id                   SERIAL PRIMARY KEY,
  tenant_id            INTEGER NOT NULL,
  name                 VARCHAR(100) NOT NULL,
  start_time           TIME NOT NULL,
  end_time             TIME NOT NULL,
  break_minutes        INT DEFAULT 60,
  grace_period_minutes INT DEFAULT 15,
  days_of_week         INT[] NOT NULL DEFAULT '{1,2,3,4,5}',
  is_active            BOOLEAN DEFAULT TRUE,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shifts_tenant ON shifts(tenant_id);

CREATE TABLE IF NOT EXISTS employee_shifts (
  id             SERIAL PRIMARY KEY,
  employee_id    INTEGER NOT NULL,
  shift_id       INTEGER NOT NULL REFERENCES shifts(id),
  effective_from DATE    NOT NULL,
  effective_to   DATE,
  assigned_by    INTEGER,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_es_employee ON employee_shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_es_shift    ON employee_shifts(shift_id);

CREATE TABLE IF NOT EXISTS attendance_records (
  id                  SERIAL PRIMARY KEY,
  tenant_id           INTEGER NOT NULL,
  employee_id         INTEGER NOT NULL,
  attendance_date     DATE    NOT NULL,
  shift_id            INTEGER REFERENCES shifts(id),
  check_in            TIMESTAMPTZ,
  check_out           TIMESTAMPTZ,
  total_hours         NUMERIC(5,2),
  overtime_hours      NUMERIC(5,2) DEFAULT 0,
  status              VARCHAR(20)  NOT NULL DEFAULT 'PRESENT',
  late_minutes        INT DEFAULT 0,
  early_leave_minutes INT DEFAULT 0,
  source              VARCHAR(20)  DEFAULT 'MANUAL',
  notes               TEXT,
  approved_by         INTEGER,
  created_at          TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(employee_id, attendance_date)
);
CREATE INDEX IF NOT EXISTS idx_ar_tenant   ON attendance_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ar_employee ON attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_ar_date     ON attendance_records(attendance_date);
CREATE INDEX IF NOT EXISTS idx_ar_status   ON attendance_records(status);

CREATE TABLE IF NOT EXISTS public_holidays (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL,
  holiday_date DATE    NOT NULL,
  name         VARCHAR(100) NOT NULL,
  is_paid      BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, holiday_date)
);
CREATE INDEX IF NOT EXISTS idx_ph_tenant ON public_holidays(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ph_date   ON public_holidays(holiday_date);

CREATE TABLE IF NOT EXISTS leave_balances (
  id            SERIAL PRIMARY KEY,
  employee_id   INTEGER NOT NULL,
  leave_type    VARCHAR(30) NOT NULL,
  year          INT NOT NULL,
  entitled_days NUMERIC(5,1) NOT NULL,
  taken_days    NUMERIC(5,1) DEFAULT 0,
  UNIQUE(employee_id, leave_type, year)
);
CREATE INDEX IF NOT EXISTS idx_lb_employee ON leave_balances(employee_id);

CREATE TABLE IF NOT EXISTS stripe_configs (
  id                 SERIAL PRIMARY KEY,
  publishable_key    TEXT NOT NULL,
  secret_key_enc     TEXT NOT NULL,
  webhook_secret_enc TEXT NOT NULL,
  currency           VARCHAR(3) NOT NULL DEFAULT 'usd',
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stripe_payment_links (
  id                  SERIAL PRIMARY KEY,
  invoice_id          INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  stripe_session_id   TEXT NOT NULL UNIQUE,
  stripe_payment_url  TEXT NOT NULL,
  amount              NUMERIC(15,2) NOT NULL,
  currency            VARCHAR(3) NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending',
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_spl_invoice_id      ON stripe_payment_links(invoice_id);
CREATE INDEX IF NOT EXISTS idx_spl_session_id      ON stripe_payment_links(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_spl_status          ON stripe_payment_links(status);

