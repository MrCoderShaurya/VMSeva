const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const pool = require('../config/db');

router.get('/test', verifyToken, requireAdmin, (req, res) => {
  res.json({ message: 'Admin access confirmed', user: req.user });
});

router.get('/audit-logs', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT al.id, al.action, al.target_type, al.target_id,
             al.meta, al.ip_address, al.created_at,
             u.email AS performed_by
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ORDER BY al.created_at DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
