const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth.middleware'); // ✅ usamos el nombre correcto
const ollama = require('../services/ollamaService');

// ── Verificar estado de Ollama ─────────────────────────────
// GET /api/ai/status
router.get('/status', protect, async (req, res, next) => {
  try {
    const status = await ollama.checkStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
});

// ── Asistente para estudiante ─────────────────────────────
router.post('/student-assist', protect, async (req, res, next) => {
  try {
    const { pregunta, contexto } = req.body;

    if (!pregunta?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'La pregunta es requerida'
      });
    }

    const respuesta = await ollama.asistirEstudiante(pregunta, contexto || {});
    res.json({ success: true, data: { respuesta } });
  } catch (error) {
    next(error);
  }
});

// ── Análisis de resultado ─────────────────────────────
router.post('/analyze-result', protect, async (req, res, next) => {
  try {
    const { scenarioTitle, decisionText, score, optimalDecision } = req.body;

    if (!decisionText) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos del resultado'
      });
    }

    const analisis = await ollama.analizarResultado({
      scenarioTitle,
      decisionText,
      score,
      optimalDecision
    });

    res.json({ success: true, data: { analisis } });
  } catch (error) {
    next(error);
  }
});

// ── Asistente para docente ─────────────────────────────
router.post('/complete-scenario', protect, async (req, res, next) => {
  try {
    const { title, description, sector, difficulty } = req.body;

    const sugerencia = await ollama.completarEscenario({
      title,
      description,
      sector,
      difficulty
    });

    res.json({ success: true, data: { sugerencia } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;