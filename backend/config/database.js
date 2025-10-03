// config/database.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'luct_faculty_reporting',
  username: 'root',
  password: '',
  logging: false,
  define: {
    timestamps: true,
    underscored: false,
  },
  dialectOptions: {
    connectTimeout: 60000
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ XAMPP MySQL database connection established successfully.');
    
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully.');
    
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to XAMPP MySQL database:', error.message);
    return false;
  }
};

module.exports = { sequelize, testConnection };