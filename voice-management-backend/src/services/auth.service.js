const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendMail } = require('../config/mailer');

const isStrongPassword = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(password);

const registerUser = async (email, password) => {
  if (!isStrongPassword(password)) {
    throw { status: 400, message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol' };
  }

  const verif = await pool.query(
    'SELECT id FROM email_verifications WHERE email = $1 AND verified = TRUE AND expires_at > NOW()',
    [email.toLowerCase()]
  );
  if (verif.rows.length === 0) {
    throw { status: 403, message: 'Email not verified. Please verify your email first.' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
    [email.toLowerCase(), hashedPassword]
  );

  await pool.query('DELETE FROM email_verifications WHERE email = $1', [email.toLowerCase()]);

  const user = result.rows[0];

  // Auto-assign admin role
  const adminRole = await pool.query('SELECT id FROM roles WHERE LOWER(role_name) = $1', ['admin']);
  if (adminRole.rows.length > 0) {
    await pool.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [user.id, adminRole.rows[0].id]
    );
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, roles: ['admin'] },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { user, token };
};

const loginUser = async (email, password) => {
    const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
    );
    if (result.rows.length === 0) {
        throw { status: 401, message: 'Invalid email or password' };
    }

    const user = result.rows[0];
    if (!user.is_active) {
        throw { status: 403, message: 'Account is deactivated' };
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
        throw { status: 401, message: 'Invalid email or password' };
    }

    const rolesResult = await pool.query(
        `SELECT r.role_name FROM roles r
         JOIN user_roles ur ON ur.role_id = r.id
         WHERE ur.user_id = $1`,
        [user.id]
    );
    const roles = rolesResult.rows.map(r => (r.role_name || '').toLowerCase());

    const token = jwt.sign(
        { userId: user.id, email: user.email, roles },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    return { token, user: { id: user.id, email: user.email, roles } };
};

const getMe = async (userId) => {
    const result = await pool.query(
        'SELECT id, email, is_active FROM users WHERE id = $1',
        [userId]
    );
    if (result.rows.length === 0) {
        throw { status: 404, message: 'User not found' };
    }

    const rolesResult = await pool.query(
        `SELECT r.id, r.role_name AS name FROM roles r
         JOIN user_roles ur ON ur.role_id = r.id
         WHERE ur.user_id = $1`,
        [userId]
    );

    return { ...result.rows[0], roles: rolesResult.rows };
};

const changePassword = async (userId, currentPassword, newPassword) => {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
        throw { status: 404, message: 'User not found' };
    }

    if (!isStrongPassword(newPassword)) {
        throw { status: 400, message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol' };
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
        throw { status: 401, message: 'Current password is incorrect' };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, userId]);
};

const sendEmailOtp = async (email) => {
  // Check if email already registered
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length > 0) {
    throw { status: 409, message: 'Email already registered' };
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await pool.query('DELETE FROM email_verifications WHERE email = $1', [email.toLowerCase()]);
  await pool.query(
    'INSERT INTO email_verifications (email, otp, expires_at) VALUES ($1, $2, $3)',
    [email.toLowerCase(), otp, expiresAt]
  );

  try {
    await sendMail({
      to: email,
      subject: 'Your email verification code',
      text: `Your verification code is: ${otp}. It expires in 10 minutes.`,
      html: `<p>Your verification code is: <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`
    });
  } catch (err) {
    console.error('Failed to send OTP email:', err.message);
  }

  return process.env.NODE_ENV !== 'production' ? otp : null;
};

const verifyEmailOtp = async (email, otp) => {
  const result = await pool.query(
    'SELECT id FROM email_verifications WHERE email = $1 AND otp = $2 AND expires_at > NOW()',
    [email.toLowerCase(), otp]
  );
  if (result.rows.length === 0) {
    throw { status: 400, message: 'Invalid or expired OTP' };
  }
  await pool.query(
    'UPDATE email_verifications SET verified = TRUE WHERE email = $1',
    [email.toLowerCase()]
  );
};

const forgotPassword = async (email) => {
    const result = await pool.query(
        'SELECT id, email FROM users WHERE email = $1',
        [email.toLowerCase()]
    );
    // Silently return null to avoid revealing whether email exists
    if (result.rows.length === 0) return null;

    const user = result.rows[0];

    // Generate a 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Remove any existing reset token for this user
    await pool.query('DELETE FROM password_resets WHERE user_id = $1', [user.id]);
    await pool.query(
        'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, otp, expiresAt]
    );

    // Send OTP email (best-effort)
    try {
        const subject = 'Your password reset code';
        const text = `Use the following code to reset your password: ${otp}. It expires in 15 minutes.`;
        const html = `<p>Use the following code to reset your password: <strong>${otp}</strong>.</p><p>This code expires in 15 minutes.</p>`;
        await sendMail({ to: user.email, subject, text, html });
    } catch (err) {
        console.error('Failed to send OTP email:', err && err.message ? err.message : err);
    }

    // For development convenience, return the OTP when not in production
    return process.env.NODE_ENV !== 'production' ? otp : null;
};

const resetPassword = async (token, newPassword) => {
    if (!isStrongPassword(newPassword)) {
        throw { status: 400, message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol' };
    }

    const result = await pool.query(
        'SELECT * FROM password_resets WHERE token = $1 AND expires_at > NOW()',
        [token]
    );
    if (result.rows.length === 0) {
        throw { status: 400, message: 'Invalid or expired reset token' };
    }

    const reset = result.rows[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, reset.user_id]);
    await pool.query('DELETE FROM password_resets WHERE token = $1', [token]);
};

module.exports = { registerUser, loginUser, getMe, changePassword, forgotPassword, resetPassword, sendEmailOtp, verifyEmailOtp };
