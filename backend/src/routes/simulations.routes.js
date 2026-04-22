const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  runSimulation,
  getUserSimulations,
  getSimulationById,
  getAllSimulations
} = require('../controllers/simulations.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { handleValidationErrors } = require('../middlewares/validate.middleware');

// Validador para ejecutar simulación
const runSimulationValidator = [
  body('scenarioId').isInt().withMessage('scenarioId debe ser un número entero'),
  body('decisionIds').isArray({ min: 1 }).withMessage('decisionIds debe ser un array con al menos una decisión'),
  body('timeTakenSeconds').optional().isInt({ min: 0 }).withMessage('timeTakenSeconds debe ser un número positivo')
];

// Todas las rutas requieren autenticación
router.use(protect);

// Ejecutar simulación (todos los roles)
router.post('/run', runSimulationValidator, handleValidationErrors, runSimulation);

// Obtener simulaciones de un usuario
router.get('/user/:userId', getUserSimulations);

// Obtener simulación por ID
router.get('/:id', getSimulationById);

// Obtener todas las simulaciones (ADMIN y TEACHER)
router.get('/', authorize('ADMIN', 'TEACHER'), getAllSimulations);

module.exports = router;
