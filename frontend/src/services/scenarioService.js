import api from './api';

export const scenarioService = {
  async getAll(params = {}) {
    const response = await api.get('/scenarios', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/scenarios/${id}`);
    return response.data;
  },

  async create(scenarioData) {
    const response = await api.post('/scenarios', scenarioData);
    return response.data;
  },

  async update(id, scenarioData) {
    const response = await api.put(`/scenarios/${id}`, scenarioData);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/scenarios/${id}`);
    return response.data;
  }
};