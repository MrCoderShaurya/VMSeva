const pool = require('../config/db');
const { sendMail } = require('../config/mailer');
const bcrypt = require('bcrypt');

const isStrongPassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(password);

const forgotPassword = async (email) => {
    const result = await pool.query(
        'SELECT id, email FROM users WHERE email = $1',
        [email.toLowerCase()]
    );
    if (result.rows.length === 0) return null;

    const user = result.rows[0];
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query('DELETE FROM password_resets WHERE user_id = $1', [user.id]);
    await pool.query(
        'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, otp, expiresAt]
    );

    try {
        await sendMail({
            to: user.email,
            subject: 'Your password reset code',
            text: `Your password reset OTP is: ${otp}. It expires in 15 minutes.`,
            html: `<p>Your password reset OTP is: <strong>${otp}</strong>. It expires in 15 minutes.</p>`
        });
    } catch (err) {
        console.error('Failed to send OTP email:', err);
    }
};

const verifyResetOtp = async (email, otp) => {
    const result = await pool.query(
        `SELECT pr.id FROM password_resets pr
         JOIN users u ON u.id = pr.user_id
         WHERE u.email = $1 AND pr.token = $2 AND pr.expires_at > NOW()`,
        [email.toLowerCase(), otp]
    );
    if (result.rows.length === 0) {
        throw { status: 400, message: 'Invalid or expired OTP' };
    }
};

const resetPassword = async (email, otp, newPassword) => {
    if (!isStrongPassword(newPassword)) {
        throw { status: 400, message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol' };
    }

    const result = await pool.query(
        `SELECT pr.* FROM password_resets pr
         JOIN users u ON u.id = pr.user_id
         WHERE u.email = $1 AND pr.token = $2 AND pr.expires_at > NOW()`,
        [email.toLowerCase(), otp]
    );
    if (result.rows.length === 0) {
        throw { status: 400, message: 'Invalid or expired OTP' };
    }

    const reset = result.rows[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, reset.user_id]);
    await pool.query('DELETE FROM password_resets WHERE user_id = $1', [reset.user_id]);
};

module.exports = { forgotPassword, verifyResetOtp, resetPassword };
