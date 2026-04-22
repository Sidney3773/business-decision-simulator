'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('scenarios', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      difficulty: {
        type: Sequelize.ENUM('EASY', 'MEDIUM', 'HARD'),  // MAYÚSCULAS
        allowNull: false,
        defaultValue: 'MEDIUM'  //  MAYÚSCULAS
      },
      initial_budget: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 100000.00
      },
      time_limit_minutes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30
      },
      decisions: {
        type: Sequelize.JSON,
        allowNull: true
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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
  },
  
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('scenarios');
  }
};