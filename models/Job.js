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
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    longitude: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    images: {
        type: DataTypes.ARRAY(DataTypes.STRING), 
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
    },
    // New Fields for Quotes Submenu
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ''
    },
    approvalDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    lastActionDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
    },
    viewed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    quoteStatus: {
        type: DataTypes.ENUM('no_quotes', 'quoted', 'actioned', 'approved'),
        defaultValue: 'no_quotes',
        allowNull: false
    },
    daysPending: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    timestamps: true,
    hooks: {
        beforeUpdate: (job, options) => {
            if (!job.approvalDate && job.status === 'approved') {
                job.approvalDate = new Date();
            }
            job.lastActionDate = new Date();
        }
    }
});

// Associations
Job.associate = (models) => {
    Job.hasMany(models.Quote, { foreignKey: 'jobId', onDelete: 'CASCADE' });
    Job.belongsTo(models.Bodyshop, { foreignKey: 'selectedBodyshopId', as: 'selectedBodyshop' });
};

module.exports = Job;