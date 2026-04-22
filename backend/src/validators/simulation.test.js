/**
 * PRUEBA UNITARIA 1 — Motor de Simulación (SimulationEngine)
 * Archivo: src/services/simulation.service.js
 *
 * Qué se prueba:
 *   - Que la simulación calcula bien el presupuesto final sumando impactos.
 *   - Que el estado pasa a FAILED cuando el presupuesto queda negativo.
 *   - Que el score nunca supera 100 aunque los impactos sean muy altos.
 */

const SimulationEngine = require('../src/services/simulation.service');

// ─── Datos de ejemplo reutilizables ──────────────────────────────────────────

// Escenario base con 3 decisiones posibles
const baseScenario = {
  initialBudget: 100000,
  timeLimitMinutes: 10,
  decisions: [
    {
      id: 'D1',
      text: 'Invertir en marketing digital',
      impact: { budget: 20000, score: 40, feedback: 'Buena visibilidad.' }
    },
    {
      id: 'D2',
      text: 'Contratar personal extra',
      impact: { budget: -15000, score: 30, feedback: 'Más capacidad operativa.' }
    },
    {
      id: 'D3',
      text: 'Reducir costos operativos',
      impact: { budget: -50000, score: 10, feedback: 'Ahorro a corto plazo.' }
    }
  ]
};

// ─── Suite de pruebas ─────────────────────────────────────────────────────────

describe('Prueba 1 — SimulationEngine', () => {

  // ── Test 1.1 ─────────────────────────────────────────────────────────────
  test('calcula correctamente el presupuesto final con múltiples decisiones', async () => {
    /*
     * Elegimos D1 (+20 000) y D2 (-15 000).
     * Presupuesto esperado: 100 000 + 20 000 - 15 000 = 105 000
     * Tiempo: 300 s (dentro del límite de 10 min = 600 s)
     */
    const resultado = await SimulationEngine.executeSimulation(
      baseScenario,
      ['D1', 'D2'],
      300
    );

    expect(resultado.finalBudget).toBe(105000);
    expect(resultado.status).toBe('COMPLETED');
    expect(resultado.decisionsMade).toHaveLength(2);
  });

  // ── Test 1.2 ─────────────────────────────────────────────────────────────
  test('marca la simulación como FAILED cuando el presupuesto queda negativo', async () => {
    /*
     * Escenario con presupuesto inicial muy pequeño y decisión cara.
     * 500 + (-5000) = -4500 → FAILED
     */
    const scenarioPobre = {
      ...baseScenario,
      initialBudget: 500,
      decisions: [
        {
          id: 'D_CARA',
          text: 'Compra de equipos',
          impact: { budget: -5000, score: 20, feedback: 'Inversión en equipos.' }
        }
      ]
    };

    const resultado = await SimulationEngine.executeSimulation(
      scenarioPobre,
      ['D_CARA'],
      60
    );

    expect(resultado.finalBudget).toBe(-4500);
    expect(resultado.status).toBe('FAILED');
    // El feedback debe incluir el aviso de quiebra
    expect(resultado.feedback).toContain('quiebra');
  });

  // ── Test 1.3 ─────────────────────────────────────────────────────────────
  test('el score nunca supera 100 aunque los impactos sean muy altos', async () => {
    /*
     * Escenario con una decisión que da 200 puntos.
     * La clase hace Math.min(100, score), así que el resultado debe ser 100.
     */
    const scenarioAltoScore = {
      ...baseScenario,
      decisions: [
        {
          id: 'D_MAX',
          text: 'Estrategia perfecta',
          impact: { budget: 0, score: 200, feedback: 'Excelente elección.' }
        }
      ]
    };

    const resultado = await SimulationEngine.executeSimulation(
      scenarioAltoScore,
      ['D_MAX'],
      60
    );

    expect(resultado.score).toBe(100);
    expect(resultado.score).toBeLessThanOrEqual(100);
  });

});
