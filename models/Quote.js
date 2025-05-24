// models/Quote.js
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

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
    status: {
        type: DataTypes.ENUM('pending', 'won', 'lost', 'under_review', 'expired'),
        allowNull: false,
        defaultValue: 'pending'
    }
}, {
    sequelize,
    modelName: 'Quote',
    timestamps: true
});

export default Quote;