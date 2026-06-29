const vmpPool = require('../config/vmpDb');
const corePool = require('../config/db');

const createVmpTables = async () => {
  // Drop people-related tables (cleanup migration)
  await vmpPool.query(`
    DROP TABLE IF EXISTS user_activities CASCADE;
    DROP TABLE IF EXISTS person_activities CASCADE;
    DROP TABLE IF EXISTS attendance_records CASCADE;
    DROP TABLE IF EXISTS attendance_sessions CASCADE;
    DROP TABLE IF EXISTS tasks CASCADE;
    DROP TABLE IF EXISTS notifications CASCADE;
    DROP TABLE IF EXISTS preaching_settings CASCADE;
    DROP TABLE IF EXISTS people CASCADE;
  `).catch(err => console.error('Cleanup drop failed:', err.message));

  // 1. user_cache
  await vmpPool.query(`
    CREATE TABLE IF NOT EXISTS user_cache (
      id INTEGER PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      full_name VARCHAR(255),
      roles JSONB DEFAULT '[]',
      is_active BOOLEAN DEFAULT true
    )
  `);

  // 2. events
  await vmpPool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      event_date TIMESTAMP,
      created_by INTEGER REFERENCES user_cache(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // 3. departments
  await vmpPool.query(`
    CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // 4. department_members
  await vmpPool.query(`
    CREATE TABLE IF NOT EXISTS department_members (
      id SERIAL PRIMARY KEY,
      department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES user_cache(id) ON DELETE CASCADE,
      role VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  console.log('VMP Tables ready');
  await syncUserCache();
};

async function syncUserCache() {
  try {
    const { rows: users } = await corePool.query(`
      SELECT u.id, u.email, u.full_name, u.is_active,
             COALESCE(json_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '[]') as roles
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      GROUP BY u.id
    `);

    for (const u of users) {
      await vmpPool.query(`
        INSERT INTO user_cache (id, email, full_name, roles, is_active)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          roles = EXCLUDED.roles,
          is_active = EXCLUDED.is_active
      `, [u.id, u.email, u.full_name, JSON.stringify(u.roles), u.is_active]);
    }
    console.log(`Successfully synced ${users.length} users to VMP user_cache`);
  } catch (err) {
    console.error('Failed to sync user cache:', err.message);
  }
}

module.exports = { createVmpTables, syncUserCache };
