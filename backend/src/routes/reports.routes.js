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