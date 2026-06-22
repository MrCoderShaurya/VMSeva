const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const rolesRoutes = require('./routes/roles.routes');

const app = express();

app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://vmseva.onrender.com',
        'https://vmseva-1.onrender.com'
    ],
    credentials: true
}));
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.json({ message: 'Voice Management API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/roles', rolesRoutes);

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
    console.error('Error:', err);
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
