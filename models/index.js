const sequelize = require('../config/database');
const Job = require('./Job');
const Quote = require('./Quote');
const Bodyshop = require('./Bodyshop');

// Relations
Job.hasMany(Quote, { foreignKey: 'jobId' });
Quote.belongsTo(Job, { foreignKey: 'jobId' });

Bodyshop.hasMany(Quote, { foreignKey: 'bodyshopId' });
Quote.belongsTo(Bodyshop, { foreignKey: 'bodyshopId' });

module.exports = {
  sequelize,
  Job,
  Quote,
  Bodyshop
};
