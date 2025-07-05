// scheduler.js
import cron from 'node-cron';
import ejs from 'ejs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { DeletedJob, Job, Quote, Bodyshop } from './models/index.js';
import { sendMonthlyProcessedReport } from './controllers/monthlyReportController.js';
import { getBodyshopsWithinRadius } from './controllers/radiusTargetingController.js';
import { sendHtmlEmail } from './utils/sendMail.js';
import { deleteImagesFromS3 } from './controllers/imageCleanupController.js';


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EMAIL_VIEWS_PATH = path.join(__dirname, 'views', 'email');
const baseUrl = process.env.BASE_URL || 'https://mcquote.co.uk';



async function sendCustomerNoQuotesEmail(job) {
  const html = await ejs.renderFile(path.join(EMAIL_VIEWS_PATH, 'no-quotes.ejs'), {
    customerName: job.customerName,
    job,
    extendUrl: `${baseUrl}/jobs/action/${job.id}/${job.extendToken}?action=extend`,
    cancelUrl: `${baseUrl}/jobs/action/${job.id}/${job.cancelToken}?action=cancel`
  });
  await sendHtmlEmail(job.customerEmail, `Update on Your Job #${job.id} - No Quotes Received`, html);
}

async function sendCustomerSingleQuoteEmail(job, remaining) {
  const html = await ejs.renderFile(path.join(EMAIL_VIEWS_PATH, 'single-quote.ejs'), {
    customerName: job.customerName,
    job,
    remaining,
    extendUrl: `${baseUrl}/jobs/action/${job.id}/${job.extendToken}?action=extend`,
    cancelUrl: `${baseUrl}/jobs/action/${job.id}/${job.cancelToken}?action=cancel`,
    paymentUrl: `${baseUrl}/payment?jobId=${job.id}`,
    newRequestUrl: `${baseUrl}/jobs/upload`,  
    homeUrl: baseUrl  
  });
  await sendHtmlEmail(job.customerEmail, `1 Quote Received for Job #${job.id}`, html);
}

async function sendCustomerMultipleQuotesEmail(job, remaining) {
  const html = await ejs.renderFile(path.join(EMAIL_VIEWS_PATH, 'multiple-quotes.ejs'), {
    customerName: job.customerName,
    job,
    remaining,
    baseUrl,
    paymentUrl: `${baseUrl}/payment?jobId=${job.id}`,
    newRequestUrl: `${baseUrl}/jobs/upload`,
    homeUrl: baseUrl,
  });
  await sendHtmlEmail(job.customerEmail, `Quotes Ready for Job #${job.id}`, html);
}

async function sendCustomerPaymentEmail(job) {
  const html = await ejs.renderFile(path.join(EMAIL_VIEWS_PATH, 'payment-request.ejs'), {
    customerName: job.customerName,
    job,
    paymentUrl: `${baseUrl}/payment?jobId=${job.id}`,
    homeUrl: `${baseUrl}/`,
    logoUrl: `${baseUrl}/img/logo-true.svg`,
    newRequestUrl: `${baseUrl}/jobs/upload`
  });

  await sendHtmlEmail(job.customerEmail, `Quotes Ready for Job #${job.id} – View Now`, html);
  job.status = 'pending_payment';
  await job.save();
}

export { sendCustomerPaymentEmail };


async function sendCustomerJobDeletedEmail(job) {
  const html = await ejs.renderFile(path.join(EMAIL_VIEWS_PATH, 'job-deleted.ejs'), {
    customerName: job.customerName,
    job,
    logoUrl: `${baseUrl}/img/logo-true.svg`,
    homeUrl: `${baseUrl}/`,
    newRequestUrl: `${baseUrl}/jobs/upload`
  });
  await sendHtmlEmail(job.customerEmail, `Job #${job.id} Removed – No Quotes Received`, html);
}

