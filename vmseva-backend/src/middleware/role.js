const pool = require('../config/db');

const authorizeRole = (...roles) => async (req, res, next) => {
  const { rows } = await pool.query(
    `SELECT r.name FROM roles r
     JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = $1`,
    [req.user.id]
  );
  const userRoles = rows.map(r => r.name);
  if (roles.some(role => userRoles.includes(role))) return next();
  res.status(403).json({ message: 'Access denied' });
};

const requireAdmin = authorizeRole('Admin');

module.exports = { authorizeRole, requireAdmin };
