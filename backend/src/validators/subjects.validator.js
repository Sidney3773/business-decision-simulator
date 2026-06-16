const { body } = require('express-validator');

const SUBJECT_NAMES = [
  'Proyecto Integrador Intermedio I',
  'Proyecto Integrador Intermedio II',
  'Proyecto Integrador Intermedio III',
  'Proyecto Integrador Final'
];

const CAREERS = [
  'Ingeniería Comercial',
  'Administración de Empresas'
];

const createSubjectValidator = [
  body('name')
    .notEmpty().withMessage('El nombre de la materia es requerido')
    .isIn(SUBJECT_NAMES).withMessage('Nombre de materia inválido'),

  body('career')
    .notEmpty().withMessage('La carrera es requerida')
    .isIn(CAREERS).withMessage('Carrera inválida'),

  body('teacherId')
    .optional({ nullable: true })
    .isInt().withMessage('teacherId debe ser un número entero')
];

const updateSubjectValidator = [
  body('name')
    .optional()
    .isIn(SUBJECT_NAMES).withMessage('Nombre de materia inválido'),

  body('career')
    .optional()
    .isIn(CAREERS).withMessage('Carrera inválida'),

  body('teacherId')
    .optional({ nullable: true })
    .isInt().withMessage('teacherId debe ser un número entero'),

  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive debe ser booleano')
];

module.exports = {
  createSubjectValidator,
  updateSubjectValidator,
  SUBJECT_NAMES,
  CAREERS
};
