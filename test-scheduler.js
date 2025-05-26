import { Job, Quote } from './models/index.js';
import { runSchedulerNow } from './scheduler.js';

(async () => {
  // Find a job with 0 quotes
  const jobs = await Job.findAll({ include: [{ model: Quote, as: 'quotes' }] });

  for (const job of jobs) {
    if ((job.quotes?.length || 0) === 0) {
      job.createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25h old
      job.status = 'approved';
      job.extensionRequestedAt = null;
      await job.save();
      console.log(`Updated Job #${job.id} to be 25h old with 0 quotes`);
      break; // update only one
    }
  }

  await runSchedulerNow();
})();