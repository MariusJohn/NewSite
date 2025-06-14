// controllers/adminJobDeleteController.js

import { Job } from '../models/index.js';

export const softDeleteProcessedJob = async (req, res) => {
  const { jobId } = req.params;

  try {
    const job = await Job.findByPk(jobId);

    if (!job) {
      return res.status(404).send('Job not found');
    }

    if (job.status !== 'processed') {
      return res.status(400).send('Only processed jobs can be deleted');
    }

    job.status = 'deleted';
    job.updatedAt = new Date();
    await job.save();

    console.log(`🗑️ Soft deleted job #${job.id}`);
    res.redirect('/jobs/admin/quotes');
  } catch (err) {
    console.error('❌ Error during soft delete:', err);
    res.status(500).send('Error deleting job');
  }
};
