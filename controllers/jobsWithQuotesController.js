// controllers/jobsWithQuotesController.js
import { Job, Quote, Bodyshop } from '../models/index.js';
import { getJobCounts } from './jobController.js';
import { Op } from 'sequelize';

export async function renderJobsWithQuotes(req, res) {
  try {
    const counts = await getJobCounts();
    const ADMIN_BASE = process.env.ADMIN_BASE;

    const jobs = await Job.findAll({
      where: {
        [Op.and]: [
          { status: { [Op.notIn]: ['deleted', 'rejected'] } },
          { '$quotes.id$': { [Op.ne]: null } }
        ]
      },
      include: [{
        model: Quote,
        as: 'quotes',
        required: true,
        include: [{
          model: Bodyshop,
          as: 'bodyshop'
        }]
      }],
      order: [['createdAt', 'DESC']]
    });
    

const now = new Date();
const plainJobs = jobs.map(job => {
  const plainJob = job.get({ plain: true });
  const createdAt = new Date(plainJob.createdAt);
  plainJob.daysPending = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

    console.log(`Job ID ${plainJob.id} → Days Pending: ${plainJob.daysPending}, Paid: ${plainJob.paid}, Quotes: ${plainJob.quotes.length}, Status: ${plainJob.status}`);

  return plainJob;
});

res.render('admin/jobs-quotes', {
  jobs: plainJobs,
  csrfToken: req.csrfToken(),
  remindedJobs: req.session.remindedJobs || [],
  ADMIN_BASE,
  ...counts
});

  } catch (err) {
    console.error('❌ Error loading jobs with quotes:', err);
    res.status(500).send('Server error');
  }
}
