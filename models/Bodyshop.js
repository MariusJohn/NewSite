// models/Bodyshop.js
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Quote from './Quote.js';

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
    phone: {
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
        allowNull: false,
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
    adminApproved: {
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
    },
    lastReminderSent: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'Bodyshop',
    timestamps: true
});

// Associations (must be defined after all models are imported)
Bodyshop.hasMany(Quote, { foreignKey: 'bodyshopId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Quote.belongsTo(Bodyshop, { foreignKey: 'bodyshopId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

export default Bodyshop;