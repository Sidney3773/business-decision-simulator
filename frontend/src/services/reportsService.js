import api from './api';

export const reportsService = {
  // Para docentes: reporte de sus escenarios y estudiantes
  getTeacherReport: async () => {
    const res = await api.get('/reports/teacher');
    return res.data; // { success, data: { escenarios, estudiantes } }
  },

  // Para administradores: reporte global
  getAdminReport: async () => {
    const res = await api.get('/reports/admin');
    return res.data; // { success, data: { resumen, topDocentes, topEscenarios } }
  },

  // Para estudiantes: su propio historial y progreso
  getStudentReport: async () => {
    const res = await api.get('/reports/student');
    return res.data; // { success, data: { resumen, simulaciones, tendenciaSemanal } }
  }
};