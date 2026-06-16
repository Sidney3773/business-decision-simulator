const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/auth.controller');
const { loginValidator } = require('../validators/auth.validator');
const { handleValidationErrors } = require('../middlewares/validate.middleware');
const { protect } = require('../middlewares/auth.middleware');

// ── Registro público deshabilitado ──────────────────────────────────────────
// Los usuarios (profesores y estudiantes) ahora son creados únicamente por el
// administrador desde el panel "Gestión de Usuarios" (POST /api/users).

// Rutas públicas
router.post('/login', loginValidator, handleValidationErrors, login);

// Rutas protegidas
router.get('/me', protect, getMe);

module.exports = router;