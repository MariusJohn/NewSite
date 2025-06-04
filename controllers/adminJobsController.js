//controllers/adminJobController.js
import { Job, Quote, Bodyshop } from '../models/index.js';
import { sendHtmlMail } from '../utils/sendMail.js';


// Helper: Calculate distance in km
function getDistanceInKm(lat1, lon1, lat2, lon2) {
  const toRad = deg => deg * (Math.PI / 180);
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ✅ View Jobs with Quotes
export const showJobsWithQuotes = async (req, res) => {
  try {
    const jobs = await Job.findAll({
      where: { paid: false },
      include: [
        {
          model: Quote,
          include: [Bodyshop],
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.render('admin/jobs-quotes', { jobs });
  } catch (err) {
    console.error('❌ Failed to load jobs with quotes:', err);
    res.status(500).send('Error loading jobs.');
  }
};

// ✅ Send Reminder to Nearby Bodyshops
export const remindBodyshops = async (req, res) => {
  const { jobId } = req.params;
  try {
    const job = await Job.findByPk(jobId);
    if (!job || !job.latitude || !job.longitude) {
      throw new Error('Missing job or location data.');
    }

    const allBodyshops = await Bodyshop.findAll({
      where: { adminApproved: true, verified: true }
    });

    const RADIUS_KM = 16.1;
    const nearbyShops = allBodyshops.filter(bs =>
      bs.latitude && bs.longitude &&
      getDistanceInKm(job.latitude, job.longitude, bs.latitude, bs.longitude) <= RADIUS_KM
    );

    for (const bs of nearbyShops) {
      await sendHtmlMail(
        bs.email,
        `Reminder: New Quote Request - Job #${job.id}`,
        `<p>Please log in and quote for Job #${job.id}.</p>`
      );
    }

    console.log(`✅ Reminder sent to ${nearbyShops.length} bodyshops for Job #${job.id}`);
    res.redirect('/admin/jobs/quotes');

  } catch (err) {
    console.error('❌ Reminder error:', err);
    res.status(500).send('Error sending reminders.');
  }
};
