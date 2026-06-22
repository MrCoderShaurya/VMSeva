const express = require('express');
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

const isStrongPassword = (p) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(p);

// Admin direct-create user (bypasses OTP verification)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
        if (!isStrongPassword(password)) {
            return res.status(400).json({ error: 'Password must be 8+ chars with uppercase, lowercase, number, and symbol' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, is_active',
            [email.toLowerCase(), hashedPassword]
        );
        const user = result.rows[0];
        const userRole = await pool.query('SELECT id FROM roles WHERE LOWER(role_name) = $1', ['user']);
        if (userRole.rows.length > 0) {
            await pool.query(
                'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [user.id, userRole.rows[0].id]
            );
        }
        res.status(201).json(user);
    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'Email already registered' });
        res.status(500).json({ error: error.message });
    }
});

router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, is_active FROM users ORDER BY id');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Step 2: Get user by ID
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email FROM users WHERE id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Step 3: Assign role to user
router.post('/:id/roles', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { roleId } = req.body;
        if (!roleId) {
            return res.status(400).json({ error: 'roleId is required' });
        }

        await pool.query(
            'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [req.params.id, roleId]
        );

        res.status(201).json({ message: 'Role assigned successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Step 4: Get roles for a user
router.get('/:id/roles', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT r.id, r.role_name AS name
             FROM roles r
             JOIN user_roles ur ON ur.role_id = r.id
             WHERE ur.user_id = $1`,
            [req.params.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove role from user
router.delete('/:id/roles/:roleId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
            [req.params.id, req.params.roleId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Role assignment not found' });
        }
        res.json({ message: 'Role removed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Hard delete user
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id, email',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully', user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user email
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'email is required' });
        }
        const result = await pool.query(
            'UPDATE users SET email = $1 WHERE id = $2 RETURNING id, email, is_active',
            [email.toLowerCase(), req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Soft delete / deactivate user
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { is_active } = req.body;
        if (typeof is_active !== 'boolean') {
            return res.status(400).json({ error: 'is_active (boolean) is required' });
        }
        const result = await pool.query(
            'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, email, is_active',
            [is_active, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
