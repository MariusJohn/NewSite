import { Job, Quote } from './models/index.js';
import { runSchedulerNow } from './scheduler.js';

(async () => {
  // Find a job with 0 quotes
  const jobs = await Job.findAll({ include: [{ model: Quote, as: 'quotes' }] });

  for (const job of jobs) {
    if ((job.quotes?.length || 0) === 0) {
      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
      job.setDataValue('createdAt', twentyFiveHoursAgo); // ✅ force override
      job.status = 'approved';
      job.extensionRequestedAt = null;
  
      await job.save({ silent: true }); // ✅ skips updatedAt update
      console.log(`✅ Updated Job #${job.id} to be 25h old with 0 quotes`);
      break; // update only one
    }
  }
  

  await runSchedulerNow();
})();