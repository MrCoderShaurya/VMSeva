const pool = require('../config/db');

const log = (user_id, action, target_type = null, target_id = null, meta = null, ip_address = null) => {
  pool.query(
    `INSERT INTO audit_logs (user_id, action, target_type, target_id, meta, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [user_id, action, target_type, target_id, meta ? JSON.stringify(meta) : null, ip_address]
  ).catch(() => {});
};

module.exports = log;
