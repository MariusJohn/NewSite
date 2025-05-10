// models/Job.js
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
    customerPhone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false
    },
    latitude: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    longitude: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    images: {
        type: DataTypes.ARRAY(DataTypes.STRING), // Correct for PostgreSQL
        allowNull: false,
        defaultValue: []
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'allocated', 'completed', 'rejected', 'archived', 'deleted'),
        defaultValue: 'pending',
        allowNull: false
    },
    selectedBodyshopId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    paid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true
});

module.exports = Job;