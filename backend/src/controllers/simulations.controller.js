const db = require('../models');
const SimulationEngine = require('../services/simulation.service');

/**
 * @desc    Ejecutar simulación
 * @route   POST /api/simulations/run
 * @access  Private
 */
const runSimulation = async (req, res, next) => {
  try {
    const { scenarioId, decisionIds, timeTakenSeconds } = req.body;

    // Validar entrada
    if (!scenarioId || !decisionIds || !Array.isArray(decisionIds) || decisionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'scenarioId y decisionIds (array) son requeridos'
      });
    }

    // Buscar escenario
    const scenario = await db.Scenario.findByPk(scenarioId);
    
    if (!scenario) {
      return res.status(404).json({
        success: false,
        message: 'Escenario no encontrado'
      });
    }

    if (!scenario.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Este escenario no está activo'
      });
    }

    // Ejecutar simulación
    const result = await SimulationEngine.executeSimulation(
      scenario,
      decisionIds,
      timeTakenSeconds || 0
    );

    // Guardar resultado
    const simulation = await db.Simulation.create({
      userId: req.user.id,
      scenarioId,
      decisionsMade: result.decisionsMade,
      finalBudget: result.finalBudget,
      score: result.score,
      timeTakenSeconds: timeTakenSeconds || 0,
      status: result.status,
      feedback: result.feedback
    });

    // Cargar relaciones
    await simulation.reload({
      include: [
        {
          model: db.Scenario,
          as: 'scenario',
          attributes: ['id', 'title', 'difficulty']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Simulación ejecutada exitosamente',
      data: { simulation }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener simulaciones del usuario
 * @route   GET /api/simulations/user/:userId
 * @access  Private
 */
const getUserSimulations = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Verificar autorización
    if (req.user.id !== parseInt(userId) && req.user.role !== 'ADMIN' && req.user.role !== 'TEACHER') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para ver estas simulaciones'
      });
    }

    const simulations = await db.Simulation.findAll({
      where: { userId },
      include: [
        {
          model: db.Scenario,
          as: 'scenario',
          attributes: ['id', 'title', 'difficulty', 'initialBudget']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { simulations }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener simulación por ID
 * @route   GET /api/simulations/:id
 * @access  Private
 */
const getSimulationById = async (req, res, next) => {
  try {
    const simulation = await db.Simulation.findByPk(req.params.id, {
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: db.Scenario,
          as: 'scenario'
        }
      ]
    });

    if (!simulation) {
      return res.status(404).json({
        success: false,
        message: 'Simulación no encontrada'
      });
    }

    // Verificar autorización
    if (simulation.userId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'TEACHER') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para ver esta simulación'
      });
    }

    res.json({
      success: true,
      data: { simulation }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener todas las simulaciones (Admin/Teacher)
 * @route   GET /api/simulations
 * @access  Private/Admin/Teacher
 */
const getAllSimulations = async (req, res, next) => {
  try {
    const { status, scenarioId } = req.query;
    
    const whereClause = {};
    if (status) whereClause.status = status;
    if (scenarioId) whereClause.scenarioId = scenarioId;

    const simulations = await db.Simulation.findAll({
      where: whereClause,
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role']
        },
        {
          model: db.Scenario,
          as: 'scenario',
          attributes: ['id', 'title', 'difficulty']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json({
      success: true,
      data: { simulations }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  runSimulation,
  getUserSimulations,
  getSimulationById,
  getAllSimulations
};
