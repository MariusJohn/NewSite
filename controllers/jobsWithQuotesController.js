// controllers/jobsWithQuotesController.js
import { Job, Quote, Bodyshop } from '../models/index.js';
import { getJobCounts } from './jobController.js';
import { Op } from 'sequelize';

export async function renderJobsWithQuotes(req, res) {
  try {
    const counts = await getJobCounts();

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
    jobs.forEach(job => {
      const createdAt = new Date(job.createdAt);
      job.daysPending = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
    });

    res.render('admin/jobs-quotes', {
      jobs,
      csrfToken: req.csrfToken(),
      remindedJobs: req.session.remindedJobs || [],
      ...counts
    });

  } catch (err) {
    console.error('❌ Error loading jobs with quotes:', err);
    res.status(500).send('Server error');
  }
}
