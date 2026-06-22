const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Step 5: Admin test route
router.get('/test', authenticateToken, requireAdmin, (req, res) => {
    res.json({ message: 'Welcome, Admin!', user: req.user });
});

module.exports = router;
