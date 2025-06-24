//controllers/adminJobsController.js
import { Job, Quote, Bodyshop } from '../models/index.js';
import { Parser } from 'json2csv';
import { sendHtmlMail } from '../utils/sendMail.js';

// === Helper: Haversine Distance ===
function getDistanceInKm(lat1, lon1, lat2, lon2) {
  const toRad = deg => deg * (Math.PI / 180);
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ✅ Export Jobs with Quotes to CSV
export async function exportJobsWithQuotesCSV(req, res) {
  try {
    const jobs = await Job.findAll({
      include: [{
        model: Quote,
        as: 'quotes',
        required: true,
        include: [{
          model: Bodyshop,
          as: 'bodyshop',
          attributes: ['name', 'postcode']  // ✅ keep postcode, not email
        }]
      }]
    });

    const data = [];

    jobs.forEach(job => {
      job.quotes.forEach(quote => {
        data.push({
          JobID: job.id,
          CustomerName: job.customerName,
          CustomerEmail: job.customerEmail,
          Location: job.location,
          QuotePrice: quote.price,
          QuoteNotes: quote.notes,
          QuoteDate: quote.createdAt,
          Selected: job.selectedBodyshopId === quote.bodyshopId ? 'Yes' : '',
          Bodyshop: quote.bodyshop?.name,
          BodyshopPostcode: quote.bodyshop?.postcode
        });
      });
    });

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment('jobs-with-quotes.csv');
    res.send(csv);
  } catch (err) {
    console.error('❌ Failed to export CSV:', err);
    res.status(500).send('Failed to generate CSV');
  }
}

// ✅ Manual  Reminder to Nearby Bodyshops (for specific job)
export async function remindBodyshops(req, res) {
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

        // ✅ Store reminder status in session
        if (!req.session.remindedJobs) req.session.remindedJobs = [];
        if (!req.session.remindedJobs.includes(job.id)) {
          req.session.remindedJobs.push(job.id);
        }

    console.log(`✅ Reminder sent to ${nearbyShops.length} bodyshops for Job #${job.id}`);
    res.redirect('/jobs/admin/quotes');
  } catch (err) {
    console.error('❌ Reminder error:', err);
    res.status(500).send('Error sending reminders.');
  }
}

// ✅ Send Reminder to Bodyshops (for all unselected jobs)
export async function remindUnselectedJobs(req, res) {
  try {
    const jobs = await Job.findAll({
      include: [{
        model: Quote,
        as: 'quotes',
        required: true,
        include: [{
          model: Bodyshop,
          as: 'bodyshop'
        }]
      }],
      where: {
        selectedBodyshopId: null
      }
    });

    for (const job of jobs) {
      for (const quote of job.quotes) {
        if (quote.bodyshop?.email) {
          await sendHtmlMail(
            quote.bodyshop.email,
            `Reminder: Job #${job.id} still open for customer`,
            `<p>The customer has not yet selected a bodyshop.</p>
             <p><strong>Quote:</strong> £${quote.price}</p>
             <p><strong>Notes:</strong> ${quote.notes}</p>
             <p><a href="${process.env.BASE_URL}/bodyshop/dashboard">Review or update your quote</a></p>`
          );
        }
      }
    }

    res.send('Reminders sent to bodyshops for unselected jobs.');
  } catch (err) {
    console.error('❌ Failed to send reminders:', err);
    res.status(500).send('Reminder job failed');
  }
}
