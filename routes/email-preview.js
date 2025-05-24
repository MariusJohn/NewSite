// routes/email-preview.js
import express from 'express';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EMAIL_VIEWS_PATH = path.join(__dirname, '../views/email');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const sampleJob = {
  id: 123,
  customerName: 'Test User',
  customerEmail: 'test@example.com'
};

router.get('/email/:template', async (req, res) => {
  const template = req.params.template;

  try {
    const html = await ejs.renderFile(path.join(EMAIL_VIEWS_PATH, `${template}.ejs`), {
      customerName: sampleJob.customerName,
      job: sampleJob,
      remaining: 2,
      extendUrl: `${baseUrl}/extend/${sampleJob.id}`,
      cancelUrl: `${baseUrl}/cancel/${sampleJob.id}`,
      paymentUrl: `${baseUrl}/payment?jobId=${sampleJob.id}`,
      logoUrl: `${baseUrl}/img/logo.png`,
      homeUrl: `${baseUrl}/`,
      newRequestUrl: `${baseUrl}/jobs/upload`
    });

    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Template not found or failed to render.');
  }
});

export default router;