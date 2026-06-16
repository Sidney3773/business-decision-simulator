'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Estudiante pertenece a UNA materia (nullable: el admin puede crear el
    // usuario y asignarlo a una materia después)
    await queryInterface.addColumn('users', 'subject_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'subjects',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Cada escenario pertenece a la materia del profesor que lo crea
    await queryInterface.addColumn('scenarios', 'subject_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // nullable para no romper escenarios ya existentes (legacy)
      references: {
        model: 'subjects',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'subject_id');
    await queryInterface.removeColumn('scenarios', 'subject_id');
  }
};