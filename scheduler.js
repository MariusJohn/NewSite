import { Job, Quote, Bodyshop } from './models/index.js';
import nodemailer from 'nodemailer';
import { Op } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

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

function buildLinks(jobId, yesText = 'Extend', noText = 'Cancel') {
  return `
${yesText}: https://yourdomain.com/job/extend?id=${jobId}&response=yes  
${noText}: https://yourdomain.com/job/extend?id=${jobId}&response=no`;
}

// === Email helpers ===
async function sendEmail(to, subject, text) {
  const mailOptions = {
    from: `"MC Quote" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${subject} -> ${to}`);
  } catch (err) {
    console.error(`❌ Email failed: ${subject} -> ${to}`, err);
  }
}

async function sendCustomerNoQuotesEmail(job) {
  console.log(`Sending NO QUOTES email for Job #${job.id}`);

  await sendEmail(
    job.customerEmail,
    `Update on Your Job #${job.id} - No Quotes Received`,
    `Hi${job.customerName ? ` ${job.customerName}` : ''},

Your job request (#${job.id}) hasn’t received any quotes yet from nearby bodyshops.

Would you like to keep it active for another 24 hours to allow more time for responses?

Reply YES to extend, or NO to cancel.  
You can also click below:

${buildLinks(job.id)}

Thanks for using MC Quote. We're here to help you get fair, fast repair quotes.`
  );
}

async function sendCustomerSingleQuoteEmail(job, remaining) {
  console.log(`Sending SINGLE QUOTE email for Job #${job.id}`);

  await sendEmail(
    job.customerEmail,
    `1 Quote Received for Job #${job.id} – Next Steps`,
    `Hi${job.customerName ? ` ${job.customerName}` : ''},

Your job (#${job.id}) has received 1 quote so far. There are still ${remaining} local bodyshop(s) who haven't responded yet.

Would you like to keep it open for another 24 hours to possibly receive more quotes, or proceed to payment to view the current offer?

Reply YES to extend, or NO to go to payment.  
Or click:

${buildLinks(job.id, 'Extend & Wait', 'Go to Payment')}

Thanks again for choosing MC Quote.`
  );
}

async function sendCustomerMultipleQuotesEmail(job, remaining) {
  console.log(`Sending MULTIPLE QUOTES email for Job #${job.id}`);

  await sendEmail(
    job.customerEmail,
    `Good News! Multiple Quotes Received for Job #${job.id}`,
    `Hi${job.customerName ? ` ${job.customerName}` : ''},

Great news — you’ve received multiple quotes for your job request (#${job.id}). ${remaining > 0 ? `${remaining} more bodyshop(s) may still respond.` : `All available bodyshops have responded.`}

You can now proceed to view the quotes:

https://yourdomain.com/payment?jobId=${job.id}

Thank you for using MC Quote. We're here to help you make the best decision.`
  );
}

async function sendCustomerPaymentEmail(job) {
  console.log(`Sending PAYMENT email for Job #${job.id}`);

  await sendEmail(
    job.customerEmail,
    `Quotes Ready for Job #${job.id} – View Now`,
    `Hi${job.customerName ? ` ${job.customerName}` : ''},

You’ve received quotes for your job request (#${job.id}). To unlock and view them, please proceed to payment:

https://yourdomain.com/payment?jobId=${job.id}

Let us know if you need any help. Thank you for choosing MC Quote.`
  );

  job.status = 'pending_payment';
  await job.save();
}

async function sendCustomerJobDeletedEmail(job) {
  console.log(`Sending DELETED email for Job #${job.id}`);

  await sendEmail(
    job.customerEmail,
    `Job #${job.id} Removed – No Quotes Received`,
    `Hi${job.customerName ? ` ${job.customerName}` : ''},

Unfortunately, no quotes were received for your job request (#${job.id}) within 48 hours. The job has now been removed from our system.

If you'd like to try again or need assistance, we're here to help.

Thank you for considering MC Quote.`
  );
}

// === Scheduler Runner ===
export async function runSchedulerNow() {
  console.log('=== Scheduler started ===');

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

    console.log('Jobs found:', jobs.length);

    for (const job of jobs) {
      const quoteCount = job.quotes?.length || 0;
      const bodyshopsInRange = await Bodyshop.count({ where: { area: job.location } });
      const remaining = Math.max(0, bodyshopsInRange - quoteCount);

      // === 24h Logic ===
      if (job.createdAt <= cutoff24h && !job.extensionRequestedAt) {
        if (quoteCount === 0) {
          await sendCustomerNoQuotesEmail(job);
        } else if (quoteCount === 1) {
          await sendCustomerSingleQuoteEmail(job, remaining);
        } else if (quoteCount >= 2) {
          await sendCustomerMultipleQuotesEmail(job, remaining);
        }

        job.extensionRequestedAt = now;
        await job.save();
      }

      // === 48h Logic ===
      if (job.createdAt <= cutoff48h) {
        if (quoteCount === 0) {
          await sendCustomerJobDeletedEmail(job);
          await job.destroy();
        } else {
          await sendCustomerPaymentEmail(job);
        }
      }
    }
  } catch (err) {
    console.error("Scheduler failed:", err);
  }
}