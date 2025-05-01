const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database/database.sqlite',  // saves a file locally
  logging: false
});

module.exports = sequelize;
