// controllers/customerJobActionsController.js
import { Job, Bodyshop } from '../models/index.js';
import { sendHtmlMail } from '../utils/sendMail.js';



function getDistanceInKm(lat1, lon1, lat2, lon2) {
  const toRad = deg => deg * (Math.PI / 180);
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Handle unified job action (extend OR cancel)
const handleJobAction = async (req, res) => {
  try {
    const { jobId, token } = req.params;
    const job = await Job.findByPk(jobId);
    if (!job) return res.status(404).render('jobs/action-expired');

    const action = req.query.action;

    if (job.status === 'deleted' || (job.extendTokenUsed && job.cancelTokenUsed)) {
      return res.status(403).render('jobs/action-expired');
    }

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

      const allBodyshops = await Bodyshop.findAll({ where: { approved: true } });
      const RADIUS_KM = 16.1;
      const nearby = allBodyshops.filter(bs =>
        getDistanceInKm(job.latitude, job.longitude, bs.latitude, bs.longitude) <= RADIUS_KM
      );

      for (const bs of nearby) {
        await sendHtmlMail(
          bs.email,
          `Extension Notice – Job #${job.id}`,
          `<p>Hello ${bs.name},</p>
           <p>A nearby job has been extended by the customer.</p>
           <p><a href="${process.env.BASE_URL}/bodyshop/dashboard">Quote now</a></p>
           <p>– MC Quote</p>`
        );
      }

      return res.render('jobs/extension-confirmation', { job });
    }

    if (action === 'cancel') {
      if (job.cancelToken !== token || job.cancelTokenUsed || job.status === 'deleted') {
        return res.status(403).render('jobs/action-expired');
      }

      await job.update({
        status: 'deleted',
        cancelTokenUsed: true
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
