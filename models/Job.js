const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Job = sequelize.define('Job', {
  customerName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  customerEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  images: {
    type: DataTypes.TEXT, 
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'allocated', 'completed'),
    defaultValue: 'pending'
  },
  selectedBodyshopId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
  
});

module.exports = Job;
