// Database configuration - MySQL with Sequelize ORM
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('attentrack', 'root', '34691218', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false, // Set to console.log for debugging SQL queries
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;
