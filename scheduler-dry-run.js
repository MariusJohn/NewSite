// scheduler-dry-run.js
import { Job, Quote } from './models/index.js';
import { runSchedulerNow } from './scheduler.js';

(async () => {
  const jobs = await Job.findAll({
    include: [{ model: Quote, as: 'quotes' }]
  });

  const now = new Date();

  for (const job of jobs) {
    if (job.id === 37) continue;

    const quoteCount = job.quotes?.length || 0;
    const jobAgeMs = now - new Date(job.createdAt);
    const jobAgeHours = jobAgeMs / (1000 * 60 * 60);

    let newAgeHours = null;

    if (jobAgeHours < 24) {
      newAgeHours = 25;
    } else if (jobAgeHours >= 25 && jobAgeHours < 48) {
      newAgeHours = 49;
    } else if (jobAgeHours >= 49 && jobAgeHours < 72) {
      newAgeHours = 72;
    }

    if (newAgeHours !== null) {
      job.setDataValue('createdAt', new Date(now - newAgeHours * 60 * 60 * 1000));
      job.changed('createdAt', true);
      job.status = 'approved';
      job.extensionRequestedAt = null;

      await job.save({ silent: false });

      console.log(`✅ Job #${job.id} updated to ${newAgeHours}h old (${quoteCount} quotes)`);
    } else {
      console.log(`ℹ️ Job #${job.id} left unchanged (age: ${jobAgeHours.toFixed(2)}h, ${quoteCount} quotes)`);
    }
  }

  console.log('🚀 Running scheduler...');
  await runSchedulerNow();
})();
