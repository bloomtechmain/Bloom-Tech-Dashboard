-- Schema for BloomAudit Dashboard
-- Table: users

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    password_must_change BOOLEAN DEFAULT FALSE,
    account_status CHARACTER VARYING(20) DEFAULT 'active',
    status_changed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status_changed_by INTEGER,
    status_reason TEXT,
    tenant_id INTEGER,
    company_type CHARACTER VARYING(100),
    package_name CHARACTER VARYING(100),
    package_price NUMERIC(10,2),
    package_status CHARACTER VARYING(50),
    no_of_users INTEGER,
    purchase_date DATE,
    plan_type CHARACTER VARYING(50),
    plan_features JSONB,
    source CHARACTER VARYING(50)
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
