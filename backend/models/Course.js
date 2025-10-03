const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lecturer: {
    type: DataTypes.STRING,
    allowNull: false
  },
  stream: {
    type: DataTypes.STRING,
    allowNull: false
  },
  faculty: {
    type: DataTypes.STRING,
    allowNull: false
  },
  programType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'degree'
  },
  semester: {
    type: DataTypes.STRING,
    allowNull: true
  },
  year: {
    type: DataTypes.STRING,
    allowNull: true
  },
  schedule: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'courses',
  timestamps: true
});

// Sync the model
Course.sync()
  .then(() => console.log('Course table synced'))
  .catch(err => console.error('Error syncing Course table:', err));

module.exports = Course;