const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const sendMail = require('../config/mailer');

const makeOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /auth/send-otp
const sendOTP = async (req, res) => {
  try {
    const { email, type } = req.body;
    if (!email || !type) return res.status(400).json({ message: 'Email and type required' });

    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);

    if (type === 'register' && rows.length)
      return res.status(409).json({ message: 'Email already registered' });

    if (type === 'forgot' && !rows.length)
      return res.json({ message: 'If that email exists, an OTP was sent' });

    const otp = makeOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query('DELETE FROM otp_verifications WHERE email = $1', [email.toLowerCase()]);
    await pool.query(
      'INSERT INTO otp_verifications (email, otp, expires_at, verified) VALUES ($1, $2, $3, false)',
      [email.toLowerCase(), otp, expires]
    );

    res.json({ message: 'OTP sent successfully' });

    sendMail({
      to: email.toLowerCase(),
      subject: 'VMSeva — Your OTP Code',
      html: `
        <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:32px;background:#000;border-radius:12px">
          <h2 style="color:#fff;margin-bottom:8px">VMSeva</h2>
          <p style="color:#aaa;margin-bottom:24px">
            ${type === 'register' ? 'Verify your email to create your account' : 'Use this OTP to reset your password'}
          </p>
          <div style="background:#111;border:1px solid #333;border-radius:8px;padding:24px;text-align:center">
            <p style="color:#aaa;font-size:13px;margin-bottom:8px">Your OTP code</p>
            <h1 style="color:#fff;font-size:40px;letter-spacing:12px;margin:0">${otp}</h1>
          </div>
          <p style="color:#666;font-size:12px;margin-top:16px">Expires in 10 minutes. Do not share this code.</p>
        </div>
      `,
    }).catch(err => console.error('Mail error:', err.message));
  } catch (err) {
    console.error('sendOTP error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// POST /auth/verify-otp
const verifyOTP = async (req, res) => {
  try {
    const { email, otp, type } = req.body;
    if (!email || !otp || !type) return res.status(400).json({ message: 'Email, OTP and type required' });

    const { rows } = await pool.query(
      'SELECT id FROM otp_verifications WHERE email = $1 AND otp = $2 AND expires_at > NOW()',
      [email.toLowerCase(), otp]
    );
    if (!rows.length) return res.status(400).json({ message: 'Invalid or expired OTP' });

    await pool.query('UPDATE otp_verifications SET verified = true WHERE id = $1', [rows[0].id]);
    return res.json({ message: 'OTP verified' });
  } catch (err) {
    console.error('verifyOTP error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// POST /auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, new_password } = req.body;
    if (!email || !new_password) return res.status(400).json({ message: 'Email and new password required' });

    const { rows } = await pool.query(
      'SELECT id FROM otp_verifications WHERE email = $1 AND verified = true',
      [email.toLowerCase()]
    );
    if (!rows.length) return res.status(400).json({ message: 'OTP not verified' });

    const password_hash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [password_hash, email.toLowerCase()]);
    await pool.query('DELETE FROM otp_verifications WHERE email = $1', [email.toLowerCase()]);

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { sendOTP, verifyOTP, resetPassword };
