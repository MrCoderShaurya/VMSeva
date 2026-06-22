const authService = require('../services/auth.service');

const handleError = (res, err) => {
    const status = err.status || 500;
    const message = err.message || 'Internal server error';
    res.status(status).json({ message });
};

const register = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const { user, token } = await authService.registerUser(email, password);
        res.status(201).json({ message: 'User registered successfully', user, token });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Email already registered' });
        }
        handleError(res, err);
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const result = await authService.loginUser(email, password);
        res.json({ message: 'Login successful', ...result });
    } catch (err) {
        handleError(res, err);
    }
};

const getMe = async (req, res) => {
    try {
        const user = await authService.getMe(req.user.userId);
        res.json({ user });
    } catch (err) {
        handleError(res, err);
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'currentPassword and newPassword are required' });
        }
        await authService.changePassword(req.user.userId, currentPassword, newPassword);
        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        handleError(res, err);
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });
        const token = await authService.forgotPassword(email);
        res.json({
            message: 'If that email is registered, a reset link has been sent.',
            // Only expose reset token outside production (for dev/testing convenience)
            ...(process.env.NODE_ENV !== 'production' && token ? { resetToken: token } : {})
        });
    } catch (err) {
        handleError(res, err);
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ error: 'token and newPassword are required' });
        }
        await authService.resetPassword(token, newPassword);
        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        handleError(res, err);
    }
};

const sendEmailOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });
        const otp = await authService.sendEmailOtp(email);
        res.json({
            message: 'OTP sent to email',
            ...(process.env.NODE_ENV !== 'production' && otp ? { otp } : {})
        });
    } catch (err) {
        handleError(res, err);
    }
};

const verifyEmailOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });
        await authService.verifyEmailOtp(email, otp);
        res.json({ message: 'Email verified successfully' });
    } catch (err) {
        handleError(res, err);
    }
};

module.exports = { register, login, getMe, changePassword, forgotPassword, resetPassword, sendEmailOtp, verifyEmailOtp };
