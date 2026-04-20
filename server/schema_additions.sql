-- BloomAudit: Additional Tables
-- Run after schema.sql (users table must already exist)

-- ─── Packages ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS packages (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    price           NUMERIC(10, 2) NOT NULL,
    plan_type       VARCHAR(50)  NOT NULL DEFAULT 'monthly',
    description     TEXT,
    features        JSONB        NOT NULL DEFAULT '[]',
    max_users       INTEGER,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_packages_name ON packages(name);

-- ─── Admin Logs ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_logs (
    id              SERIAL PRIMARY KEY,
    admin_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,
    resource_type   VARCHAR(50),
    resource_id     INTEGER,
    details         JSONB        DEFAULT '{}',
    ip_address      VARCHAR(45),
    created_at      TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id   ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action     ON admin_logs(action);

-- ─── Users: subscription end date ────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_end_date DATE;

-- ─── Sub Users ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sub_users (
    id              SERIAL PRIMARY KEY,
    main_user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255),
    role            VARCHAR(100) DEFAULT 'user',
    department      VARCHAR(100),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sub_users_main_user_id ON sub_users(main_user_id);
CREATE INDEX IF NOT EXISTS idx_sub_users_email        ON sub_users(email);

-- ─── Notifications ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id              SERIAL PRIMARY KEY,
    type            VARCHAR(60)  NOT NULL,   -- 'expire_warning' | 'user_limit_exceeded' | etc.
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    message         TEXT         NOT NULL,
    metadata        JSONB        DEFAULT '{}',
    is_read         BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type       ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read    ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
