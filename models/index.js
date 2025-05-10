// models/index.js
const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const JobModel = require('./Job');
const QuoteModel = require('./Quote');
const BodyshopModel = require('./Bodyshop');

const Job = JobModel;
const Quote = QuoteModel;
const Bodyshop = BodyshopModel;

Job.hasMany(Quote, { foreignKey: 'jobId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Quote.belongsTo(Job, { foreignKey: 'jobId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

Bodyshop.hasMany(Quote, { foreignKey: 'bodyshopId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Quote.belongsTo(Bodyshop, { foreignKey: 'bodyshopId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

module.exports = {
  sequelize,
  Job,
  Quote,
  Bodyshop
};