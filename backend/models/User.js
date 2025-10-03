// backend/models/User.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50]
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  role: {
    type: DataTypes.ENUM('student', 'lecturer', 'prl', 'pl', 'admin'),
    allowNull: false,
    defaultValue: 'student'
  },
  faculty: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  stream: {
    type: DataTypes.ENUM('IT', 'IS', 'CS', 'SE'),
    allowNull: true
  },
  programType: {
    type: DataTypes.ENUM('diploma', 'degree'),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  }
});

User.prototype.validPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

User.prototype.toSafeObject = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

// Static methods
User.findByUsernameOrEmail = function(identifier) {
  return this.findOne({
    where: {
      [Op.or]: [
        { username: identifier },
        { email: identifier }
      ]
    }
  });
};

module.exports = User;