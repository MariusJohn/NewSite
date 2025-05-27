// controllers/customerJobActionsController.js
import { Job } from '../models/index.js';

// GET: Extend Job Quote Time
export const extendJobQuoteTime = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.jobId);

    if (!job) return res.status(404).send('Job not found.');
    if (job.extended) return res.send('This job has already been extended once.');

    const newExpiry = new Date(job.quoteExpiry.getTime() + 24 * 60 * 60 * 1000);

    await job.update({
      quoteExpiry: newExpiry,
      extensionRequestedAt: new Date(),
      extensionCount: job.extensionCount + 1,
      extended: true
    });

    res.render('jobs/extension-confirmation', { job });
  } catch (err) {
    console.error('Error extending job:', err);
    res.status(500).send('Server error.');
  }
};

// GET: Cancel Job (Confirmation Page)
export const showCancelJobPage = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.jobId);
    if (!job) return res.status(404).send('Job not found.');

    res.render('jobs/cancel-confirm', { job });
  } catch (err) {
    console.error('Error loading cancel confirmation:', err);
    res.status(500).send('Server error.');
  }
};

// POST: Cancel Job (Perform Delete)
export const cancelJob = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.jobId);
    if (!job) return res.status(404).send('Job not found.');

    await job.update({ status: 'deleted' });
    res.render('jobs/deleted', { job });
  } catch (err) {
    console.error('Error cancelling job:', err);
    res.status(500).send('Server error.');
  }
};
