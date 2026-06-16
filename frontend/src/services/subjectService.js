import api from './api';

export const subjectService = {
  // Listar materias (filtrado por rol en backend)
  async getAll() {
    const response = await api.get('/subjects');
    return response.data; // { success, data: { subjects } }
  },

  async getById(id) {
    const response = await api.get(`/subjects/${id}`);
    return response.data;
  },

  // Crear materia (solo ADMIN)
  async create(subjectData) {
    const response = await api.post('/subjects', subjectData);
    return response.data;
  },

  async update(id, subjectData) {
    const response = await api.put(`/subjects/${id}`, subjectData);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/subjects/${id}`);
    return response.data;
  },

  // Reemplaza la lista completa de estudiantes asignados a la materia
  async setStudents(id, studentIds) {
    const response = await api.put(`/subjects/${id}/students`, { studentIds });
    return response.data;
  }
};
