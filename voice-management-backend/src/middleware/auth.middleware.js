const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token', reason: error.message });
    }
};

// Check if user has at least one of the required roles
const authorizeRole = (...roles) => (req, res, next) => {
    const userRoles = req.user.roles || [];
    const hasRole = roles.some(r => userRoles.includes(r));
    if (!hasRole) {
        return res.status(403).json({ message: 'Access denied: insufficient role' });
    }
    next();
};

const requireAdmin = (req, res, next) => {
    const rawRoles = req.user.roles || [];
    const userRoles = rawRoles.map(r => {
        if (typeof r === 'string') return r.toLowerCase();
        if (r && typeof r === 'object') return (r.name || r.role_name || '').toLowerCase();
        return '';
    });
    if (!userRoles.includes('admin')) {
        return res.status(403).json({ message: 'Access denied: admins only' });
    }
    next();
};

module.exports = { authenticateToken, authorizeRole, requireAdmin };