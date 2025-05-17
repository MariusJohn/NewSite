// models/Quote.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const Job = require('./Job');

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
    }
}, {
    sequelize,
    modelName: 'Quote',
    timestamps: true
});

// Associations
Quote.associate = (models) => {
    Quote.belongsTo(models.Job, { foreignKey: 'jobId', as: 'Job', onDelete: 'CASCADE' });
    Quote.belongsTo(models.Bodyshop, { foreignKey: 'bodyshopId', as: 'Bodyshop', onDelete: 'CASCADE' });
};

// Hooks to update job quote count and status
Quote.addHook('afterCreate', async (quote, options) => {
    const job = await Job.findByPk(quote.jobId);
    if (job) {
        // Update the quote count
        const quoteCount = await Quote.count({ where: { jobId: job.id } });
        job.quoteCount = quoteCount;

        // Update the quote status
        if (quoteCount === 1) {
            job.quoteStatus = 'quoted';
        } else if (quoteCount > 1) {
            job.quoteStatus = 'actioned';
        }

        await job.save();
    }
});

Quote.addHook('afterDestroy', async (quote, options) => {
    const job = await Job.findByPk(quote.jobId);
    if (job) {
        // Update the quote count
        const quoteCount = await Quote.count({ where: { jobId: job.id } });
        job.quoteCount = quoteCount;

        // Reset the quote status if no quotes remain
        if (quoteCount === 0) {
            job.quoteStatus = 'no_quotes';
        } else if (quoteCount === 1) {
            job.quoteStatus = 'quoted';
        } else {
            job.quoteStatus = 'actioned';
        }

        await job.save();
    }
});

module.exports = Quote;