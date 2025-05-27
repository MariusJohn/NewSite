// routes/jobs.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { Op } from 'sequelize';
import { Job, Quote, Bodyshop } from '../models/index.js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

import {
  extendJobQuoteTime,
  showCancelJobPage,
  cancelJob
} from '../controllers/customerJobActionsController.js';

import {
  renderJobsWithQuotes,
  exportJobsWithQuotesCSV,
  remindUnselectedJobs
} from '../controllers/jobsWithQuotesController.js';

import { getJobFilterOptions, getJobCounts } from '../controllers/jobController.js';

const router = express.Router();
dotenv.config();

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
});

// === Customer Upload Routes ===
router.get('/upload', (req, res) => res.render('jobs/upload'));

router.post('/upload', upload.array('images', 8), async (req, res) => {
  try {
    const { name, email, location, telephone } = req.body;
    const phoneRegex = /^07\d{9}$/;

    if (!phoneRegex.test(telephone)) {
      return res.status(400).render('jobs/upload-error', {
        title: 'Invalid telephone number',
        message: 'Please enter a valid UK phone number (07...).'
      });
    }

    const token = req.body['g-recaptcha-response'];
    if (!token) return res.status(400).render('jobs/upload-error', { title: 'Captcha Error', message: 'Captcha verification failed.' });

    const verifyRes = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
      params: { secret: RECAPTCHA_SECRET_KEY, response: token }
    });
    if (!verifyRes.data.success) return res.status(400).render('jobs/upload-error', { title: 'Captcha Error', message: 'Captcha failed verification.' });

    const geoRes = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
      params: { q: location, key: process.env.OPENCAGE_API_KEY, countrycode: 'gb', limit: 1 }
    });

    if (!geoRes.data?.results?.length) return res.status(400).render('jobs/upload-error', { title: 'Location Error', message: 'Invalid postcode.' });

    const { lat, lng } = geoRes.data.results[0].geometry;
    const uploadedS3Urls = [];

    for (const file of req.files || []) {
      if (!file.buffer?.length) continue;
      const compressed = await sharp(file.buffer).resize({ width: 1920 }).jpeg({ quality: 75 }).toBuffer();
      const s3Key = `job-images/${randomUUID()}.jpg`;
      await s3Client.send(new PutObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: s3Key, Body: compressed, ContentType: 'image/jpeg' }));
      uploadedS3Urls.push(`https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`);
    }

    await Job.create({
      customerName: name,
      customerEmail: email,
      customerPhone: telephone,
      location,
      latitude: lat,
      longitude: lng,
      images: uploadedS3Urls,
      status: 'pending',
      paid: false
    });

    res.render('jobs/upload-success');
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).render('jobs/upload-error', { title: 'Server Error', message: 'Try again later.' });
  }
});

// === Admin Dashboard Routes ===
router.get('/admin', async (req, res) => {
  try {
    const filter = req.query.filter || 'total';
    const { whereClause, includeClause } = getJobFilterOptions(filter);
    const jobs = await Job.findAll({ where: whereClause, include: includeClause, order: [['createdAt', 'DESC']] });
    const counts = await getJobCounts();
    res.render('admin/jobs-dashboard', { jobs, ...counts, filter });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/:id/approve', async (req, res) => {
  await Job.update({ status: 'approved' }, { where: { id: req.params.id } });
  res.redirect('/jobs/admin?filter=live');
});

router.post('/:id/reject', async (req, res) => {
  await Job.update({ status: 'rejected' }, { where: { id: req.params.id } });
  res.redirect('/jobs/admin?filter=rejected');
});

router.post('/:jobId/archive', async (req, res) => {
  const job = await Job.findByPk(req.params.jobId);
  if (job?.status === 'rejected') await job.update({ status: 'archived' });
  res.redirect('/jobs/admin?filter=archived');
});

router.post('/:jobId/delete', async (req, res) => {
  const job = await Job.findByPk(req.params.jobId);
  if (job?.status === 'archived') await job.update({ status: 'deleted' });
  res.redirect('/jobs/admin?filter=deleted');
});

router.post('/:jobId/restore', async (req, res) => {
  const job = await Job.findByPk(req.params.jobId);
  if (['rejected', 'archived'].includes(job?.status)) await job.update({ status: 'pending' });
  res.redirect('/jobs/admin?filter=live');
});

router.post('/:jobId/restore-deleted', async (req, res) => {
  const job = await Job.findByPk(req.params.jobId);
  if (job?.status === 'deleted') await job.update({ status: 'pending' });
  res.redirect('/jobs/admin?filter=deleted');
});

// === Admin Quotes View ===
router.get('/admin/quotes', renderJobsWithQuotes);
router.get('/admin/quotes/export', exportJobsWithQuotesCSV);
router.get('/admin/quotes/remind', remindUnselectedJobs);

// === Customer Actions ===
router.get('/extend/:jobId', extendJobQuoteTime);
router.get('/cancel/:jobId', showCancelJobPage);
router.post('/cancel/:jobId', cancelJob);

export default router;
