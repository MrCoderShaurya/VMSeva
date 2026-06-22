const pool = require('./db');

const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT,
                role TEXT DEFAULT 'user',
                is_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
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
