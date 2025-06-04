// utils/jobStatusHelper.js
import { Job, Quote } from '../models/index.js';

export async function syncJobStatus(jobId) {
  try {
    const job = await Job.findByPk(jobId, {
      include: ['quotes'],
    });

    if (!job) return;

    const quoteCount = job.quotes.length;
    const isPaid = job.paid;
    const hasSelection = job.selectedBodyshopId !== null;
    const now = new Date();

    let newStatus;

    if (hasSelection && isPaid) {
      newStatus = 'processed';
    } else if (isPaid && !hasSelection) {
      const hoursSinceFinalRequest = job.finalDecisionRequestedAt
        ? (now - new Date(job.finalDecisionRequestedAt)) / (1000 * 60 * 60)
        : 0;

      newStatus = hoursSinceFinalRequest > 48 ? 'waiting_customer_selection' : 'paid';
    } else if (quoteCount > 0) {
      newStatus = 'quoted';
    } else {
      newStatus = 'approved';
    }

    if (job.status !== newStatus) {
      await Job.update({ status: newStatus }, { where: { id: jobId } });
      console.log(`✅ Job #${jobId} status updated to: ${newStatus}`);
    }
  } catch (err) {
    console.error(`❌ Failed to sync job status for Job #${jobId}:`, err);
  }
}
