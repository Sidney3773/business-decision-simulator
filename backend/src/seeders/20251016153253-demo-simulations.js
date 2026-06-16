'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Solo inserta simulaciones de demo, NO crea la tabla
    // (la tabla ya fue creada por la migración 20251016144454-create-simulations.js)
    await queryInterface.bulkInsert('simulations', [
      {
        user_id: 3,         // student@simulator.com
        scenario_id: 1,
        decisions_made: JSON.stringify([
          {
            decisionId: 2,
            text: 'Implementar campaña de marketing agresiva',
            budgetImpact: -20000,
            scoreImpact: 80
          }
        ]),
        final_budget: 130000.00,
        score: 80,
        time_taken_seconds: 320,
        status: 'COMPLETED',
        feedback: 'Aumentaste ventas sin sacrificar márgenes. Buen desempeño (80 pts). Cambio presupuestario: -13.3%',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: 3,
        scenario_id: 2,
        decisions_made: JSON.stringify([
          {
            decisionId: 5,
            text: 'Asociación estratégica local ($50k)',
            budgetImpact: -50000,
            scoreImpact: 100
          }
        ]),
        final_budget: 450000.00,
        score: 100,
        time_taken_seconds: 540,
        status: 'COMPLETED',
        feedback: 'Excelente desempeño (100 pts). Reduciste riesgo y costos. Incremento presupuestario: -10.0%',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('simulations', null, {});
  }
};