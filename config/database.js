// config/database.js
const { Sequelize } = require('sequelize');
const path = require('path');

// Path to SQLite database file
const dbPath = path.join(__dirname, '..', 'database', 'database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false  // disable SQL logs
});

module.exports = sequelize;
