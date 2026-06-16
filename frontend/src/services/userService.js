import api from './api';

export const userService = {
  // Listar usuarios (filtros opcionales: role, subjectId, unassigned, paginación)
  async getAll(params = {}) {
    const response = await api.get('/users', { params });
    return response.data; // { success, data: { users, pagination } }
  },

  async getById(id) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Crear profesor o estudiante (solo ADMIN). Para estudiantes puede incluir subjectId.
  async create(userData) {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // subjectId puede ser un número, null (quitar de materia) o no enviarse (sin cambios)
  async update(id, userData) {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};