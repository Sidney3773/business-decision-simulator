const axios = require('axios');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

/**
 * Envía un prompt a Ollama y devuelve la respuesta como texto
 */
const ask = async (prompt, systemPrompt = '') => {
  const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
    model: OLLAMA_MODEL,
    prompt,
    system: systemPrompt,
    stream: false
  });
  return response.data.response?.trim() ?? '';
};

// ─── Prompts del sistema por rol ──────────────────────────────────────────────

const SYSTEM_ESTUDIANTE = `
Eres un tutor de negocios experto en toma de decisiones empresariales.
Tu rol es orientar al estudiante durante una simulación sin revelar la respuesta correcta.
- Haz preguntas que lo lleven a pensar por sí mismo.
- Cita datos reales de empresas cuando sea útil (casos de Airbnb, Uber, startups LATAM, etc.).
- Sé conciso: máximo 3 párrafos por respuesta.
- Nunca digas cuál decisión elegir directamente.
- Responde siempre en español.
`;

const SYSTEM_ANALISIS = `
Eres un analista experto en decisiones empresariales.
Tu rol es analizar la decisión que tomó un estudiante en una simulación y explicar:
1. Qué falló o qué estuvo bien.
2. Qué sesgo cognitivo puede haber influido (optimism bias, sunk cost, etc.).
3. Un plan de mejora concreto de 3 pasos.
Sé directo, claro y constructivo. Responde siempre en español.
`;

const SYSTEM_DOCENTE = `
Eres un experto en diseño de casos de negocio para educación.
Tu rol es ayudar a un docente a crear escenarios de simulación realistas.
- Usa datos reales de empresas bolivianas y latinoamericanas cuando sea posible.
- Sugiere métricas concretas: MRR, burn rate, churn rate, runway, etc.
- Propón 3 decisiones con sus posibles consecuencias.
- El escenario debe ser educativo y representar un dilema real.
Responde siempre en español, en formato estructurado.
`;

// ─── Funciones públicas ───────────────────────────────────────────────────────

/**
 * Asistente para el estudiante durante la simulación
 * @param {string} pregunta - Pregunta del estudiante
 * @param {object} contexto - { scenarioTitle, scenarioDescription, budget }
 */
const asistirEstudiante = async (pregunta, contexto = {}) => {
  const prompt = `
ESCENARIO ACTUAL:
Título: ${contexto.scenarioTitle || 'N/A'}
Descripción: ${contexto.scenarioDescription || 'N/A'}
Presupuesto: $${contexto.budget || 'N/A'}

PREGUNTA DEL ESTUDIANTE:
${pregunta}
  `.trim();

  return ask(prompt, SYSTEM_ESTUDIANTE);
};

/**
 * Analiza el resultado de una simulación para el estudiante
 * @param {object} datos - { scenarioTitle, decisionText, score, optimalDecision }
 */
const analizarResultado = async (datos = {}) => {
  const prompt = `
ESCENARIO: ${datos.scenarioTitle}
DECISIÓN TOMADA: ${datos.decisionText}
PUNTUACIÓN OBTENIDA: ${datos.score}/100
DECISIÓN ÓPTIMA: ${datos.optimalDecision}

Analiza qué falló, qué sesgo cognitivo puede haber influido y da un plan de mejora de 3 pasos.
  `.trim();

  return ask(prompt, SYSTEM_ANALISIS);
};

/**
 * Ayuda al docente a completar un escenario
 * @param {object} datos - { title, description, sector, difficulty }
 */
const completarEscenario = async (datos = {}) => {
  const prompt = `
El docente quiere crear este escenario:
Título: ${datos.title || '(sin título aún)'}
Descripción inicial: ${datos.description || '(sin descripción aún)'}
Sector: ${datos.sector || 'no especificado'}
Dificultad: ${datos.difficulty || 'Medio'}

Por favor:
1. Enriquece la descripción con datos reales del sector.
2. Agrega métricas concretas (MRR, runway, burn rate, etc.).
3. Propón 3 opciones de decisión con sus consecuencias probables.
4. Sugiere el tiempo límite adecuado.
  `.trim();

  return ask(prompt, SYSTEM_DOCENTE);
};

/**
 * Verificar si Ollama está disponible
 */
const checkStatus = async () => {
  try {
    const res = await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 3000 });
    const models = res.data.models?.map(m => m.name) ?? [];
    return { online: true, models };
  } catch {
    return { online: false, models: [] };
  }
};

module.exports = {
  asistirEstudiante,
  analizarResultado,
  completarEscenario,
  checkStatus
};