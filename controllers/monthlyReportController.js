// controllers/monthlyReportController.js

import { Op } from 'sequelize';
import { Parser } from 'json2csv';
import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { transporter } from '../scheduler.js';
import dotenv from 'dotenv';
import { Job, Quote } from '../models/index.js';



dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EMAIL_VIEWS_PATH = path.join(__dirname, '../views/email');

export async function sendMonthlyProcessedReport() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const jobs = await Job.findAll({
    where: {
      status: 'processed',
      createdAt: { [Op.between]: [start, end] }
    },
    include: [{ model: Quote, as: 'quotes' }]
  });
  

  if (!jobs.length) {
    console.log('📭 No processed jobs this month.');
    return;
  }

  const jobData = jobs.map(job => ({
    JobID: job.id,
    Customer: job.customerName,
    Email: job.customerEmail,
    Phone: job.customerPhone,
    Uploaded: new Date(job.createdAt).toLocaleDateString('en-GB'),
    Quotes: job.quotes?.length || 0
  }));

  const parser = new Parser();
  const csv = parser.parse(jobData);
  const filename = `processed-report-${now.toISOString().split('T')[0]}.csv`;
  const csvPath = path.join(__dirname, `../logs/${filename}`);
  fs.writeFileSync(csvPath, csv);

  const html = await ejs.renderFile(path.join(EMAIL_VIEWS_PATH, 'monthly-processed-report.ejs'), {
    jobs,
    reportDate: now
  });

  await transporter.sendMail({
    from: `"My Car Quote" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `Monthly Processed Jobs Report – ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
    html,
    attachments: [{
      filename,
      content: csv
    }]
  });

  console.log(`📧 Monthly report with CSV sent to ${process.env.ADMIN_EMAIL}`);
}
