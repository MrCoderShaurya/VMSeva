const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const sendMail = require('../config/mailer');

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const { rows } = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // Always respond the same to prevent email enumeration
    if (!rows.length) return res.json({ message: 'If that email exists, a reset link was sent' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [token, expires, rows[0].id]
    );

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    await sendMail({
      to: email.toLowerCase(),
      subject: 'VMSeva — Password Reset',
      html: `<h2>Password Reset Request</h2>
             <p>Click the link below to reset your password. It expires in 1 hour.</p>
             <a href="${resetLink}" style="background:#e94560;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none">Reset Password</a>
             <p style="margin-top:16px">Or copy this link: ${resetLink}</p>
             <p>If you did not request this, ignore this email.</p>`,
    });

    res.json({ message: 'If that email exists, a reset link was sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password) return res.status(400).json({ message: 'Token and new password required' });

    const { rows } = await pool.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );
    if (!rows.length) return res.status(400).json({ message: 'Invalid or expired token' });

    const password_hash = await bcrypt.hash(new_password, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [password_hash, rows[0].id]
    );

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { forgotPassword, resetPassword };
