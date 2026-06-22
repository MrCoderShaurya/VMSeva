const express = require('express');
const pool = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middleware/auth.middleware');
const authController = require('../controllers/auth.controller');

const router = express.Router();

// Public auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/send-email-otp', authController.sendEmailOtp);
router.post('/verify-email-otp', authController.verifyEmailOtp);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// GET helper (dev convenience)
router.get('/login', (req, res) => {
    res.json({ message: 'Send a POST request to /api/auth/login with JSON body { "email", "password" }' });
});

// Lookup user by email (dev utility)
router.get('/user/:email', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email FROM users WHERE email = $1',
            [req.params.email]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Protected routes
router.get('/me', authenticateToken, authController.getMe);
router.post('/change-password', authenticateToken, authController.changePassword);
router.get('/admin', authenticateToken, authorizeRole('admin'), (req, res) => {
    res.json({ message: 'Welcome admin', user: req.user });
});

module.exports = router;
