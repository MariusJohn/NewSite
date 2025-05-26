// scheduler.js
import cron from 'node-cron';
import { Job, Quote, Bodyshop } from './models/index.js';
import nodemailer from 'nodemailer';
import { Op } from 'sequelize';
import ejs from 'ejs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

// === Setup __dirname and view path ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EMAIL_VIEWS_PATH = path.join(__dirname, 'views', 'email');


// === Email transporter ===
export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((error) => {
  if (error) console.error("Email connection failed:", error);
  else console.log("✅ Email transporter ready");
});

// === Generic HTML sender ===
async function sendHtmlEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"MC Quote" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`✅ Email sent: ${subject} -> ${to}`);
  } catch (err) {
    console.error(`❌ Email failed: ${subject} -> ${to}`, err);
  }
}

// === Email helpers using templates ===
async function sendCustomerNoQuotesEmail(job) {
  const html = await ejs.renderFile(path.join(EMAIL_VIEWS_PATH, 'no-quotes.ejs'), {
    customerName: job.customerName,
    job,
    extendUrl: `${baseUrl}/extend/${job.id}`,
    cancelUrl: `https://yourdomain.com/cancel/${job.id}`,
    
  });
  await sendHtmlEmail(job.customerEmail, `Update on Your Job #${job.id} - No Quotes Received`, html);
}

async function sendCustomerSingleQuoteEmail(job, remaining) {
  const html = await ejs.renderFile(path.join(EMAIL_VIEWS_PATH, 'single-quote.ejs'), {
    customerName: job.customerName,
    job,
    remaining,
    extendUrl: `${baseUrl}/extend/${job.id}`,
    paymentUrl: `${baseUrl}/payment?jobId=${job.id}`
  });
  await sendHtmlEmail(job.customerEmail, `1 Quote Received for Job #${job.id}`, html);
}

async function sendCustomerMultipleQuotesEmail(job, remaining) {
  const html = await ejs.renderFile(path.join(EMAIL_VIEWS_PATH, 'multiple-quotes.ejs'), {
    customerName: job.customerName,
    job,
    remaining,
    paymentUrl: `${baseUrl}/payment?jobId=${job.id}`
  });
  await sendHtmlEmail(job.customerEmail, `Quotes Ready for Job #${job.id}`, html);
}

async function sendCustomerPaymentEmail(job) {
  const html = await ejs.renderFile(path.join(EMAIL_VIEWS_PATH, 'payment-request.ejs'), {
    customerName: job.customerName,
    job,
    paymentUrl: `${baseUrl}/payment?jobId=${job.id}`
  });
  await sendHtmlEmail(job.customerEmail, `Quotes Ready for Job #${job.id} – View Now`, html);

  job.status = 'pending_payment';
  await job.save();
}

async function sendCustomerJobDeletedEmail(job) {
  const html = await ejs.renderFile(path.join(EMAIL_VIEWS_PATH, 'job-deleted.ejs'), {
    customerName: job.customerName,
    job,
    logoUrl: `${baseUrl}/img/logo.png`,
    homeUrl: `${baseUrl}/`,
    newRequestUrl: `${baseUrl}/jobs/upload`
  });
  await sendHtmlEmail(job.customerEmail, `Job #${job.id} Removed – No Quotes Received`, html);
}

// === Scheduler Logic ===
export async function runSchedulerNow() {
  console.log('=== Scheduler started ===');
  
  const dryRun = process.argv.includes('--dry-run');
  if (dryRun) {
    console.log('=== DRY RUN MODE ENABLED ===');
  }

  const summary = {
    earlyEmails: [],
    noQuotes: [],
    oneQuote: [],
    multiQuotes: [],
    paymentRequested: [],
    jobsDeleted: []
  };


  try {
    const now = new Date();
    const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const cutoff48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const jobs = await Job.findAll({
      where: {
        status: 'approved',
        quoteExpiry: { [Op.gt]: now }
      },
      include: [{ model: Quote, as: 'quotes' }]
    });

    for (const job of jobs) {
      const quoteCount = job.quotes?.length || 0;
      const bodyshopsInRange = await Bodyshop.count({ where: { area: job.location } });
      const remaining = Math.max(0, bodyshopsInRange - quoteCount);

      console.log(`Job ${job.id} | Quotes: ${quoteCount} | Extension requested: ${job.extensionRequestedAt}`);

      // === Early Trigger if 2+ Quotes Before 24h ===
      if (quoteCount >= 2 && !job.extensionRequestedAt && job.createdAt > cutoff24h) {
        console.log(`>>> Triggering early email for job ${job.id} (${quoteCount} quotes)`);
        if (dryRun) {
          console.log(`[DRY RUN] Would send early multi-quote email for job ${job.id}`);
        } else {
          await sendCustomerMultipleQuotesEmail(job, remaining);
        }
        job.extensionRequestedAt = now;
        job.emailSentAt = null;
        await job.save();
        summary.earlyEmails.push(job.id);
        continue;
      }


    // === 24h Logic ===
    if (job.createdAt <= cutoff24h && !job.extensionRequestedAt) {
      console.log(`>>> Processing 24h logic for job ${job.id} (${quoteCount} quotes)`);

      try {
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
        console.error(`❌ Failed to process 24h logic for job ${job.id}:`, err);
      }

      continue;
    }

    
      // === 48h Logic ===
      if (job.createdAt <= cutoff48h) {
        if (quoteCount === 0) {
          if (!dryRun) await sendCustomerJobDeletedEmail(job);
          await job.destroy();
          summary.jobsDeleted.push(job.id);
        } else {
          if (!dryRun) await sendCustomerPaymentEmail(job);
          summary.paymentRequested.push(job.id);
        }
      }
    }
    console.log('\n=== Scheduler Summary ===');
    for (const [category, jobs] of Object.entries(summary)) {
      const jobList = jobs.length ? ` => ${jobs.join(', ')}` : '';
      console.log(`${category}: ${jobs.length} job(s)${jobList}`);
    }

    // === Log file ===
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
}


// === Production Cron Job (optional) ===
cron.schedule('0 * * * *', runSchedulerNow);


// Run immediately if executed directly
if (process.argv[1].endsWith('scheduler.js')) {
 runSchedulerNow();
}