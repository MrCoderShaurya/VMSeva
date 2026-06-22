const express = require('express');
const pool = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// List all roles
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM roles ORDER BY id');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new role
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { role_name } = req.body;
        if (!role_name) {
            return res.status(400).json({ error: 'role_name is required' });
        }
        const result = await pool.query(
            'INSERT INTO roles (role_name) VALUES ($1) RETURNING *',
            [role_name.toLowerCase()]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.constraint === 'unique_role_name') {
            return res.status(409).json({ error: 'Role already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

// Update a role name
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { role_name } = req.body;
        if (!role_name) {
            return res.status(400).json({ error: 'role_name is required' });
        }
        const result = await pool.query(
            'UPDATE roles SET role_name = $1 WHERE id = $2 RETURNING *',
            [role_name.toLowerCase(), req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Role not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        if (error.constraint === 'unique_role_name') {
            return res.status(409).json({ error: 'Role name already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

// Delete a role (cascades from user_roles via FK)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM roles WHERE id = $1 RETURNING *',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Role not found' });
        }
        res.json({ message: 'Role deleted successfully', role: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
