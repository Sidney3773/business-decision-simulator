const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getScenarios,
  getScenarioById,
  createScenario,
  updateScenario,
  deleteScenario
} = require('../controllers/scenarios.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { handleValidationErrors } = require('../middlewares/validate.middleware');

// Validadores
const createScenarioValidator = [
  body('title').trim().notEmpty().withMessage('El título es requerido'),
  body('description').trim().notEmpty().withMessage('La descripción es requerida'),
  body('difficulty').isIn(['EASY', 'MEDIUM', 'HARD']).withMessage('Dificultad inválida'),
  body('initialBudget').isFloat({ min: 0 }).withMessage('Presupuesto inicial debe ser mayor a 0'),
  body('timeLimitMinutes').isInt({ min: 1 }).withMessage('Tiempo límite debe ser mayor a 0'),
  body('decisions').isArray({ min: 1 }).withMessage('Debe incluir al menos una decisión')
];

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas de lectura (todos los roles)
router.get('/', getScenarios);
router.get('/:id', getScenarioById);

// Rutas de escritura (TEACHER y ADMIN)
router.post('/', authorize('TEACHER', 'ADMIN'), createScenarioValidator, handleValidationErrors, createScenario);
router.put('/:id', authorize('TEACHER', 'ADMIN'), updateScenario);
router.delete('/:id', authorize('TEACHER', 'ADMIN'), deleteScenario);

module.exports = router;
