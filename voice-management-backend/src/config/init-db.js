const pool = require('./db');

const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS roles (
                id SERIAL PRIMARY KEY,
                role_name TEXT UNIQUE NOT NULL
            )
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_roles (
                user_id INT REFERENCES users(id) ON DELETE CASCADE,
                role_id INT REFERENCES roles(id) ON DELETE CASCADE,
                PRIMARY KEY (user_id, role_id)
            )
        `);
        await pool.query(`INSERT INTO roles (role_name) VALUES ('admin'), ('user') ON CONFLICT DO NOTHING`);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS password_resets (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id) ON DELETE CASCADE,
                token TEXT UNIQUE NOT NULL,
                expires_at TIMESTAMPTZ NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS email_verifications (
                id SERIAL PRIMARY KEY,
                email TEXT NOT NULL,
                otp TEXT NOT NULL,
                verified BOOLEAN DEFAULT FALSE,
                expires_at TIMESTAMPTZ NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        console.log('Database tables initialized');
    } catch (err) {
        console.error('Failed to initialize database tables:', err.message);
    }
};

module.exports = initDb;
