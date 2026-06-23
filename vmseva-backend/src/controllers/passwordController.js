const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const sendMail = require('../config/mailer');

// Generate 6-digit OTP
const makeOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /auth/send-otp  — used by register & forgot-password
const sendOTP = async (req, res) => {
  try {
    const { email, type } = req.body; // type: 'register' | 'forgot'
    if (!email) return res.status(400).json({ message: 'Email required' });

    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);

    if (type === 'register' && rows.length)
      return res.status(409).json({ message: 'Email already registered' });

    if (type === 'forgot' && !rows.length)
      return res.json({ message: 'If that email exists, an OTP was sent' });

    const otp = makeOTP();
    const expires = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes

    // Store OTP in reset_token columns (reusing existing columns)
    if (type === 'forgot') {
      await pool.query(
        'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
        [otp, expires, email.toLowerCase()]
      );
    } else {
      // For register — store in a temp table (users doesn't exist yet)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS otp_verifications (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          otp VARCHAR(6) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          verified BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await pool.query('DELETE FROM otp_verifications WHERE email = $1', [email.toLowerCase()]);
      await pool.query(
        'INSERT INTO otp_verifications (email, otp, expires_at) VALUES ($1, $2, $3)',
        [email.toLowerCase(), otp, expires]
      );
    }

    await sendMail({
      to: email.toLowerCase(),
      subject: 'VMSeva — Your OTP Code',
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px;background:#000;border-radius:12px">
          <h2 style="color:#fff;margin-bottom:8px">VMSeva</h2>
          <p style="color:#aaa;margin-bottom:24px">${type === 'register' ? 'Verify your email to create your account' : 'Use this OTP to reset your password'}</p>
          <div style="background:#111;border:1px solid #333;border-radius:8px;padding:24px;text-align:center">
            <p style="color:#aaa;font-size:13px;margin-bottom:8px">Your OTP code</p>
            <h1 style="color:#fff;font-size:40px;letter-spacing:12px;margin:0">${otp}</h1>
          </div>
          <p style="color:#666;font-size:12px;margin-top:16px">Expires in 10 minutes. Do not share this code.</p>
        </div>
      `,
    });

    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /auth/verify-otp
const verifyOTP = async (req, res) => {
  try {
    const { email, otp, type } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

    if (type === 'forgot') {
      const { rows } = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND reset_token = $2 AND reset_token_expires > NOW()',
        [email.toLowerCase(), otp]
      );
      if (!rows.length) return res.status(400).json({ message: 'Invalid or expired OTP' });
      // Mark as verified by updating token to a session token for reset
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 1000 * 60 * 15); // 15 min to reset
      await pool.query(
        'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
        [sessionToken, expires, email.toLowerCase()]
      );
      return res.json({ message: 'OTP verified', reset_token: sessionToken });
    } else {
      const { rows } = await pool.query(
        'SELECT id FROM otp_verifications WHERE email = $1 AND otp = $2 AND expires_at > NOW() AND verified = false',
        [email.toLowerCase(), otp]
      );
      if (!rows.length) return res.status(400).json({ message: 'Invalid or expired OTP' });
      await pool.query('UPDATE otp_verifications SET verified = true WHERE id = $1', [rows[0].id]);
      return res.json({ message: 'OTP verified' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /auth/forgot-password (kept for reset after OTP)
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });
    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (!rows.length) return res.json({ message: 'If that email exists, an OTP was sent' });
    res.json({ message: 'Use /send-otp endpoint' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /auth/reset-password
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

module.exports = { sendOTP, verifyOTP, forgotPassword, resetPassword };
