import api from './api';

export const simulationService = {
  async run(simulationData) {
    const response = await api.post('/simulations/run', simulationData);
    return response.data;
  },

  async getUserSimulations(userId) {
    const response = await api.get(`/simulations/user/${userId}`);
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/simulations/${id}`);
    return response.data;
  },

  async getAll(params = {}) {
    const response = await api.get('/simulations', { params });
    return response.data;
  }
};