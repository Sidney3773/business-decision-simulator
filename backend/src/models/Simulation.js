const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Simulation = sequelize.define('Simulation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },
    scenarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'scenario_id'
    },
    decisionsMade: {
      type: DataTypes.JSON,
      allowNull: false,
      field: 'decisions_made'
    },
    finalBudget: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'final_budget'
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    timeTakenSeconds: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'time_taken_seconds'
    },
    status: {
      type: DataTypes.ENUM('IN_PROGRESS', 'COMPLETED', 'FAILED'),
      allowNull: false,
      defaultValue: 'IN_PROGRESS'
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'simulations',
    timestamps: true,
    underscored: true
  });

  Simulation.associate = (models) => {
    Simulation.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    Simulation.belongsTo(models.Scenario, {
      foreignKey: 'scenarioId',
      as: 'scenario'
    });
  };

  return Simulation;
};