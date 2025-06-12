// routes/admin-jobs.js
import express from 'express';
import crypto from 'crypto';
import multer from 'multer';
import sharp from 'sharp';
import axios from 'axios';
import archiver from 'archiver';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { Job, Quote, Bodyshop } from '../models/index.js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { jobUploadLimiter } from '../middleware/rateLimiter.js';
import { getJobFilterOptions, getJobCounts } from '../controllers/jobController.js';
import { renderJobsWithQuotes, exportJobsWithQuotesCSV, remindUnselectedJobs } from '../controllers/jobsWithQuotesController.js';
import { showJobsWithQuotes, remindBodyshops } from '../controllers/adminJobsController.js';
import { exportQuotesToCSV } from '../controllers/exportQuotesToCSV.js';
import { handleJobAction } from '../controllers/customerJobActionsController.js';
import { hardDeleteJob } from '../controllers/hardDeleteJob.js';
import adminAuth from '../middleware/adminAuth.js';


dotenv.config();

const router = express.Router();
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

// === JOB UPLOAD ROUTES ===
router.get('/upload', (req, res) => {
  res.render('jobs/upload');
});

router.post('/upload', jobUploadLimiter, upload.array('images', 8), async (req, res) => {
  try {
    const { name, email, location, telephone, ['g-recaptcha-response']: token } = req.body;
    const phoneRegex = /^07\d{9}$/;

    if (!phoneRegex.test(telephone)) {
      return res.status(400).render('jobs/upload-error', {
        title: 'Invalid telephone number',
        message: 'Please enter a valid UK phone number (07...).',
      });
    }

    if (!token) {
      return res.status(400).render('jobs/upload-error', {
        title: 'Captcha Error',
        message: 'Captcha verification failed. Please try again.',
      });
    }

    const verifyResponse = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
      params: { secret: RECAPTCHA_SECRET_KEY, response: token },
    });

    if (!verifyResponse.data.success) {
      return res.status(400).render('jobs/upload-error', {
        title: 'Captcha Error',
        message: 'Captcha failed verification. Please try again.',
      });
    }

    const geoRes = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
      params: { q: location, key: process.env.OPENCAGE_API_KEY, countrycode: 'gb', limit: 1 },
    });

    if (!geoRes.data?.results?.length) {
      return res.status(400).render('jobs/upload-error', {
        title: 'Location Error',
        message: 'Unable to find coordinates for the given postcode.',
      });
    }

    const { lat, lng } = geoRes.data.results[0].geometry;
    const uploadedS3Urls = [];

    for (const file of req.files || []) {
      if (!file.buffer?.length) continue;

      const compressedBuffer = await sharp(file.buffer)
        .resize({ width: 1920, withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toBuffer();

      const s3Key = `job-images/${crypto.randomUUID()}.jpg`;

      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key,
        Body: compressedBuffer,
        ContentType: 'image/jpeg',
      }));

      uploadedS3Urls.push(`https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`);
    }

    const newJob = await Job.create({
      customerName: name.trim(),
      customerEmail: email.trim(),
      customerPhone: telephone.trim(),
      location: location.trim(),
      latitude: lat,
      longitude: lng,
      images: uploadedS3Urls,
      status: 'pending',
      paid: false,
      extendToken: crypto.randomBytes(32).toString('hex'),
      cancelToken: crypto.randomBytes(32).toString('hex'),
    });

    console.log('✅ Job created:', newJob.id);
    res.render('jobs/upload-success');
  } catch (err) {
    console.error('❌ Upload Error:', err);
    res.status(500).render('jobs/upload-error', {
      title: 'Server Error',
      message: 'Something went wrong. Please try again later.',
    });
  }
});


