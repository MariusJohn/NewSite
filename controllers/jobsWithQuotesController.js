// controllers/jobsWithQuotesController.js
import { Job, Quote, Bodyshop } from '../models/index.js';
import { Parser } from 'json2csv';
import { sendHtmlMail } from '../utils/sendMail.js';
import { getJobCounts } from './jobController.js';


export async function renderJobsWithQuotes(req, res) {
  try {
    const counts = await getJobCounts();

    const jobs = await Job.findAll({
      include: [{
        model: Quote,
        as: 'quotes',
        required: true,
        include: [{
          model: Bodyshop,
          as: 'bodyshop' 
        }]
      }]
    });

    res.render('admin/jobs-quotes', { 
              jobs,
              csrfToken: req.csrfToken() ,
              ...counts
     });
  } catch (err) {
    console.error('❌ Error loading jobs with quotes:', err);
    res.status(500).send('Server error');
  }
}


export async function exportJobsWithQuotesCSV(req, res) {
  try {
    const jobs = await Job.findAll({
      include: [{
        model: Quote,
        as: 'quotes',
        required: true,
        include: [{ model: Bodyshop,
          as: 'bodyshop'
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
          BodyshopEmail: quote.bodyshop?.email,
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

export async function remindUnselectedJobs(req, res) {
  try {
    const jobs = await Job.findAll({
      include: [{
        model: Quote,
        as: 'quotes',
        required: true,
        include: [{ model: Bodyshop,
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
