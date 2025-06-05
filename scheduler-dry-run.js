// scheduler-dry-run.js
import { Job, Quote } from './models/index.js';
import { runSchedulerNow } from './scheduler.js';

(async () => {
  // Find a job with 0 quotes
  const jobs = await Job.findAll({
    include: [{ model: Quote, as: 'quotes' }]
  });

  for (const job of jobs) {
    // Skip job 37 to preserve your manual 49h update
    if (job.id === 37) continue;
  
    if ((job.quotes?.length || 0) === 0) {
      job.setDataValue('createdAt', new Date(Date.now() - 25 * 60 * 60 * 1000));
      job.changed('createdAt', true);
  
      job.status = 'approved';
      job.extensionRequestedAt = null;
  
      await job.save({ silent: false });
      console.log(`✅ Updated Job #${job.id} to be 25h old with 0 quotes`);
    }
  }
  


  // Run scheduler without dry-run
  await runSchedulerNow();
})();
