'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await queryInterface.bulkInsert('users', [
      {
        name: 'Admin Principal',
        email: 'admin@simulator.com',
        password: hashedPassword,
        role: 'ADMIN',  // ⬅️ MAYÚSCULAS
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Profesor Carlos',
        email: 'teacher@simulator.com',
        password: hashedPassword,
        role: 'TEACHER',  // ⬅️ MAYÚSCULAS
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Estudiante María',
        email: 'student@simulator.com',
        password: hashedPassword,
        role: 'STUDENT',  // ⬅️ MAYÚSCULAS
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
  }
};