// config/database.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  database: process.env.MYSQL_DB || 'luct_faculty_reporting',
  username: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
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
    console.log('Attempting to connect to MySQL database with config:', {
      host: sequelize.options.host,
      port: sequelize.options.port,
      database: sequelize.config.database,
      username: sequelize.config.username,
    });
    await sequelize.authenticate();
    console.log('✅ MySQL database connection established successfully.');
    
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully.');
    
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to MySQL database:', error.message);
    return false;
  }
};

module.exports = { sequelize, testConnection };