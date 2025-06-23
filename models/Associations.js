import Job from './Job.js';
import Quote from './Quote.js';
import Bodyshop from './Bodyshop.js';

// === ASSOCIATIONS ===
Job.hasMany(Quote, { as: 'quotes', foreignKey: 'jobId', onDelete: 'CASCADE' });
Quote.belongsTo(Job, { foreignKey: 'jobId', as: 'job' }); // Optional but clean

Bodyshop.hasMany(Quote, { foreignKey: 'bodyshopId', onDelete: 'CASCADE', as: 'bodyshopQuotes' });
Quote.belongsTo(Bodyshop, { foreignKey: 'bodyshopId', as: 'bodyshop' }); // ✅ Required for admin include

Job.belongsTo(Bodyshop, { as: 'selectedBodyshop', foreignKey: 'selectedBodyshopId' });

export { Job, Quote, Bodyshop };
