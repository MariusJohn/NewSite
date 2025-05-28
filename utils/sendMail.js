// utils/sendMail.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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
export async function sendHtmlMail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: `"MC Quote" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });

    console.log(`✅ HTML Email sent to ${to}: ${info.messageId}`);
  } catch (err) {
    console.error(`❌ Failed to send HTML email to ${to}:`, err);
  }
}



export default sendHtmlMail;

