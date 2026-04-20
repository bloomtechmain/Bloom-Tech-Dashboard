import pool from './db';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── 1. Run schema additions ─────────────────────────────────────────────
    console.log('Running schema additions...');
    const additionsSql = fs.readFileSync(path.join(__dirname, 'schema_additions.sql'), 'utf8');
    await client.query(additionsSql);
    console.log('  Tables created (or already exist).');

    // ── 2. Create default admin user ────────────────────────────────────────
    console.log('Creating default admin user...');
    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin123';

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    const hash = await bcrypt.hash(adminPassword, 10);

    if (existing.rows.length > 0) {
      await client.query(
        `UPDATE users SET role = 'admin', password_hash = $1, account_status = 'active' WHERE email = $2`,
        [hash, adminEmail]
      );
      console.log('  Admin user already existed — role and password updated.');
    } else {
      await client.query(
        `INSERT INTO users (name, email, password_hash, role, account_status)
         VALUES ($1, $2, $3, 'admin', 'active')`,
        ['Administrator', adminEmail, hash]
      );
      console.log(`  Admin user created: ${adminEmail}`);
    }

    // ── 3. Seed all 6 packages (3 monthly + 3 yearly) ──────────────────────
    console.log('Seeding packages...');

    const packages = [
      // ── Monthly ────────────────────────────────────────────────────────────
      {
        name: 'Basic',
        price: 49.99,
        plan_type: 'monthly',
        description: 'Perfect for small teams getting started with audit management.',
        max_users: 5,
        features: [
          'Up to 5 users',
          'Core audit tools',
          'Email support',
          'Monthly reports',
          '5 GB storage',
        ],
      },
      {
        name: 'Pro',
        price: 99.99,
        plan_type: 'monthly',
        description: 'Advanced features for growing businesses that need more power.',
        max_users: 25,
        features: [
          'Up to 25 users',
          'Advanced analytics',
          'Priority support',
          'Monthly & annual reports',
          'API access',
          '50 GB storage',
          'Custom workflows',
        ],
      },
      {
        name: 'Enterprise',
        price: 249.99,
        plan_type: 'monthly',
        description: 'Full-featured solution for large organisations with complex needs.',
        max_users: null,
        features: [
          'Unlimited users',
          'Custom integrations',
          'Dedicated support',
          'Custom reports',
          'SLA guarantee',
          'White-label options',
          'Unlimited storage',
          'SSO / SAML',
          'On-premise option',
        ],
      },
      // ── Yearly ─────────────────────────────────────────────────────────────
      {
        name: 'Basic Yearly',
        price: 479.99,
        plan_type: 'yearly',
        description: 'All Basic features billed annually — save 20% vs monthly.',
        max_users: 5,
        features: [
          'Up to 5 users',
          'Core audit tools',
          'Email support',
          'Monthly reports',
          '5 GB storage',
          '20% savings vs monthly',
        ],
      },
      {
        name: 'Pro Yearly',
        price: 959.99,
        plan_type: 'yearly',
        description: 'All Pro features billed annually — save 20% vs monthly.',
        max_users: 25,
        features: [
          'Up to 25 users',
          'Advanced analytics',
          'Priority support',
          'Monthly & annual reports',
          'API access',
          '50 GB storage',
          'Custom workflows',
          '20% savings vs monthly',
        ],
      },
      {
        name: 'Enterprise Yearly',
        price: 2399.99,
        plan_type: 'yearly',
        description: 'All Enterprise features billed annually — save 20% vs monthly.',
        max_users: null,
        features: [
          'Unlimited users',
          'Custom integrations',
          'Dedicated support',
          'Custom reports',
          'SLA guarantee',
          'White-label options',
          'Unlimited storage',
          'SSO / SAML',
          'On-premise option',
          '20% savings vs monthly',
        ],
      },
    ];

    for (const pkg of packages) {
      await client.query(
        `INSERT INTO packages (name, price, plan_type, description, max_users, features)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (name) DO UPDATE SET
           price       = EXCLUDED.price,
           plan_type   = EXCLUDED.plan_type,
           description = EXCLUDED.description,
           max_users   = EXCLUDED.max_users,
           features    = EXCLUDED.features,
           updated_at  = NOW()`,
        [pkg.name, pkg.price, pkg.plan_type, pkg.description, pkg.max_users, JSON.stringify(pkg.features)]
      );
      const cycle = pkg.plan_type === 'monthly' ? 'mo' : 'yr';
      console.log(`  Upserted: ${pkg.name.padEnd(18)} $${pkg.price}/${cycle}`);
    }

    await client.query('COMMIT');

    console.log('\nSeed completed successfully!');
    console.log('─────────────────────────────────');
    console.log('Admin credentials:');
    console.log('  Email   : admin@gmail.com');
    console.log('  Password: admin123');
    console.log('─────────────────────────────────');
    console.log('Packages: 3 monthly + 3 yearly');
    console.log('─────────────────────────────────');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
