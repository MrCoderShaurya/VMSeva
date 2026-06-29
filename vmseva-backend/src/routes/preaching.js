const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const preachingCtrl = require('../controllers/preachingController');
const vmpPool = require('../config/vmpDb');

// Preaching Access Middleware
const verifyPreachingAccess = async (req, res, next) => {
  try {
    const { rows } = await vmpPool.query('SELECT roles FROM user_cache WHERE id = $1', [req.user.id]);
    if (!rows.length) return res.status(403).json({ message: 'Access denied: user cache missing' });
    
    const roles = rows[0].roles || [];
    const isAuthorized = roles.some(role => {
      const r = role.toLowerCase();
      return r.includes('admin') || 
             r.includes('counselor') || 
             r.includes('counsellor') || 
             r.includes('coordinator') || 
             r.includes('internal manager') || 
             r.includes('im') || 
             r.includes('incharge') || 
             r.includes('in-charge') || 
             r.includes('ic') || 
             r.includes('assistant') ||
             r.includes('mentor') ||
             r.includes('frontliner');
    });

    if (isAuthorized) return next();
    res.status(403).json({ message: 'Access denied' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Protected routes (require token and preaching module access)
router.use(verifyToken);
router.use(verifyPreachingAccess);

// Events CRUD
router.get('/events', preachingCtrl.getEvents);
router.post('/events', preachingCtrl.createEvent);
router.put('/events/:id', preachingCtrl.updateEvent);
router.delete('/events/:id', preachingCtrl.deleteEvent);

// Departments CRUD
router.get('/events/:eventId/departments', preachingCtrl.getDepartments);
router.post('/events/:eventId/departments', preachingCtrl.createDepartment);
router.put('/departments/:id', preachingCtrl.updateDepartment);
router.delete('/departments/:id', preachingCtrl.deleteDepartment);

// Department Members Management
router.get('/departments/:id/members', preachingCtrl.getDepartmentMembers);
router.post('/departments/:id/members', preachingCtrl.addDepartmentMember);
router.delete('/departments/:id/members/:userId', preachingCtrl.removeDepartmentMember);

// User Cache for selectors (needed to assign members to departments)
router.get('/users', preachingCtrl.getUsersCache);

module.exports = router;
