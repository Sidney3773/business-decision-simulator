const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Scenario = sequelize.define('Scenario', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El título es requerido' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'La descripción es requerida' }
      }
    },
    difficulty: {
      type: DataTypes.ENUM('EASY', 'MEDIUM', 'HARD'),
      allowNull: false,
      defaultValue: 'MEDIUM'
    },
    initialBudget: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 100000.00,
      field: 'initial_budget'
    },
    timeLimitMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
      field: 'time_limit_minutes'
    },
    decisions: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Array de decisiones posibles'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'scenarios',
    timestamps: true,
    underscored: true
  });

  Scenario.associate = (models) => {
    Scenario.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    Scenario.hasMany(models.Simulation, {
      foreignKey: 'scenarioId',
      as: 'simulations'
    });
  };

  return Scenario;
};