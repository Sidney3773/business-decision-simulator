import api from './api';

export const userService = {
  // Listar usuarios (con filtro opcional por rol y paginación)
  async getAll(params = {}) {
    const response = await api.get('/users', { params });
    return response.data; // { success, data: { users, pagination } }
  },

  async getById(id) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Crear profesor o estudiante (solo ADMIN)
  async create(userData) {
    const response = await api.post('/users', userData);
    return response.data;
  },

  async update(id, userData) {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};
