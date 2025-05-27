//Model index.js
import Sequelize from 'sequelize';
import sequelize from '../config/database.js';

import Job from './Job.js';
import Quote from './Quote.js';
import Bodyshop from './Bodyshop.js';
import DeletedJobModel from './DeletedJob.js';

const DeletedJob = DeletedJobModel(sequelize, Sequelize.DataTypes);

Job.hasMany(Quote, { foreignKey: 'jobId', as: 'quotes', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Quote.belongsTo(Job, { foreignKey: 'jobId', as: 'job', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

Bodyshop.hasMany(Quote, { foreignKey: 'bodyshopId', as: 'bodyshopQuotes', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Quote.belongsTo(Bodyshop, { foreignKey: 'bodyshopId', as: 'bodyshop', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

Bodyshop.hasMany(Job, { foreignKey: 'selectedBodyshopId', as: 'assignedJobs', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
Job.belongsTo(Bodyshop, { foreignKey: 'selectedBodyshopId', as: 'selectedBodyshop', onDelete: 'SET NULL', onUpdate: 'CASCADE' });

export {
  sequelize,
  Sequelize,
  Job,
  Quote,
  Bodyshop,
  DeletedJob
};
