const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const pool = require('../config/db');

router.get('/test', verifyToken, requireAdmin, (req, res) => {
  res.json({ message: 'Admin access confirmed', user: req.user });
});

router.get('/roles', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name FROM roles ORDER BY id');
    res.json(rows);
  } catch { res.status(500).json({ message: 'Server error' }); }
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

router.get('/modules', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, description, active, created_at FROM modules ORDER BY name');
    res.json(rows);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.post('/modules', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, active } = req.body;
    if (!name) return res.status(400).json({ message: 'Module name is required' });
    const { rows } = await pool.query(
      'INSERT INTO modules (name, description, active) VALUES ($1, $2, $3) RETURNING id, name, description, active, created_at',
      [name, description || null, active !== false]
    );
    const log = require('../config/audit');
    log(req.user.id, 'create_module', 'module', rows[0].id, { name }, req.ip);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Module already exists' });
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/modules/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE modules SET active = NOT active WHERE id = $1 RETURNING id, name, active',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Module not found' });
    const log = require('../config/audit');
    log(req.user.id, rows[0].active ? 'activate_module' : 'deactivate_module', 'module', Number(req.params.id), null, req.ip);
    res.json(rows[0]);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.delete('/modules/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM modules WHERE id = $1 RETURNING id, name', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Module not found' });
    const log = require('../config/audit');
    log(req.user.id, 'delete_module', 'module', Number(req.params.id), { name: rows[0].name }, req.ip);
    res.json({ message: 'Module deleted' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
