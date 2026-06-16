const db = require('../models');

/**
 * @desc    Obtener todos los escenarios
 * @route   GET /api/scenarios
 * @access  Private
 *          - ADMIN: ve todos
 *          - TEACHER: ve todos (puede filtrar por sus propios escenarios en frontend)
 *          - STUDENT: ve SOLO los escenarios de su materia asignada
 */
const getScenarios = async (req, res, next) => {
  try {
    const { difficulty, isActive } = req.query;

    const whereClause = {};
    if (difficulty) whereClause.difficulty = difficulty;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    // Estudiantes solo ven escenarios de su materia
    if (req.user.role === 'STUDENT') {
      if (!req.user.subjectId) {
        // Estudiante sin materia asignada: no ve ningún escenario
        return res.json({ success: true, data: { scenarios: [] } });
      }
      // Ve escenarios de su materia + escenarios legacy sin materia asignada
      const { Op } = require('sequelize');
      whereClause[Op.or] = [
        { subjectId: req.user.subjectId },
        { subjectId: null }
      ];
    }

    const scenarios = await db.Scenario.findAll({
      where: whereClause,
      include: [
        {
          model: db.User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: db.Subject,
          as: 'subject',
          attributes: ['id', 'name', 'career']
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
        },
        {
          model: db.Subject,
          as: 'subject',
          attributes: ['id', 'name', 'career']
        }
      ]
    });

    if (!scenario) {
      return res.status(404).json({
        success: false,
        message: 'Escenario no encontrado'
      });
    }

    // Un estudiante solo puede acceder a escenarios de su propia materia
    // o escenarios legacy sin materia asignada (subjectId = null)
    if (req.user.role === 'STUDENT' &&
        scenario.subjectId !== null &&
        scenario.subjectId !== req.user.subjectId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este escenario'
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
 *
 * El escenario se asocia automáticamente a la materia que el profesor tiene
 * a cargo. Si el profesor tiene varias materias, debe especificar subjectId
 * en el body; de lo contrario se usa la única materia asignada (si aplica).
 */
const createScenario = async (req, res, next) => {
  try {
    const {
      title,
      description,
      difficulty,
      initialBudget,
      timeLimitMinutes,
      decisions,
      subjectId
    } = req.body;

    let resolvedSubjectId = subjectId || null;

    if (req.user.role === 'TEACHER') {
      if (subjectId) {
        // Verificar que esa materia le pertenezca al profesor
        const subject = await db.Subject.findOne({
          where: { id: subjectId, teacherId: req.user.id }
        });
        if (!subject) {
          return res.status(403).json({
            success: false,
            message: 'No puedes crear escenarios para una materia que no tienes a cargo'
          });
        }
        resolvedSubjectId = subject.id;
      } else {
        // Sin subjectId explícito: tomar la(s) materia(s) del profesor
        const subjects = await db.Subject.findAll({ where: { teacherId: req.user.id } });
        if (subjects.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No tienes ninguna materia asignada. Contacta al administrador.'
          });
        }
        if (subjects.length > 1) {
          return res.status(400).json({
            success: false,
            message: 'Tienes varias materias asignadas. Especifica subjectId al crear el escenario.'
          });
        }
        resolvedSubjectId = subjects[0].id;
      }
    }

    const scenario = await db.Scenario.create({
      title,
      description,
      difficulty,
      initialBudget,
      timeLimitMinutes,
      decisions,
      createdBy: req.user.id,
      subjectId: resolvedSubjectId
    });

    const result = await db.Scenario.findByPk(scenario.id, {
      include: [{ model: db.Subject, as: 'subject', attributes: ['id', 'name', 'career'] }]
    });

    res.status(201).json({
      success: true,
      message: 'Escenario creado exitosamente',
      data: { scenario: result }
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