export async function runSchedulerNow() {
  if (global.schedulerRunning) {
    console.log('⛔ Scheduler already running. Skipping...');
    return;
  }

  // const day = new Date().getDay(); // 0 = Sunday, 6 = Saturday
  // if (day === 0 || day === 6) {
  //   console.log('📆 Weekend detected – skipping scheduler run.');
  //   return;
  // }

  global.schedulerRunning = true;



  const dryRun = process.argv.includes('--dry-run');

  console.log('=== Scheduler started ===');
  if (dryRun) console.log('=== DRY RUN MODE ENABLED ===');

  const summary = {
    earlyEmails: [],
    noQuotes: [],
    oneQuote: [],
    multiQuotes: [],
    paymentRequested: [],
    jobsDeleted: [],
    jobsArchived: []
  };

  try {
    const now = new Date();
    const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const cutoff48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const cutoff72h = new Date(now.getTime() - 72 * 60 * 60 * 1000);

    const jobs = await Job.findAll({
      where: { status: 'approved' },
      include: [{ model: Quote, as: 'quotes' }]
    });

    for (const job of jobs) {
      const quoteCount = await Quote.count({ where: { jobId: job.id } });
      const bodyshopsInRange = await Bodyshop.count({ where: { area: job.location } });
      const remaining = Math.max(0, bodyshopsInRange - quoteCount);
      const jobAgeMinutes = Math.floor((now - new Date(job.createdAt)) / 60000);
      

    // === EARLY TRIGGER ===
    if (
       quoteCount >= 3 &&
      jobAgeMinutes >= 10 &&
      !job.paid &&
      job.status !== 'pending_payment'
    ) {
      if (!dryRun) await sendCustomerPaymentEmail(job);
      summary.earlyEmails.push(job.id);
      continue;
    }

      
     // === 0–24h LOGIC ===
    if (job.createdAt <= cutoff24h && !job.emailSentAt) {
      try {
        // 🔁 Reminder to bodyshops (only if 0 or 1 quotes)
        if (quoteCount <= 1) {
          const nearbyBodyshops = await getBodyshopsWithinRadius(job.latitude, job.longitude);

          for (const shop of nearbyBodyshops) {
            const alreadyQuoted = await Quote.findOne({ where: { jobId: job.id, bodyshopId: shop.id } });
            if (alreadyQuoted) {
              console.log(`⏭️ Skipping ${shop.email} (already quoted Job #${job.id})`);
              continue;
            }

            const html = await ejs.renderFile(
              path.join(EMAIL_VIEWS_PATH, 'bodyshop-reminder.ejs'),
              {
                bodyshopName: shop.name,
                job,
                distance: Math.round(shop.distance),
                baseUrl
              }
            );

            if (!dryRun) {
              await sendHtmlEmail(shop.email, `🚗 New Job Nearby (${Math.round(shop.distance)} mi)`, html);
            }

            console.log(`📨 Reminder sent to ${shop.email} for Job #${job.id}`);
          }
        }

        // 📨 Customer-facing emails
        if (quoteCount === 0) {
          await sendCustomerNoQuotesEmail(job);
          summary.noQuotes.push(job.id);
        } else if (quoteCount === 1) {
          await sendCustomerSingleQuoteEmail(job, remaining);
          summary.oneQuote.push(job.id);
        } else if (quoteCount >= 2) {
          await sendCustomerMultipleQuotesEmail(job, remaining);
          summary.multiQuotes.push(job.id);
        }

        job.extensionRequestedAt = now;
        job.emailSentAt = now;
        await job.save();
      } catch (err) {
        console.error(`❌ Failed to process 0–24h logic for Job #${job.id}:`, err);
      }

      continue;
    }

       // === 24–48h LOGIC ===
        if (
          job.createdAt > cutoff48h &&
          job.createdAt <= cutoff24h &&
          !job.paid &&
          job.extended &&
          quoteCount >= 2 &&
          job.status !== 'pending_payment'
        ) {
          if (!dryRun) await sendCustomerPaymentEmail(job);
          summary.paymentRequested.push(job.id);
          continue;
        }
      
         // === 48h+ LOGIC ===
           if (quoteCount === 0 && !job.finalExtended) {
          job.extended = true;
          job.finalExtended = true; 
          job.extensionRequestedAt = now;
          await job.save();
          console.log(`🕒 Job #${job.id} auto-extended to 72h due to 0 quotes.`);
          continue;
        }

        summary.noQuotes.push(job.id);


        // ✅ FINAL 72h logic
        if (job.createdAt <= cutoff72h) {
          if (quoteCount === 0) {
            if (!dryRun) {
              const html = await ejs.renderFile(
                path.join(EMAIL_VIEWS_PATH, 'no-quotes-archive.ejs'),
                {
                  customerName: job.customerName,
                  job,
                  homeUrl: `${baseUrl}/`,
                  newRequestUrl: `${baseUrl}/jobs/upload`
                }
              );
              await sendHtmlEmail(job.customerEmail, `Job #${job.id} Removed – No Quotes Received`, html);
            }

            job.status = 'archived';
            job.emailSentAt = now;
            await job.save();
            summary.jobsArchived.push(job.id);
            continue;
          }

            if (quoteCount === 1 && !job.paid && job.status !== 'pending_payment') {
              if (!dryRun) await sendCustomerPaymentEmail(job);
              job.status = 'pending_payment';
              job.emailSentAt = now;
              await job.save();
              summary.paymentRequested.push(job.id);
              continue;
            }


            if (quoteCount >= 2 && job.status !== 'pending_payment') {
              if (!dryRun) await sendCustomerPaymentEmail(job);
              job.status = 'pending_payment';
              summary.paymentRequested.push(job.id);
              job.emailSentAt = now;
              await job.save();
            
              continue;
            }
          }

          console.log(`📦 Archived job #${job.id} after 72h with 0 quotes`);


          // 🔚 Non-extended jobs after 48h — hard delete
          if (!job.extended) {
            if (!dryRun) await sendCustomerJobDeletedEmail(job);

            await DeletedJob.create({
              jobId: job.id,
              customerName: job.customerName,
              customerEmail: job.customerEmail,
              location: job.location
            });

            await deleteImagesFromS3(job.images || []);
            await job.destroy();
            summary.jobsDeleted.push(job.id);
            continue;
          }

          
        }

      
    console.log('\n=== Scheduler Summary ===');
    for (const [category, jobs] of Object.entries(summary)) {
      const jobList = jobs.length ? ` => ${jobs.join(', ')}` : '';
      console.log(`${category}: ${jobs.length} job(s)${jobList}`);
    }

    const summaryText = `Scheduler Run at ${now.toISOString()}\n` +
      Object.entries(summary).map(
        ([key, jobs]) => `${key}: ${jobs.length} job(s)${jobs.length ? ` => ${jobs.join(', ')}` : ''}`
      ).join('\n');

    fs.writeFileSync(
      path.join(__dirname, 'logs', `scheduler-summary-${Date.now()}.log`),
      summaryText
    );

  } catch (err) {
    console.error("Scheduler failed:", err);
  }
  global.schedulerRunning = false;
}

cron.schedule('0 * * * *', runSchedulerNow);

cron.schedule('59 23 28-31 * *', async () => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  if (now.getDate() === lastDay) {
    console.log('📅 Running monthly processed report scheduler...');
    await sendMonthlyProcessedReport();
  }
});

if (process.argv[1].endsWith('scheduler.js')) {
  runSchedulerNow();
}

if (process.argv.includes('--send-report')) {
  (async () => await sendMonthlyProcessedReport())();
}
