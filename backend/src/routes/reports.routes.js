const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const db = require('../models');
const { fn, col, literal } = require('sequelize');

// ─── GET /api/reports/teacher ─────────────────────────────────────────────────
router.get('/teacher', protect, authorize('TEACHER', 'ADMIN'), async (req, res, next) => {
  try {
    const whereClause = req.user.role === 'ADMIN' ? {} : { createdBy: req.user.id };
    const scenarios = await db.Scenario.findAll({
      where: whereClause,
      include: [
        {
          model: db.Simulation,
          as: 'simulations',
          include: [
            {
              // Simulation.associate usa as:'user', NO as:'student'
              model: db.User,
              as: 'user',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const reporteEscenarios = scenarios.map(scenario => {
      const sims = scenario.simulations || [];
      const scores = sims.map(s => s.score).filter(s => s != null);
      const promedio = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;
      return {
        id: scenario.id,
        title: scenario.title,
        difficulty: scenario.difficulty,
        isActive: scenario.isActive,
        totalSimulaciones: sims.length,
        scorePromedio: promedio,
        tasaExito: scores.length
          ? Math.round((scores.filter(s => s >= 70).length / scores.length) * 100)
          : null,
        tiempoPromedioSegundos: sims.length
          ? Math.round(sims.reduce((a, s) => a + (s.timeTakenSeconds || 0), 0) / sims.length)
          : null
      };
    });

    const estudiantesMap = {};
    scenarios.forEach(scenario => {
      (scenario.simulations || []).forEach(sim => {
        if (!sim.user) return;
        const id = sim.user.id;
        if (!estudiantesMap[id]) {
          estudiantesMap[id] = { id, name: sim.user.name, email: sim.user.email, simulaciones: [] };
        }
        estudiantesMap[id].simulaciones.push({
          scenarioTitle: scenario.title,
          score: sim.score,
          completedAt: sim.createdAt,
          timeTakenSeconds: sim.timeTakenSeconds
        });
      });
    });

    const reporteEstudiantes = Object.values(estudiantesMap).map(est => {
      const scores = est.simulaciones.map(s => s.score).filter(s => s != null);
      const promedio = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;
      let tendencia = 'sin-datos';
      if (scores.length >= 2) {
        const mid = Math.floor(scores.length / 2);
        const primera = scores.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
        const segunda = scores.slice(mid).reduce((a, b) => a + b, 0) / (scores.length - mid);
        tendencia = segunda > primera + 3 ? 'mejorando' : segunda < primera - 3 ? 'empeorando' : 'estable';
      }
      return { ...est, totalSimulaciones: est.simulaciones.length, scorePromedio: promedio, mejorScore: scores.length ? Math.max(...scores) : null, tendencia };
    });

    res.json({ success: true, data: { escenarios: reporteEscenarios, estudiantes: reporteEstudiantes } });
  } catch (error) { next(error); }
});

// ─── GET /api/reports/admin ───────────────────────────────────────────────────
router.get('/admin', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const [totalUsuarios, totalDocentes, totalEscenarios, totalSimulaciones] = await Promise.all([
      db.User.count({ where: { role: 'STUDENT' } }),
      db.User.count({ where: { role: 'TEACHER' } }),
      db.Scenario.count(),
      db.Simulation.count()
    ]);

    const scoreGlobal = await db.Simulation.findOne({
      attributes: [[fn('AVG', col('score')), 'promedio']],
      raw: true
    });

    const docentes = await db.User.findAll({
      where: { role: 'TEACHER' },
      include: [{ model: db.Scenario, as: 'scenarios', include: [{ model: db.Simulation, as: 'simulations' }] }]
    });

    const topDocentes = docentes.map(doc => {
      const sims = (doc.scenarios || []).flatMap(s => s.simulations || []);
      const scores = sims.map(s => s.score).filter(s => s != null);
      return {
        id: doc.id, name: doc.name, email: doc.email,
        totalEstudiantes: new Set(sims.map(s => s.userId)).size,
        scorePromedio: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
        totalSimulaciones: sims.length
      };
    }).sort((a, b) => (b.scorePromedio || 0) - (a.scorePromedio || 0));

    const escenariosTop = await db.Scenario.findAll({
      include: [{ model: db.Simulation, as: 'simulations' }],
      order: [[literal('(SELECT COUNT(*) FROM simulations WHERE simulations.scenario_id = Scenario.id)'), 'DESC']],
      limit: 10
    });

    const topEscenarios = escenariosTop.map(s => {
      const scores = (s.simulations || []).map(sim => sim.score).filter(x => x != null);
      return {
        id: s.id, title: s.title, difficulty: s.difficulty,
        totalUsos: s.simulations?.length || 0,
        scorePromedio: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
      };
    });

    res.json({
      success: true,
      data: {
        resumen: { totalUsuarios, totalDocentes, totalEscenarios, totalSimulaciones, scorePromedioGlobal: scoreGlobal?.promedio ? Math.round(parseFloat(scoreGlobal.promedio)) : null },
        topDocentes,
        topEscenarios
      }
    });
  } catch (error) { next(error); }
});

// ─── GET /api/reports/student ─────────────────────────────────────────────────
router.get('/student', protect, async (req, res, next) => {
  try {
    const simulaciones = await db.Simulation.findAll({
      where: { userId: req.user.id },
      include: [{ model: db.Scenario, as: 'scenario', attributes: ['id', 'title', 'difficulty'] }],
      order: [['createdAt', 'ASC']]
    });
    const scores = simulaciones.map(s => s.score).filter(s => s != null);
    const promedio = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    res.json({
      success: true,
      data: {
        resumen: { totalSimulaciones: simulaciones.length, scorePromedio: promedio, mejorScore: scores.length ? Math.max(...scores) : null, peorScore: scores.length ? Math.min(...scores) : null },
        simulaciones: simulaciones.map(s => ({ id: s.id, scenarioTitle: s.scenario?.title, scenarioDifficulty: s.scenario?.difficulty, score: s.score, timeTakenSeconds: s.timeTakenSeconds, completedAt: s.createdAt })),
        tendenciaSemanal: []
      }
    });
  } catch (error) { next(error); }
});

module.exports = router;
// ─── GET /api/reports/scenario/:id ───────────────────────────────────────────
router.get('/scenario/:id', protect, authorize('TEACHER', 'ADMIN'), async (req, res, next) => {
  try {
    const scenarioId = req.params.id;

    const scenario = await db.Scenario.findByPk(scenarioId, {
      include: [
        {
          model: db.Simulation,
          as: 'simulations',
          include: [{ model: db.User, as: 'user', attributes: ['id', 'name', 'email'] }]
        }
      ]
    });

    if (!scenario) {
      return res.status(404).json({ success: false, message: 'Escenario no encontrado' });
    }

    // TEACHER solo puede ver reportes de sus propios escenarios
    if (req.user.role === 'TEACHER' && scenario.createdBy !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    const sims = scenario.simulations || [];
    const scores = sims.map(s => s.score).filter(s => s != null);

    // Distribución de scores en rangos
    const rangos = [
      { label: '0-20',  min: 0,  max: 20,  count: 0 },
      { label: '21-40', min: 21, max: 40,  count: 0 },
      { label: '41-60', min: 41, max: 60,  count: 0 },
      { label: '61-80', min: 61, max: 80,  count: 0 },
      { label: '81-100',min: 81, max: 100, count: 0 },
    ];
    scores.forEach(s => {
      const r = rangos.find(r => s >= r.min && s <= r.max);
      if (r) r.count++;
    });

    // Top 5 estudiantes
    const topEstudiantes = [...sims]
      .filter(s => s.user && s.score != null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => ({ name: s.user.name, email: s.user.email, score: s.score, timeTakenSeconds: s.timeTakenSeconds, completedAt: s.createdAt }));

    // Evolución cronológica (últimas 20 simulaciones)
    const evolucion = [...sims]
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(-20)
      .map((s, i) => ({ intento: i + 1, score: s.score, date: s.createdAt }));

    res.json({
      success: true,
      data: {
        scenario: { id: scenario.id, title: scenario.title, difficulty: scenario.difficulty, isActive: scenario.isActive, initialBudget: scenario.initialBudget, timeLimitMinutes: scenario.timeLimitMinutes },
        resumen: {
          totalSimulaciones: sims.length,
          scorePromedio: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
          mejorScore: scores.length ? Math.max(...scores) : null,
          peorScore: scores.length ? Math.min(...scores) : null,
          tasaExito: scores.length ? Math.round((scores.filter(s => s >= 70).length / scores.length) * 100) : null,
          tiempoPromedio: sims.length ? Math.round(sims.reduce((a, s) => a + (s.timeTakenSeconds || 0), 0) / sims.length) : null
        },
        distribucionScores: rangos,
        topEstudiantes,
        evolucion
      }
    });
  } catch (error) { next(error); }
});