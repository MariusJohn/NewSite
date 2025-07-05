// utils/sendMail.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { logScheduler } from '../helpers/schedulerLogger.js';


dotenv.config();

// Setup __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EMAIL_TEMPLATES_DIR = path.join(__dirname, '../views/email');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ionos.co.uk',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// === Send plain text ===
//
async function sendHtmlEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"My Car Quote" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments: [
        {
          filename: 'logo-true.svg',
          path: path.join(process.cwd(), 'public', 'img', 'logo-true.svg'),
          cid: 'logoemailcid' // Must match the "cid:" used in the EJS
        }
      ]
    });

    console.log(`✅ Email sent: ${subject} -> ${to}`);
    await logScheduler(`✅ Email sent: ${subject} -> ${to}`);
  } catch (err) {
    console.error(`❌ Email failed: ${subject} -> ${to}`, err);
    await logScheduler(`❌ Email failed: ${subject} -> ${to}`);
  }
}



export { sendHtmlEmail };

