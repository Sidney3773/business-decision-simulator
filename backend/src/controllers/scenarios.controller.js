const db = require('../models');

/**
 * @desc    Obtener todos los escenarios
 * @route   GET /api/scenarios
 * @access  Private
 */
const getScenarios = async (req, res, next) => {
  try {
    const { difficulty, isActive } = req.query;
    
    const whereClause = {};
    if (difficulty) whereClause.difficulty = difficulty;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    const scenarios = await db.Scenario.findAll({
      where: whereClause,
      include: [
        {
          model: db.User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { scenarios }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener escenario por ID
 * @route   GET /api/scenarios/:id
 * @access  Private
 */
const getScenarioById = async (req, res, next) => {
  try {
    const scenario = await db.Scenario.findByPk(req.params.id, {
      include: [
        {
          model: db.User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!scenario) {
      return res.status(404).json({
        success: false,
        message: 'Escenario no encontrado'
      });
    }

    res.json({
      success: true,
      data: { scenario }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Crear nuevo escenario
 * @route   POST /api/scenarios
 * @access  Private/Teacher/Admin
 */
const createScenario = async (req, res, next) => {
  try {
    const {
      title,
      description,
      difficulty,
      initialBudget,
      timeLimitMinutes,
      decisions
    } = req.body;

    const scenario = await db.Scenario.create({
      title,
      description,
      difficulty,
      initialBudget,
      timeLimitMinutes,
      decisions,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Escenario creado exitosamente',
      data: { scenario }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar escenario
 * @route   PUT /api/scenarios/:id
 * @access  Private/Teacher/Admin
 */
const updateScenario = async (req, res, next) => {
  try {
    const scenario = await db.Scenario.findByPk(req.params.id);
    
    if (!scenario) {
      return res.status(404).json({
        success: false,
        message: 'Escenario no encontrado'
      });
    }

    // Verificar que el usuario sea el creador o admin
    if (scenario.createdBy !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para modificar este escenario'
      });
    }

    await scenario.update(req.body);

    res.json({
      success: true,
      message: 'Escenario actualizado exitosamente',
      data: { scenario }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar escenario
 * @route   DELETE /api/scenarios/:id
 * @access  Private/Teacher/Admin
 */
const deleteScenario = async (req, res, next) => {
  try {
    const scenario = await db.Scenario.findByPk(req.params.id);
    
    if (!scenario) {
      return res.status(404).json({
        success: false,
        message: 'Escenario no encontrado'
      });
    }

    // Verificar autorización
    if (scenario.createdBy !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para eliminar este escenario'
      });
    }

    await scenario.destroy();

    res.json({
      success: true,
      message: 'Escenario eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getScenarios,
  getScenarioById,
  createScenario,
  updateScenario,
  deleteScenario
};
