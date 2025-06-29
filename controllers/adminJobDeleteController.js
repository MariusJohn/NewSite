import { Job, Quote } from '../models/index.js';

export const softDeleteQuotedJob = async (req, res) => {
  const { jobId } = req.params;

  try {
    const job = await Job.findByPk(jobId, { include: [Quote] });

    if (!job) {
      return res.status(404).send('Job not found');
    }

    // Recalculate daysPending
    const createdAt = new Date(job.createdAt);
    const now = new Date();
    const diffDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

    const hasQuotes = job.quotes?.length > 0;
    const isUnpaid = !job.paid;
    const isOverdue = diffDays >= 2;

    console.log({
      jobId,
      quotesCount: job.quotes.length,
      paid: job.paid,
      daysPending: diffDays,
      hasQuotes,
      isUnpaid,
      isOverdue
    });

    if (!(hasQuotes && isUnpaid && isOverdue)) {
      return res.status(400).send('Only unpaid and overdue quoted jobs can be deleted');
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
