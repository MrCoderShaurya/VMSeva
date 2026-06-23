const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const rolesRoutes = require('./routes/roles.routes');

const app = express();

app.set('trust proxy', 1);
app.use(helmet());

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

const ALLOWED_ORIGINS = [
    'https://vmseva-1.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.json({ message: 'Voice Management API' }));

app.get('/debug', async (req, res) => {
    const { Pool } = require('pg');
    const nodemailer = require('nodemailer');

    // DB check
    let dbStatus = 'ok';
    let dbError = null;
    try {
        const pool = require('./config/db');
        await pool.query('SELECT NOW()');
    } catch (e) {
        dbStatus = 'error';
        dbError = e.message;
    }

    // Mailer check
    let mailerStatus = 'ok';
    let mailerError = null;
    try {
        const t = nodemailer.createTransport({
            host: 'smtp.gmail.com', port: 587, secure: false,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
            tls: { rejectUnauthorized: false }
        });
        await t.verify();
    } catch (e) {
        mailerStatus = 'error';
        mailerError = e.message;
    }

    res.json({
        db: { status: dbStatus, error: dbError },
        mailer: { status: mailerStatus, error: mailerError },
        jwt: { secret_set: !!process.env.JWT_SECRET, length: process.env.JWT_SECRET?.length },
        env: { NODE_ENV: process.env.NODE_ENV, SMTP_USER: process.env.SMTP_USER }
    });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/roles', rolesRoutes);

app.use((err, req, res, next) => {
    console.error('Error:', err);
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