// === ADMIN DASHBOARD ===
router.get('/', async (req, res) => {
  console.log('--- Inside router.get(/jobs/admin) handler ---');
  console.log('Request URL:', req.originalUrl); // Should be /jobs/admin or /jobs/admin?filter=...
  console.log('Query parameters (req.query):', req.query);

  try {
    const filter = req.query.filter || 'total';
    console.log('Detected filter (after default):', filter);

    // This is where you might have conditional redirects,
    // though your current code defaults the filter, it doesn't redirect if it's unexpected.
    // If you had logic like this, it would be here:
    // if (filter === 'invalid') {
    //   console.log('Invalid filter detected, redirecting to total jobs.');
    //   return res.redirect('/jobs/admin?filter=total');
    // }

    const { whereClause, includeClause } = getJobFilterOptions(filter);
    console.log('Generated whereClause:', JSON.stringify(whereClause));
    console.log('Generated includeClause (models):', includeClause.map(inc => inc.model.name));


    const jobs = await Job.findAll({
      where: whereClause,
      include: includeClause,
      order: [['createdAt', 'DESC']]
    });
    console.log(`Fetched ${jobs.length} jobs for filter: ${filter}`);


    //  Add daysPending calculation
    const now = new Date();
    jobs.forEach(job => {
      const createdAt = new Date(job.createdAt);
      const msInDay = 1000 * 60 * 60 * 24;
      const daysPending = Math.floor((now - createdAt) / msInDay);
      job.dataValues.daysPending = daysPending;
    });
    console.log('Days pending calculated for jobs.');


    const counts = await getJobCounts();
    console.log('Fetched job counts:', counts);

    // This is the template being rendered
    res.render('admin/jobs-dashboard', { jobs, ...counts, filter });
    console.log('--- Successfully rendered admin/jobs-dashboard for /jobs/admin ---');

  } catch (err) {
    console.error('❌ Dashboard Error in /jobs/admin handler:', err);
    res.status(500).send('Internal Server Error');
  }
});

// === JOB STATUS ROUTES ===
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
  if (job?.status === 'rejected') {
    await job.update({ status: 'archived' });
    return res.redirect('/jobs/admin?filter=archived');
  }
  res.status(400).send('Only rejected jobs can be archived.');
});

router.post('/:jobId/restore', async (req, res) => {
  const job = await Job.findByPk(req.params.jobId);
  if (job && ['rejected', 'archived'].includes(job.status)) {
    await job.update({ status: 'pending' });
    return res.redirect('/jobs/admin?filter=live');
  }
  res.status(400).send('Only archived jobs can be restored.');
});

router.post('/:jobId/delete', async (req, res) => {
  const job = await Job.findByPk(req.params.jobId);
  if (job?.status === 'archived') {
    await job.update({ status: 'deleted' });
    return res.redirect('/jobs/admin?filter=deleted');
  }
  res.status(400).send('Only archived jobs can be deleted.');
});

router.post('/:jobId/restore-deleted', async (req, res) => {
  const job = await Job.findByPk(req.params.jobId);
  if (job?.status === 'deleted') {
    await job.update({ status: 'pending' });
    return res.redirect('/jobs/admin?filter=deleted');
  }
  res.status(400).send('Only deleted jobs can be restored.');
});

// === HARD DELETE POST === //
router.post('/:jobId/hard-delete', hardDeleteJob);

// === IMAGE DOWNLOAD AS ZIP ===
router.get('/download/:jobId', async (req, res) => {
  const job = await Job.findByPk(req.params.jobId);
  if (!job?.images?.length) return res.status(404).send('No images found.');

  const archive = archiver('zip', { zlib: { level: 9 } });
  res.attachment(`job-${job.id}-images.zip`);
  archive.pipe(res);

  for (const [index, url] of job.images.entries()) {
    const response = await fetch(url);
    archive.append(Buffer.from(await response.arrayBuffer()), { name: `image${index + 1}.jpg` });
  }

  await archive.finalize();
});

// === JOB QUOTES VIEW ===
router.get('/quotes',  renderJobsWithQuotes);
router.get('/quotes/export',  exportJobsWithQuotesCSV);
router.get('/quotes/remind',  remindUnselectedJobs);
router.post('/remind/:jobId',  remindBodyshops);
router.get('/quotes/export-csv', exportQuotesToCSV);

// === CUSTOMER ONE-TIME ACTIONS ===
router.get('/jobs/action/:jobId/:token', handleJobAction);

export default router;

