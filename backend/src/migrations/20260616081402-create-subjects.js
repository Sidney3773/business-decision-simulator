'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('subjects', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        // Proyecto Integrador Intermedio I/II/III, Proyecto Integrador Final
        type: Sequelize.ENUM(
          'Proyecto Integrador Intermedio I',
          'Proyecto Integrador Intermedio II',
          'Proyecto Integrador Intermedio III',
          'Proyecto Integrador Final'
        ),
        allowNull: false
      },
      career: {
        // Ingeniería Comercial / Administración de Empresas
        type: Sequelize.ENUM(
          'Ingeniería Comercial',
          'Administración de Empresas'
        ),
        allowNull: false
      },
      teacher_id: {
        type: Sequelize.INTEGER,
        allowNull: true, // puede crearse sin profesor asignado aún
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Evitar que la misma materia+carrera+profesor se duplique exactamente
    await queryInterface.addIndex('subjects', ['name', 'career'], {
      name: 'idx_subjects_name_career',
      unique: false // no único porque puede haber misma materia/carrera con distinto profesor en distinto periodo (futuro)
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('subjects');
  }
};