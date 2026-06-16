const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/users.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { handleValidationErrors } = require('../middlewares/validate.middleware');
const { createUserValidator } = require('../validators/users.validator');

// Todas las rutas requieren autenticación y rol ADMIN
router.use(protect);
router.use(authorize('ADMIN'));

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', createUserValidator, handleValidationErrors, createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;