const db = require('../models');

/**
 * @desc    Listar materias (con su profesor y conteo de estudiantes)
 * @route   GET /api/subjects
 * @access  Private
 *          - ADMIN: ve todas
 *          - TEACHER: ve solo las suyas (las que tiene a cargo)
 *          - STUDENT: ve solo la suya (si tiene una asignada)
 */
const getSubjects = async (req, res, next) => {
  try {
    const whereClause = {};

    if (req.user.role === 'TEACHER') {
      whereClause.teacherId = req.user.id;
    } else if (req.user.role === 'STUDENT') {
      if (!req.user.subjectId) {
        return res.json({ success: true, data: { subjects: [] } });
      }
      whereClause.id = req.user.subjectId;
    }

    const subjects = await db.Subject.findAll({
      where: whereClause,
      include: [
        {
          model: db.User,
          as: 'teacher',
          attributes: ['id', 'name', 'email']
        },
        {
          model: db.User,
          as: 'students',
          attributes: ['id', 'name', 'email', 'isActive']
        }
      ],
      order: [['career', 'ASC'], ['name', 'ASC']]
    });

    // Agregar conteo de estudiantes para conveniencia del frontend
    const data = subjects.map(s => {
      const json = s.toJSON();
      json.studentCount = json.students?.length || 0;
      return json;
    });

    res.json({ success: true, data: { subjects: data } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener una materia por ID
 * @route   GET /api/subjects/:id
 * @access  Private
 */
const getSubjectById = async (req, res, next) => {
  try {
    const subject = await db.Subject.findByPk(req.params.id, {
      include: [
        { model: db.User, as: 'teacher', attributes: ['id', 'name', 'email'] },
        { model: db.User, as: 'students', attributes: ['id', 'name', 'email', 'isActive'] },
        { model: db.Scenario, as: 'scenarios', attributes: ['id', 'title', 'isActive'] }
      ]
    });

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Materia no encontrada' });
    }

    // Autorización: TEACHER solo puede ver sus propias materias
    if (req.user.role === 'TEACHER' && subject.teacherId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No autorizado para ver esta materia' });
    }
    // STUDENT solo su materia asignada
    if (req.user.role === 'STUDENT' && subject.id !== req.user.subjectId) {
      return res.status(403).json({ success: false, message: 'No autorizado para ver esta materia' });
    }

    res.json({ success: true, data: { subject } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Crear materia
 * @route   POST /api/subjects
 * @access  Private/Admin
 */
const createSubject = async (req, res, next) => {
  try {
    const { name, career, teacherId } = req.body;

    // Si se especifica un profesor, validar que exista y tenga rol TEACHER
    if (teacherId) {
      const teacher = await db.User.findByPk(teacherId);
      if (!teacher || teacher.role !== 'TEACHER') {
        return res.status(400).json({
          success: false,
          message: 'El usuario seleccionado no es un profesor válido'
        });
      }
    }

    const subject = await db.Subject.create({ name, career, teacherId: teacherId || null });

    const result = await db.Subject.findByPk(subject.id, {
      include: [{ model: db.User, as: 'teacher', attributes: ['id', 'name', 'email'] }]
    });

    res.status(201).json({
      success: true,
      message: 'Materia creada exitosamente',
      data: { subject: result }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar materia (nombre, carrera, profesor asignado, estado)
 * @route   PUT /api/subjects/:id
 * @access  Private/Admin
 */
const updateSubject = async (req, res, next) => {
  try {
    const { name, career, teacherId, isActive } = req.body;

    const subject = await db.Subject.findByPk(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Materia no encontrada' });
    }

    if (teacherId) {
      const teacher = await db.User.findByPk(teacherId);
      if (!teacher || teacher.role !== 'TEACHER') {
        return res.status(400).json({
          success: false,
          message: 'El usuario seleccionado no es un profesor válido'
        });
      }
    }

    await subject.update({
      ...(name && { name }),
      ...(career && { career }),
      ...(teacherId !== undefined && { teacherId: teacherId || null }),
      ...(isActive !== undefined && { isActive })
    });

    const result = await db.Subject.findByPk(subject.id, {
      include: [
        { model: db.User, as: 'teacher', attributes: ['id', 'name', 'email'] },
        { model: db.User, as: 'students', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.json({ success: true, message: 'Materia actualizada exitosamente', data: { subject: result } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar materia
 * @route   DELETE /api/subjects/:id
 * @access  Private/Admin
 */
const deleteSubject = async (req, res, next) => {
  try {
    const subject = await db.Subject.findByPk(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Materia no encontrada' });
    }

    // Los estudiantes asignados quedan sin materia (subject_id = NULL por ON DELETE SET NULL)
    await subject.destroy();

    res.json({ success: true, message: 'Materia eliminada exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Asignar (o quitar) estudiantes a una materia
 * @route   PUT /api/subjects/:id/students
 * @body    { studentIds: number[] }  -- reemplaza la lista completa de estudiantes asignados
 * @access  Private/Admin
 */
const setSubjectStudents = async (req, res, next) => {
  try {
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds)) {
      return res.status(400).json({ success: false, message: 'studentIds debe ser un array' });
    }

    const subject = await db.Subject.findByPk(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Materia no encontrada' });
    }

    // Validar que todos los IDs sean estudiantes válidos
    if (studentIds.length > 0) {
      const students = await db.User.findAll({ where: { id: studentIds } });
      const invalidos = students.filter(s => s.role !== 'STUDENT');
      if (students.length !== studentIds.length) {
        return res.status(400).json({ success: false, message: 'Uno o más estudiantes no existen' });
      }
      if (invalidos.length > 0) {
        return res.status(400).json({ success: false, message: 'Solo se pueden asignar usuarios con rol STUDENT' });
      }
    }

    // 1. Quitar de esta materia a los estudiantes que ya no estén en la lista
    await db.User.update(
      { subjectId: null },
      { where: { subjectId: subject.id } }
    );

    // 2. Asignar la materia a los estudiantes seleccionados
    if (studentIds.length > 0) {
      await db.User.update(
        { subjectId: subject.id },
        { where: { id: studentIds, role: 'STUDENT' } }
      );
    }

    const result = await db.Subject.findByPk(subject.id, {
      include: [
        { model: db.User, as: 'teacher', attributes: ['id', 'name', 'email'] },
        { model: db.User, as: 'students', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.json({ success: true, message: 'Estudiantes asignados correctamente', data: { subject: result } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  setSubjectStudents
};
