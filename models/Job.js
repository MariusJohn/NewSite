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
    radius: {
        type: DataTypes.FLOAT,
        defaultValue: 10
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
    },
    quoteExpiry: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: () => new Date(Date.now() + 48 * 60 * 60 * 1000)  // 48 hours from job creation
    },
    extensionRequestedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    extended: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    quoteCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    extensionCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    customerDecision: {
        type: DataTypes.ENUM('waiting', 'accepted', 'rejected', 'pending_payment'),
        defaultValue: 'waiting',
        allowNull: false
    }
}, {
    timestamps: true,
    hooks: {
        beforeCreate: (job, options) => {
  
            if (!job.quoteExpiry) {
                job.quoteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);
            }
        },
        beforeUpdate: (job, options) => {
            job.lastActionDate = new Date();
        }
    }
});

// Associations
Job.associate = (models) => {
    Job.hasMany(models.Quote, {
        foreignKey: 'jobId',
        as: 'quotes',
        onDelete: 'CASCADE'
    });
    Job.belongsTo(models.Bodyshop, {
        foreignKey: 'selectedBodyshopId',
        as: 'selectedBodyshop',
        onDelete: 'SET NULL'
    });
};
module.exports = Job;