// models/Quote.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Quote extends Model {}

Quote.init({
    bodyshopId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Bodyshops',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    jobId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Jobs',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
            min: 0
        }
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'Quote',
    timestamps: true
});

module.exports = Quote;