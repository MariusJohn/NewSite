// models/Bodyshop.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Bodyshop = sequelize.define('Bodyshop', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  area: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = Bodyshop;
