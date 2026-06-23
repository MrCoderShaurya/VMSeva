const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const {
  getUsers, getUserById, updateUser, toggleStatus,
  assignRole, getUserRoles, removeRole
} = require('../controllers/userController');

router.use(verifyToken, requireAdmin);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.patch('/:id/status', toggleStatus);
router.post('/:id/roles', assignRole);
router.get('/:id/roles', getUserRoles);
router.delete('/:id/roles/:roleId', removeRole);

module.exports = router;
