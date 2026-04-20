import pool from './db';
import fs from 'fs';
import path from 'path';

async function migrate() {
  try {
    console.log('Starting database migration...');

    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schemaSql);
    console.log('  Users table: OK');

    const additionsSql = fs.readFileSync(path.join(__dirname, 'schema_additions.sql'), 'utf8');
    await pool.query(additionsSql);
    console.log('  Packages + admin_logs tables: OK');

    console.log('Migration completed.');
    process.exit(0);
  } catch (err: any) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
