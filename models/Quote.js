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
    viewed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    actioned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    lastActionDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
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

// Associations
Quote.associate = (models) => {
    Quote.belongsTo(models.Job, { foreignKey: 'jobId', onDelete: 'CASCADE' });
    Quote.belongsTo(models.Bodyshop, { foreignKey: 'bodyshopId', onDelete: 'CASCADE' });
};

module.exports = Quote;