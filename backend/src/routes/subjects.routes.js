const express = require('express');
const router = express.Router();
const {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  setSubjectStudents
} = require('../controllers/subjects.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { handleValidationErrors } = require('../middlewares/validate.middleware');
const { createSubjectValidator, updateSubjectValidator } = require('../validators/subjects.validator');

// Todas las rutas requieren autenticación
router.use(protect);

// Lectura: ADMIN ve todas, TEACHER ve las suyas, STUDENT ve la suya
router.get('/', getSubjects);
router.get('/:id', getSubjectById);

// Escritura: solo ADMIN
router.post('/', authorize('ADMIN'), createSubjectValidator, handleValidationErrors, createSubject);
router.put('/:id', authorize('ADMIN'), updateSubjectValidator, handleValidationErrors, updateSubject);
router.delete('/:id', authorize('ADMIN'), deleteSubject);
router.put('/:id/students', authorize('ADMIN'), setSubjectStudents);

module.exports = router;
