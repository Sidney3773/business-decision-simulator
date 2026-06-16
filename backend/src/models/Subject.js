const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subject = sequelize.define('Subject', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.ENUM(
        'Proyecto Integrador Intermedio I',
        'Proyecto Integrador Intermedio II',
        'Proyecto Integrador Intermedio III',
        'Proyecto Integrador Final'
      ),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre de la materia es requerido' }
      }
    },
    career: {
      type: DataTypes.ENUM(
        'Ingeniería Comercial',
        'Administración de Empresas'
      ),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'La carrera es requerida' }
      }
    },
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'teacher_id'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'subjects',
    timestamps: true,
    underscored: true
  });

  Subject.associate = (models) => {
    // Un profesor (User con rol TEACHER) puede tener varias materias
    Subject.belongsTo(models.User, {
      foreignKey: 'teacherId',
      as: 'teacher'
    });

    // Una materia tiene muchos estudiantes asignados
    Subject.hasMany(models.User, {
      foreignKey: 'subjectId',
      as: 'students'
    });

    // Una materia tiene muchos escenarios creados por su profesor
    Subject.hasMany(models.Scenario, {
      foreignKey: 'subjectId',
      as: 'scenarios'
    });
  };

  return Subject;
};
