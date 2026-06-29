const vmpPool = require('../config/vmpDb');

// ==========================================
// 1. Events CRUD
// ==========================================
exports.getEvents = async (req, res) => {
  try {
    const { rows } = await vmpPool.query('SELECT * FROM events ORDER BY event_date DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { title, description, event_date } = req.body;
    const userId = req.user.id;

    if (!title) return res.status(400).json({ message: 'Title is required' });

    const { rows } = await vmpPool.query(`
      INSERT INTO events (title, description, event_date, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [
      title, 
      description || null, 
      event_date || null, 
      userId
    ]);

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, event_date } = req.body;

    const { rows } = await vmpPool.query(`
      UPDATE events SET
        title = $1,
        description = $2,
        event_date = $3
      WHERE id = $4
      RETURNING *
    `, [title, description || null, event_date || null, id]);

    if (!rows.length) return res.status(404).json({ message: 'Event not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await vmpPool.query('DELETE FROM events WHERE id = $1', [id]);
    if (!rowCount) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==========================================
// 2. Department Management (with advanced sorting algorithms)
// ==========================================
exports.getDepartments = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { sortBy = 'name', order = 'asc' } = req.query;

    const allowedSortFields = ['name', 'membersCount', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    let query = `
      SELECT d.*, COALESCE(COUNT(dm.id), 0)::int as members_count
      FROM departments d
      LEFT JOIN department_members dm ON dm.department_id = d.id
      WHERE d.event_id = $1
      GROUP BY d.id
    `;

    if (sortField === 'name') {
      query += ` ORDER BY d.name ${sortOrder}`;
    } else if (sortField === 'membersCount') {
      query += ` ORDER BY members_count ${sortOrder}`;
    } else if (sortField === 'createdAt') {
      query += ` ORDER BY d.created_at ${sortOrder}`;
    }

    const { rows } = await vmpPool.query(query, [eventId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, description } = req.body;

    if (!name) return res.status(400).json({ message: 'Name is required' });

    const { rows } = await vmpPool.query(`
      INSERT INTO departments (event_id, name, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [eventId, name, description || null]);

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const { rows } = await vmpPool.query(`
      UPDATE departments SET
        name = $1,
        description = $2
      WHERE id = $3
      RETURNING *
    `, [name, description || null, id]);

    if (!rows.length) return res.status(404).json({ message: 'Department not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await vmpPool.query('DELETE FROM departments WHERE id = $1', [id]);
    if (!rowCount) return res.status(404).json({ message: 'Department not found' });
    res.json({ message: 'Department deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==========================================
// 3. Department Members Management
// ==========================================
exports.getDepartmentMembers = async (req, res) => {
  try {
    const { id: deptId } = req.params;
    const { rows } = await vmpPool.query(`
      SELECT dm.*, u.full_name, u.email
      FROM department_members dm
      JOIN user_cache u ON u.id = dm.user_id
      WHERE dm.department_id = $1
      ORDER BY u.full_name ASC
    `, [deptId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addDepartmentMember = async (req, res) => {
  try {
    const { id: deptId } = req.params;
    const { user_id, role } = req.body;

    if (!user_id) return res.status(400).json({ message: 'User ID is required' });

    // Verify user exists in cache
    const { rows: cacheRows } = await vmpPool.query('SELECT email FROM user_cache WHERE id = $1', [user_id]);
    if (!cacheRows.length) return res.status(404).json({ message: 'User not found in system cache' });

    const { rows } = await vmpPool.query(`
      INSERT INTO department_members (department_id, user_id, role)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING
      RETURNING *
    `, [deptId, user_id, role || null]);

    res.status(201).json(rows[0] || { message: 'Already assigned' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeDepartmentMember = async (req, res) => {
  try {
    const { id: deptId, userId } = req.params;
    await vmpPool.query('DELETE FROM department_members WHERE department_id = $1 AND user_id = $2', [deptId, userId]);
    res.json({ message: 'Member removed from department' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==========================================
// 4. Users Cache for Selectors
// ==========================================
exports.getUsersCache = async (req, res) => {
  try {
    const { rows } = await vmpPool.query(`
      SELECT id, email, full_name, roles 
      FROM user_cache 
      WHERE is_active = true 
      ORDER BY full_name ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
