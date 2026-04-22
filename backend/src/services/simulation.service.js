/**
 * Motor de simulación simple
 * Calcula el impacto de decisiones en el presupuesto y genera feedback
 */
class SimulationEngine {
  /**
   * Ejecuta la simulación basándose en las decisiones tomadas
   */
  static async executeSimulation(scenario, decisionIds, timeTaken) {
    let finalBudget = parseFloat(scenario.initialBudget);
    let score = 0;
    const feedback = [];
    const decisionsMade = [];

    // Procesar cada decisión tomada
    for (const decisionId of decisionIds) {
      const decision = scenario.decisions.find(d => d.id === decisionId);
      
      if (!decision) {
        throw new Error(`Decisión ${decisionId} no encontrada en el escenario`);
      }

      // Aplicar impacto
      finalBudget += decision.impact.budget;
      score += decision.impact.score;
      
      decisionsMade.push({
        decisionId: decision.id,
        text: decision.text,
        budgetImpact: decision.impact.budget,
        scoreImpact: decision.impact.score
      });

      feedback.push(decision.impact.feedback);
    }

    // Penalización por tiempo (opcional)
    const timeLimit = scenario.timeLimitMinutes * 60; // Convertir a segundos
    if (timeTaken > timeLimit) {
      const penalty = Math.floor((timeTaken - timeLimit) / 60) * 5;
      score -= penalty;
      feedback.push(`Penalización de ${penalty} puntos por exceder el tiempo límite`);
    }

    // Calcular puntuación final (máx 100)
    score = Math.max(0, Math.min(100, score));

    // Determinar estado
    let status = 'COMPLETED';
    if (finalBudget < 0) {
      status = 'FAILED';
      feedback.push('Presupuesto negativo: la empresa está en quiebra');
    }

    // Generar feedback general
    const generalFeedback = this.generateGeneralFeedback(score, finalBudget, scenario.initialBudget);

    return {
      finalBudget,
      score,
      status,
      decisionsMade,
      feedback: [...feedback, generalFeedback].join('\n')
    };
  }

  /**
   * Genera feedback general basado en la puntuación y presupuesto
   */
  static generateGeneralFeedback(score, finalBudget, initialBudget) {
    const budgetChange = ((finalBudget - initialBudget) / initialBudget) * 100;

    if (score >= 90) {
      return `Excelente desempeño (${score} pts). Incremento presupuestario: ${budgetChange.toFixed(1)}%`;
    } else if (score >= 70) {
      return `✓ Buen desempeño (${score} pts). Cambio presupuestario: ${budgetChange.toFixed(1)}%`;
    } else if (score >= 50) {
      return `Desempeño aceptable (${score} pts). Hay margen de mejora.`;
    } else {
      return `Desempeño bajo (${score} pts). Revisa tus decisiones estratégicas.`;
    }
  }
}

module.exports = SimulationEngine;
