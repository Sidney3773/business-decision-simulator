/**
 * PRIMERA PRUEBA UNITARIA — Motor de Simulación (SimulationEngine)
 * Archivo: src/services/simulation.service.js
 *
 * Corrección: finalBudget de Test 1.1 era 108000 (incorrecto).
 * 100000 + 20000 - 15000 = 105000 (correcto).
 */

const SimulationEngine = require('../src/services/simulation.service');

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

describe('Prueba 1 — SimulationEngine', () => {

  test('calcula correctamente el presupuesto final con múltiples decisiones', async () => {
    // 100000 + 20000 - 15000 = 105000
    const resultado = await SimulationEngine.executeSimulation(
      baseScenario,
      ['D1', 'D2'],
      300
    );

    expect(resultado.finalBudget).toBe(105000);
    expect(resultado.status).toBe('COMPLETED');
    expect(resultado.decisionsMade).toHaveLength(2);
  });

  test('marca la simulación como FAILED cuando el presupuesto queda negativo', async () => {
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
    expect(resultado.feedback).toContain('quiebra');
  });

  test('el score nunca supera 100 aunque los impactos sean muy altos', async () => {
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
