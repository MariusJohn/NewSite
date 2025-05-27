// controllers/jobController.js
import { Op } from 'sequelize';
import { Job, Quote, Bodyshop } from '../models/index.js'; // Ensure correct path to your models

// Define aliases for clarity, matching your index.js associations
const QUOTES_ALIAS = 'quotes'; // For Job.hasMany(Quote)
const SELECTED_BODYSHOP_ALIAS = 'selectedBodyshop'; // For Job.belongsTo(Bodyshop)

/**
 * Builds the WHERE and INCLUDE clauses for fetching jobs based on filter.
 * @param {string} filter The filter string ('total', 'live', 'quotes', etc.)
 * @returns {object} An object containing whereClause and includeClause.
 */
export const getJobFilterOptions = (filter) => {
  let whereClause = {};
  let includeClause = [];

  switch (filter) {
    case 'total':
      // All jobs that are not 'deleted'
      whereClause.status = { [Op.not]: 'deleted' };
      break;

    case 'live':
      // Only pending jobs for admin approval or rejection
      whereClause.status = 'pending';
      break;

    case 'approved':
      // Only approved jobs (before they are paid)
      whereClause.status = 'approved';
      break;

    case 'rejected':
      // Only rejected jobs
      whereClause.status = 'rejected';
      break;

    case 'archived':
      // Only archived jobs
      whereClause.status = 'archived';
      break;

    case 'deleted':
      // Only deleted jobs
      whereClause.status = 'deleted';
      break;

    case 'quotes':
      // Jobs with quotes AND unpaid
      whereClause.paid = false;
      includeClause.push({
        model: Quote,
        as: QUOTES_ALIAS, // *** IMPORTANT: Use the alias here ***
        required: true // Ensures only jobs with at least one quote are returned
      });
      break;

    case 'processed':
      // Jobs with quotes AND paid, showing the allocated bodyshop
      whereClause.paid = true;
      includeClause.push(
        {
          model: Quote,
          as: QUOTES_ALIAS, // *** IMPORTANT: Use the alias here ***
          required: false // Include quotes if they exist
        },
        {
          model: Bodyshop,
          as: SELECTED_BODYSHOP_ALIAS, // *** IMPORTANT: Use the alias here ***
          required: true // Ensures only jobs with an allocated bodyshop are returned
        }
      );
      break;

    default:
      whereClause.status = { [Op.not]: 'deleted' }; // fallback to total
      break;
  }

  

  return { whereClause, includeClause };
};

/**
 * Fetches counts for various job filters.
 * @returns {object} An object containing all job counts.
 */
export const getJobCounts = async () => {
  const totalCount = await Job.count({ where: { status: { [Op.not]: 'deleted' } } });
  const liveCount = await Job.count({ where: { status: 'pending' } });
  const approvedCount = await Job.count({ where: { status: 'approved' } });
  const rejectedCount = await Job.count({ where: { status: 'rejected' } });
  const archivedCount = await Job.count({ where: { status: 'archived' } });
  const deletedCount = await Job.count({ where: { status: 'deleted' } });

  // For 'Jobs with quotes' count: jobs that are unpaid and have at least one quote
  const quotesCount = await Job.count({
    where: { paid: false },
    include: [{ model: Quote, as: QUOTES_ALIAS, required: true }]
  });

  // For 'Jobs processed' count: jobs that are paid
  const processedCount = await Job.count({ where: { paid: true } });

  return {
    totalCount,
    liveCount,
    approvedCount,
    rejectedCount,
    archivedCount,
    deletedCount,
    quotesCount,
    processedCount
  };
};