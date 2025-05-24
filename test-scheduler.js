import { Job } from './models/index.js';
import { runSchedulerNow } from './scheduler.js';

(async () => {
  const jobs = await Job.findAll();

  for (const job of jobs) {
    job.createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000); // simulate 25h old
    job.status = 'approved';
    job.extensionRequestedAt = null;
    await job.save();
  }

  await runSchedulerNow();
})();