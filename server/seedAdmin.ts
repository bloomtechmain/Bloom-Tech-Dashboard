import bcrypt from 'bcrypt';
import pool from './db';
import dotenv from 'dotenv';
dotenv.config();

const ADMIN_NAME     = process.env.ADMIN_NAME     || 'Admin';
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@bloomaudit.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@12345';

async function seedAdmin() {
  try {
    const existing = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [ADMIN_EMAIL]
    );

    if (existing.rows.length) {
      console.log(`Admin already exists: ${ADMIN_EMAIL}`);
      process.exit(0);
    }

    const password_hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, account_status, source, plan_type)
       VALUES ($1, $2, $3, 'admin', 'active', 'manual', 'monthly')
       RETURNING id, name, email, role`,
      [ADMIN_NAME, ADMIN_EMAIL, password_hash]
    );

    console.log('Admin user created:');
    console.table(result.rows[0]);
    console.log(`Password: ${ADMIN_PASSWORD}`);
  } catch (err: any) {
    console.error('Seed admin failed:', err.message);
  } finally {
    await pool.end();
  }
}

seedAdmin();
