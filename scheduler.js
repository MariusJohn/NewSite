// scheduler.js
import cron from 'node-cron';
import nodemailer from 'nodemailer';
import { Op } from 'sequelize';
import ejs from 'ejs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { S3Client, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { DeletedJob, Job, Quote, Bodyshop } from './models/index.js';
import { sendMonthlyProcessedReport } from './controllers/monthlyReportController.js';


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EMAIL_VIEWS_PATH = path.join(__dirname, 'views', 'email');
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify(error => {
  if (error) console.error("Email connection failed:", error);
  else console.log("✅ Email transporter ready");
});

async function sendHtmlEmail(to, subject, html) {
  try {
    await transporter.sendMail({ from: `"My Car Quote" <${process.env.EMAIL_USER}>`, to, subject, html });
    console.log(`✅ Email sent: ${subject} -> ${to}`);
  } catch (err) {
    console.error(`❌ Email failed: ${subject} -> ${to}`, err);
  }
}

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
    paymentUrl: `${baseUrl}/payment?jobId=${job.id}`
  });
  await sendHtmlEmail(job.customerEmail, `1 Quote Received for Job #${job.id}`, html);
}

async function sendCustomerMultipleQuotesEmail(job, remaining) {
  const html = await ejs.renderFile(path.join(EMAIL_VIEWS_PATH, 'multiple-quotes.ejs'), {
    customerName: job.customerName,
    job,
    remaining,
    baseUrl,
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
    logoUrl: `${baseUrl}/img/logo.svg`,
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
  global.schedulerRunning = true;
  

  console.log('=== Scheduler started ===');
  const dryRun = process.argv.includes('--dry-run');
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

    const jobs = await Job.findAll({
      where: { status: 'approved' },
      include: [{ model: Quote, as: 'quotes' }]
    });

    for (const job of jobs) {
      const quoteCount = job.quotes?.length || 0;
      const bodyshopsInRange = await Bodyshop.count({ where: { area: job.location } });
      const remaining = Math.max(0, bodyshopsInRange - quoteCount);

      if (quoteCount >= 2 && !job.extensionRequestedAt && job.createdAt > cutoff24h) {
        if (!dryRun) await sendCustomerPaymentEmail(job);
        job.extensionRequestedAt = now;
        job.emailSentAt = null;
        await job.save();
        summary.earlyEmails.push(job.id);
        continue;
      }

      if (job.createdAt <= cutoff24h && !job.extensionRequestedAt) {
        try {
          if (!job.emailSentAt) { // prevent repeat
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
          } else {
            console.log(`⏩ Skipped Job #${job.id} – Already emailed at ${job.emailSentAt}`);
          }
        } catch (err) {
          console.error(`❌ Failed to process 24h logic for job ${job.id}:`, err);
        }
        continue;
      }
      

      if (job.extended && job.extensionRequestedAt && !job.emailSentAt) {
        job.emailSentAt = new Date();
        await job.save();
      }

      if (job.extended && quoteCount >= 2 && !job.paid && job.status !== 'pending_payment') {
        if (!dryRun) await sendCustomerPaymentEmail(job);
        summary.paymentRequested.push(job.id);
      }

      console.log(`cutoff48h: ${cutoff48h.toISOString()}`);
      console.log(`Job #${job.id} createdAt: ${job.createdAt.toISOString()}`);
      console.log(`Job #${job.id} extended: ${job.extended}`);
      console.log(`Job #${job.id} quoteCount: ${quoteCount}`);

      if (job.createdAt <= cutoff48h) {
        if (quoteCount === 0) {
          if (job.extended) {
            const html = await ejs.renderFile(path.join(EMAIL_VIEWS_PATH, 'no-quotes-archive.ejs'), {
              customerName: job.customerName,
              job,
              homeUrl: `${baseUrl}/`,
              newRequestUrl: `${baseUrl}/jobs/upload`
            });

            if (!job.emailSentAt) {
              await sendCustomerJobDeletedEmail(job);
              job.emailSentAt = now;
              await job.save();
            }
            


            if (!dryRun) {
              await sendHtmlEmail(job.customerEmail, `Job #${job.id} – No Quotes Received`, html);
              job.status = 'archived';
              await job.save();
            }
            summary.jobsArchived.push(job.id);
          } else {
            if (!dryRun) await sendCustomerJobDeletedEmail(job);
            const s3Client = new S3Client({
              region: process.env.AWS_REGION,
              credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
              }
            });



            async function deleteJobImagesFromS3(imageKeys = []) {
              if (!imageKeys.length) return;
              const deleteParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Delete: { Objects: imageKeys.map(key => ({ Key: `job-images/${key}` })) }
              };
              await s3Client.send(new DeleteObjectsCommand(deleteParams));
            }
            await DeletedJob.create({
              jobId: job.id,
              customerName: job.customerName,
              customerEmail: job.customerEmail,
              location: job.location
            });
            await deleteJobImagesFromS3(job.images || []);
            await job.destroy();
            summary.jobsDeleted.push(job.id);
          }
        } else {
          if (!job.paid && job.status !== 'pending_payment') {
            if (!dryRun) await sendCustomerPaymentEmail(job);
            summary.paymentRequested.push(job.id);
          }
        }
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
    await sendMonthlyProcessedReport();
  }
  
  cron.schedule('59 23 28-31 * *', async () => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    if (now.getDate() === lastDay) {
      console.log('📅 Running monthly processed report scheduler...');
      await sendMonthlyProcessedReport();
    }
  });

  

