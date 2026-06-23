const router = require('express').Router();
const { register, login, me, changePassword } = require('../controllers/authController');
const { sendOTP, verifyOTP, resetPassword } = require('../controllers/passwordController');
const verifyToken = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, me);
router.put('/change-password', verifyToken, changePassword);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

module.exports = router;
