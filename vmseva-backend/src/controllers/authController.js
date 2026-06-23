const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const sendMail = require('../config/mailer');
const log = require('../config/audit');

const register = async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    // Check OTP was verified
    const { rows: otpRows } = await pool.query(
      'SELECT id FROM otp_verifications WHERE email = $1 AND verified = true',
      [email.toLowerCase()]
    );
    if (!otpRows.length) return res.status(403).json({ message: 'Email not verified. Please verify OTP first.' });

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length) return res.status(409).json({ message: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name',
      [email.toLowerCase(), password_hash, full_name]
    );

    // Cleanup OTP record
    await pool.query('DELETE FROM otp_verifications WHERE email = $1', [email.toLowerCase()]);

    log(rows[0].id, 'register', 'user', rows[0].id, { email: rows[0].email }, req.ip);

    sendMail({
      to: email.toLowerCase(),
      subject: 'Welcome to VMSeva',
      html: `<h2>Welcome${full_name ? ', ' + full_name : ''}!</h2>
             <p>Your account has been created successfully.</p>`,
    }).catch(() => {});

    res.status(201).json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = rows[0];

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.is_active) return res.status(403).json({ message: 'Account deactivated' });
    if (!(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ message: 'Invalid credentials' });

    log(user.id, 'login', 'user', user.id, null, req.ip);

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const me = async (req, res) => {
  try {
    const { rows: userRows } = await pool.query(
      'SELECT id, email, full_name, is_active FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!userRows.length) return res.status(404).json({ message: 'User not found' });

    const { rows: roleRows } = await pool.query(
      `SELECT r.id, r.name FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [req.user.id]
    );
    res.json({ ...userRows[0], roles: roleRows });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) return res.status(400).json({ message: 'Both passwords required' });

    const { rows } = await pool.query('SELECT email, password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!(await bcrypt.compare(old_password, rows[0].password_hash)))
      return res.status(401).json({ message: 'Incorrect old password' });

    const password_hash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, req.user.id]);

    log(req.user.id, 'change_password', 'user', req.user.id, null, req.ip);

    sendMail({
      to: rows[0].email,
      subject: 'VMSeva — Password Changed',
      html: `<p>Your password was changed successfully.</p>
             <p>If you did not do this, contact your administrator immediately.</p>`,
    }).catch(() => {});

    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login, me, changePassword };
