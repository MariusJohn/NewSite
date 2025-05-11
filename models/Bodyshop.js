// models/Bodyshop.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Bodyshop extends Model {}

Bodyshop.init({
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    area: {
        type: DataTypes.STRING,
        allowNull: false
    },
    latitude: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    longitude: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    radius: {
        type: DataTypes.FLOAT,
        defaultValue: 10
    },
    verificationToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    resetToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    resetTokenExpiry: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'Bodyshop',
    timestamps: true
});

module.exports = Bodyshop;