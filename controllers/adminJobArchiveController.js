// controllers/adminJobArchiveController.js
import { Job } from '../models/index.js';

// ARCHIVE JOB
export const archiveJob = async (req, res) => {
  const jobId = req.params.jobId;

  try {
    const job = await Job.findByPk(jobId);

    if (!job) return res.status(404).send('Job not found');

const isArchivable =
  job.status === 'rejected' ||
  (job.status === 'processed' && job.paid && job.selectedBodyshopId) ||
  (job.status === 'pending_payment' && job.paymentReminders >= 4);

const ADMIN_BASE = process.env.ADMIN_BASE;


 if (!isArchivable) {
console.log('🧪 Archive Check:', {
  status: job.status,
  paid: job.paid,
  selected: job.selectedBodyshopId,
  reminders: job.paymentReminders
});
  return res.status(400).send('Only rejected or paid & selected jobs can be archived.');
}


    await job.update({ status: 'archived' });
    return res.redirect(`/jobs${ADMIN_BASE}?filter=archived`);

  } catch (err) {
    console.error('❌ Failed to archive job:', err);
    res.status(500).send('Error archiving job');
  }
};

// GET Archived Jobs List
export const getArchivedJobs = async (req, res) => {
  try {
    const archivedJobs = await Job.findAll({
      where: { status: 'archived' },
      include: [{ model: Quote }, { model: Bodyshop, as: 'selectedBodyshop' }],
      order: [['updatedAt', 'DESC']]
    });

    res.render('admin/jobs-archived', {
      jobs: archivedJobs,
      currentPage: 'archived',
      archivedJobCount: archivedJobs.length,
      csrfToken: req.csrfToken()
    });
  } catch (err) {
    console.error('❌ Failed to load archived jobs:', err);
    res.status(500).send('Error loading archived jobs');
  }
};

// RESTORE JOB from Archive
export const restoreArchivedJob = async (req, res) => {
  const jobId = req.params.jobId;

  try {
    const job = await Job.findByPk(jobId);

    if (!job || job.status !== 'archived') {
      return res.status(400).send('Only archived jobs can be restored.');
    }

    // Determine where to send it back: usually 'processed' or 'rejected'
    let restoredStatus = 'approved';
    if (job.paid && job.selectedBodyshopId) {
      restoredStatus = 'processed';
    } else if (!job.paid && job.quotes?.length > 0) {
      restoredStatus = 'approved';
    } else {
      restoredStatus = 'rejected'; // fallback or adjust logic
    }

    await job.update({ status: restoredStatus });

    return res.redirect(`/jobs${ADMIN_BASE}?filter=${restoredStatus}`);
  } catch (err) {
    console.error('❌ Failed to restore job:', err);
    res.status(500).send('Error restoring job');
  }
};
