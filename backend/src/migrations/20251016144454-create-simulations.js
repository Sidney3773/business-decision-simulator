'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('simulations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      scenario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'scenarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      decisions_made: {
        type: Sequelize.JSON,
        allowNull: false
      },
      final_budget: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      score: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      time_taken_seconds: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('IN_PROGRESS', 'COMPLETED', 'FAILED'),  // MAYÚSCULAS
        allowNull: false,
        defaultValue: 'IN_PROGRESS'
      },
      feedback: {
        type: Sequelize.TEXT,
        allowNull: true
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
    await queryInterface.dropTable('simulations');
  }
};