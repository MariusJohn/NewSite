//models/index.js
import Sequelize from 'sequelize';
import sequelize from '../config/database.js';

import { Job, Quote, Bodyshop } from './Associations.js'; // Associations already defined
import DeletedJobModel from './DeletedJob.js';

const DeletedJob = DeletedJobModel(sequelize, Sequelize.DataTypes);

export {
  sequelize,
  Sequelize,
  Job,
  Quote,
  Bodyshop,
  DeletedJob
};
