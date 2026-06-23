const pool = require('../config/db');

const createTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255),
      is_active BOOLEAN DEFAULT true,
      reset_token VARCHAR(255),
      reset_token_expires TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_roles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      assigned_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, role_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      action VARCHAR(100) NOT NULL,
      target_type VARCHAR(50),
      target_id INTEGER,
      meta JSONB,
      ip_address VARCHAR(45),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS otp_verifications (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      otp VARCHAR(6) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      verified BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS trusted_devices (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      device_token VARCHAR(64) UNIQUE NOT NULL,
      user_agent TEXT,
      ip_address VARCHAR(45),
      created_at TIMESTAMP DEFAULT NOW(),
      last_used_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    INSERT INTO roles (name) VALUES
      ('Admin'),
      ('Overall Coordinator'),
      ('Internal Manager'),
      ('Counselor'),
      ('Incharge'),
      ('Assistant')
    ON CONFLICT (name) DO NOTHING
  `);

  console.log('Tables ready');
};

module.exports = createTables;
