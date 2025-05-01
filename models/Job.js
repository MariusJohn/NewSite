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
    type: DataTypes.TEXT,  // store JSON stringified list of image URLs
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'allocated', 'completed'),
    defaultValue: 'pending'
  },
  selectedBodyshopId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

module.exports = Job;
