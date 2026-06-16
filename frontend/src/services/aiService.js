import api from './api';

export const aiService = {
  // Asistente para el estudiante durante la simulación
  studentAssist: async (pregunta, contexto = {}) => {
    const res = await api.post('/ai/student-assist', { pregunta, contexto });
    return res.data; // { success, data: { respuesta } }
  },

  // Análisis del resultado de la simulación
  analyzeResult: async ({ scenarioTitle, decisionText, score, optimalDecision }) => {
    const res = await api.post('/ai/analyze-result', {
      scenarioTitle, decisionText, score, optimalDecision
    });
    return res.data; // { success, data: { analisis } }
  },

  // Completar escenario para docente
  completeScenario: async ({ title, description, sector, difficulty }) => {
    const res = await api.post('/ai/complete-scenario', {
      title, description, sector, difficulty
    });
    return res.data; // { success, data: { sugerencia } }
  },

  // Verificar si Ollama está online
  checkStatus: async () => {
    const res = await api.get('/ai/status');
    return res.data; // { success, data: { online, models } }
  }
};