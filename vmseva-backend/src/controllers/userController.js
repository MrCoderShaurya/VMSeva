const pool = require('../config/db');
const log = require('../config/audit');

const getUsers = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, full_name, is_active, created_at FROM users ORDER BY id'
    );
    res.json(rows);
  } catch { res.status(500).json({ message: 'Server error' }); }
};

const getUserById = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, full_name, is_active, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });

    const { rows: roleRows } = await pool.query(
      `SELECT r.id, r.name FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [req.params.id]
    );
    res.json({ ...rows[0], roles: roleRows });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

const updateUser = async (req, res) => {
  try {
    const { full_name, email } = req.body;
    const { rows } = await pool.query(
      `UPDATE users SET full_name = COALESCE($1, full_name), email = COALESCE($2, email)
       WHERE id = $3 RETURNING id, email, full_name`,
      [full_name, email?.toLowerCase(), req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    log(req.user.id, 'update_user', 'user', Number(req.params.id), { full_name, email }, req.ip);
    res.json(rows[0]);
  } catch { res.status(500).json({ message: 'Server error' }); }
};

const toggleStatus = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, is_active',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    log(req.user.id, rows[0].is_active ? 'activate_user' : 'deactivate_user', 'user', Number(req.params.id), null, req.ip);
    res.json(rows[0]);
  } catch { res.status(500).json({ message: 'Server error' }); }
};

const assignRole = async (req, res) => {
  try {
    const { role_id } = req.body;
    if (!role_id) return res.status(400).json({ message: 'role_id required' });
    await pool.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
      [req.params.id, role_id]
    );
    log(req.user.id, 'assign_role', 'user', Number(req.params.id), { role_id }, req.ip);
    res.status(201).json({ message: 'Role assigned' });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Role already assigned' });
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserRoles = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.id, r.name FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [req.params.id]
    );
    res.json(rows);
  } catch { res.status(500).json({ message: 'Server error' }); }
};

const removeRole = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [req.params.id, req.params.roleId]
    );
    log(req.user.id, 'remove_role', 'user', Number(req.params.id), { role_id: Number(req.params.roleId) }, req.ip);
    res.json({ message: 'Role removed' });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

module.exports = { getUsers, getUserById, updateUser, toggleStatus, assignRole, getUserRoles, removeRole };
