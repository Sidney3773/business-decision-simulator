const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/users.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
// Todas las rutas requieren autenticación y rol ADMIN
router.use(protect);
router.use(authorize('ADMIN'));
router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
module.exports = router;
