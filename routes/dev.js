// routes/dev.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import dotenv from 'dotenv';
import fs from 'fs';
import { Job } from '../models/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EMAIL_VIEWS_PATH = path.join(__dirname, '../views/email');
const baseUrl = process.env.BASE_URL || 'https://mcquote.co.uk';

const router = express.Router();

router.get('/dev-preview', (req, res) => {
  res.render('dev-preview');
});

router.get('/upload-success', (req, res) => {
  res.render('jobs/upload-success');
});

router.get('/upload-error', (req, res) => {
  res.render('jobs/upload-error', {
    title: 'Sample Upload Error',
    message: 'This is a test error message for preview purposes.'
  });
});

router.get('/dev/login-error', (req, res) => {
  res.render('bodyshop/login-error', {
    error: req.query.msg || null
  });
});

router.get('/payment-request/:jobId', async (req, res) => {
  const job = await Job.findByPk(req.params.jobId);
  const logoBase64 = fs.readFileSync('./public/img/logo-true.svg', 'base64');
  const html = await ejs.renderFile(
    path.join(EMAIL_VIEWS_PATH, 'payment-request.ejs'),
    {
      customerName: job.customerName,
      job,
      paymentUrl: `${baseUrl}/payment?jobId=${job.id}`,
      homeUrl: `${baseUrl}/`,
      newRequestUrl: `${baseUrl}/jobs/upload`,
      logoUrl: `data:image/svg+xml;base64,${logoBase64}`,
      baseUrl
    }
  );
  res.send(html);
});

export default router;
