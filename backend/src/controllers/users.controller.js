const db = require('../models');

/**
 * @desc    Obtener todos los usuarios
 * @route   GET /api/users
 * @access  Private/Admin
 *
 * Incluye la materia asignada (para estudiantes) y las materias a cargo
 * (para profesores), útil para el panel de Gestión de Usuarios.
 */
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, subjectId, unassigned } = req.query;

    const whereClause = {};
    if (role) whereClause.role = role;
    if (subjectId) whereClause.subjectId = subjectId;
    // unassigned=true → estudiantes sin materia asignada
    if (unassigned === 'true') whereClause.subjectId = null;

    const offset = (page - 1) * limit;

    const { count, rows: users } = await db.User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: db.Subject,
          as: 'subject',
          attributes: ['id', 'name', 'career']
        },
        {
          model: db.Subject,
          as: 'subjectsTaught',
          attributes: ['id', 'name', 'career']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener usuario por ID
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await db.User.findByPk(req.params.id, {
      include: [
        {
          model: db.Simulation,
          as: 'simulations',
          limit: 5,
          order: [['createdAt', 'DESC']]
        },
        {
          model: db.Subject,
          as: 'subject',
          attributes: ['id', 'name', 'career']
        },
        {
          model: db.Subject,
          as: 'subjectsTaught',
          attributes: ['id', 'name', 'career']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Crear nuevo usuario (profesor o estudiante)
 * @route   POST /api/users
 * @access  Private/Admin
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, subjectId } = req.body;

    // Verificar si el email ya existe
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // subjectId solo tiene sentido para estudiantes
    let resolvedSubjectId = null;
    if (role === 'STUDENT' && subjectId) {
      const subject = await db.Subject.findByPk(subjectId);
      if (!subject) {
        return res.status(400).json({ success: false, message: 'La materia seleccionada no existe' });
      }
      resolvedSubjectId = subject.id;
    }

    // El hook beforeCreate del modelo User hashea la contraseña
    const user = await db.User.create({
      name,
      email,
      password,
      role,
      subjectId: resolvedSubjectId
    });

    const result = await db.User.findByPk(user.id, {
      include: [{ model: db.Subject, as: 'subject', attributes: ['id', 'name', 'career'] }]
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: { user: result }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar usuario
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive, password, subjectId } = req.body;

    const user = await db.User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Si el admin cambia el email, verificar que no esté en uso por otro usuario
    if (email && email !== user.email) {
      const existingUser = await db.User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está en uso por otro usuario'
        });
      }
    }

    // Validar subjectId si se proporciona (puede venir null para "quitar de materia")
    let resolvedSubjectId;
    if (subjectId !== undefined) {
      if (subjectId === null || subjectId === '') {
        resolvedSubjectId = null;
      } else {
        const subject = await db.Subject.findByPk(subjectId);
        if (!subject) {
          return res.status(400).json({ success: false, message: 'La materia seleccionada no existe' });
        }
        resolvedSubjectId = subject.id;
      }
    }

    await user.update({
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role }),
      ...(isActive !== undefined && { isActive }),
      // El hook beforeUpdate hashea automáticamente si password cambia
      ...(password && { password }),
      ...(resolvedSubjectId !== undefined && { subjectId: resolvedSubjectId })
    });

    const result = await db.User.findByPk(user.id, {
      include: [{ model: db.Subject, as: 'subject', attributes: ['id', 'name', 'career'] }]
    });

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: { user: result }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar usuario
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await db.User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Evitar que el admin se elimine a sí mismo por error
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};