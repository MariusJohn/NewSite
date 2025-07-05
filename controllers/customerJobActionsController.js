// controllers/customerJobActionsController.js
import { Job, Bodyshop } from '../models/index.js';
import { sendHtmlEmail
 } from '../utils/sendMail.js';
import { deleteImagesFromS3 } from './imageCleanupController.js';
import { getBodyshopsWithinRadius } from './radiusTargetingController.js'; 

// Handle unified job action (extend OR cancel)
const handleJobAction = async (req, res) => {
  console.log('💡 handleJobAction triggered');

  try {
    const { jobId, token } = req.params;
    const job = await Job.findByPk(jobId);
    if (!job) return res.status(404).render('jobs/action-expired');

    const action = req.query.action;

    console.log({
      jobId: job.id,
      status: job.status,
      extendToken: job.extendToken,
      extendTokenUsed: job.extendTokenUsed,
      extended: job.extended,
      cancelToken: job.cancelToken,
      cancelTokenUsed: job.cancelTokenUsed,
      incomingToken: token,
      action
    });

    if (job.status === 'deleted' || (job.extendTokenUsed && job.cancelTokenUsed)) {
      return res.status(403).render('jobs/action-expired');
    }

    // === ✅ EXTEND LOGIC ===
    if (action === 'extend') {
      if (job.extendToken !== token || job.extendTokenUsed || job.extended) {
        return res.status(403).render('jobs/action-expired');
      }

      const newExpiry = new Date(job.quoteExpiry.getTime() + 24 * 60 * 60 * 1000);
      await job.update({
        quoteExpiry: newExpiry,
        extensionRequestedAt: new Date(),
        extensionCount: job.extensionCount + 1,
        extended: true,
        extendTokenUsed: true
      });

      // ✅ Use radius-aware controller to find matching bodyshops
      const nearby = await getBodyshopsWithinRadius(job.latitude, job.longitude);

      for (const bs of nearby) {
        await sendHtmlEmail
(
          bs.email,
          `Extension Notice – Job #${job.id}`,
          `<p>Hello ${bs.name},</p>
           <p>A nearby job has been extended by the customer.</p>
           <p><a href="${process.env.BASE_URL}/bodyshop/dashboard">Quote now</a></p>
           <p>– My Car Quote</p>`
        );
      }

      return res.render('jobs/extension-confirmation', { job });
    }

    // === ✅ CANCEL LOGIC ===
    if (action === 'cancel') {
      if (job.cancelToken !== token || job.cancelTokenUsed || job.status === 'deleted') {
        return res.status(403).render('jobs/action-expired');
      }

      await deleteImagesFromS3(job.images);

      await job.update({
        status: 'deleted',
        cancelTokenUsed: true,
        images: []
      });

      return res.render('jobs/deleted', { job });
    }

    return res.status(400).render('jobs/action-expired');

  } catch (err) {
    console.error('❌ Job action error:', err);
    return res.status(500).render('jobs/action-expired');
  }
};

export {
  handleJobAction 
};
