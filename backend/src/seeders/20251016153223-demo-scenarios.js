'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('scenarios', [
      {
        title: 'Crisis de Inventario en Temporada Alta',
        description: 'Tu empresa tiene un exceso de inventario que está generando altos costos de almacenamiento. Debes tomar decisiones rápidas para optimizar el capital de trabajo.',
        difficulty: 'EASY',
        initial_budget: 150000.00,
        time_limit_minutes: 15,
        decisions: JSON.stringify([
          {
            id: 1,
            text: 'Liquidar inventario con 30% descuento',
            impact: {
              budget: -45000,
              score: 60,
              feedback: 'Recuperaste capital rápidamente pero con pérdidas significativas'
            }
          },
          {
            id: 2,
            text: 'Implementar campaña de marketing agresiva',
            impact: {
              budget: -20000,
              score: 80,
              feedback: 'Aumentaste ventas sin sacrificar márgenes'
            }
          },
          {
            id: 3,
            text: 'Negociar mejores términos con proveedores',
            impact: {
              budget: 10000,
              score: 90,
              feedback: 'Excelente decisión estratégica'
            }
          }
        ]),
        created_by: 2, // Teacher
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        title: 'Expansión a Nuevo Mercado',
        description: 'Una oportunidad de expandirse a un nuevo mercado geográfico requiere inversión inmediata. Analiza riesgos y beneficios.',
        difficulty: 'MEDIUM',
        initial_budget: 500000.00,
        time_limit_minutes: 30,
        decisions: JSON.stringify([
          {
            id: 1,
            text: 'Inversión total agresiva ($250k)',
            impact: {
              budget: -250000,
              score: 85,
feedback: 'Alta penetración de mercado pero riesgo elevado'
}
},
{
id: 2,
text: 'Entrada gradual con piloto ($100k)',
impact: {
budget: -100000,
score: 95,
feedback: 'Estrategia prudente que minimiza riesgos'
}
},
{
id: 3,
text: 'Asociación estratégica local ($50k)',
impact: {
budget: -50000,
score: 100,
feedback: 'Decisión óptima: reduces riesgo y costos'
}
}
]),
created_by: 2,
is_active: true,
created_at: new Date(),
updated_at: new Date()
}
], {});
},
down: async (queryInterface, Sequelize) => {
await queryInterface.bulkDelete('scenarios', null, {});
}
};