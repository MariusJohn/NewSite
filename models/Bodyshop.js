const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Bodyshop = sequelize.define('Bodyshop', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = Bodyshop;
