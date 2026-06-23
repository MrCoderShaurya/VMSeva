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
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowed = [
        process.env.FRONTEND_URL,
        'http://localhost:5173',
        'http://localhost:3000',
    ].filter(Boolean);

    if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
        res.header('Access-Control-Allow-Origin', origin || '*');
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.json({ message: 'Voice Management API is running' }));

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
