const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/auth.controller');
const { registerValidator, loginValidator } = require('../validators/auth.validator');
const { handleValidationErrors } = require('../middlewares/validate.middleware');
const { protect } = require('../middlewares/auth.middleware');

// Rutas públicas
router.post('/register', registerValidator, handleValidationErrors, register);
router.post('/login', loginValidator, handleValidationErrors, login);

// Rutas protegidas
router.get('/me', protect, getMe);

module.exports = router;
