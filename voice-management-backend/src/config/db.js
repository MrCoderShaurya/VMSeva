const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

const pool = new Pool({
    // Prioritize the full string if available, otherwise fall back to separate keys
    connectionString: process.env.DATABASE_URL,
    host: !process.env.DATABASE_URL ? (process.env.DB_HOST || 'localhost') : undefined,
    port: !process.env.DATABASE_URL ? (process.env.DB_PORT || 5432) : undefined,
    user: !process.env.DATABASE_URL ? (process.env.DB_USER || 'postgres') : undefined,
    password: !process.env.DATABASE_URL ? process.env.DB_PASSWORD : undefined,
    database: !process.env.DATABASE_URL ? (process.env.DB_NAME || 'postgres') : undefined,
    
    // Render requires SSL for cloud connections but it must be disabled for local development
    ssl: isProduction ? { rejectUnauthorized: true } : false
});

module.exports = pool;
