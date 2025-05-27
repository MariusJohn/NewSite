// routes/jobs.js
import express from 'express';
const router = express.Router();

import multer from 'multer';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';

import nodemailer from 'nodemailer';
import { Op } from 'sequelize';
import { Job, Quote, Bodyshop } from '../models/index.js'; // Keep this line for other routes in this file
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


// --- NEW: Import the helper functions ---
import { getJobFilterOptions, getJobCounts } from '../controllers/jobController.js';

import { getBaseUrl } from '../helpers/url.js';

router.get('/extend/:jobId', async (req, res) => {
  const jobId = req.params.jobId;
  const baseUrl = getBaseUrl();
  const extendLink = `${baseUrl}/extend/${jobId}`;


});



import dotenv from 'dotenv';
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
    storage: storage,
    limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB limit
});



router.get('/upload', (req, res) => {
  res.render('jobs/upload');
});

router.post('/upload', upload.array('images', 8), async (req, res) => {
  try {
      const phoneRegex = /^07\d{9}$/;
      const { name, email, location, telephone } = req.body;

      const sanitize = (text) => text.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const safeName = sanitize(name);
      const safeEmail = sanitize(email);
      const safeLocation = sanitize(location);

      if (!phoneRegex.test(telephone)) {
          return res.status(400).render('jobs/upload-error', {
              title: 'Invalid telephone number',
              message: 'Please enter a valid UK phone number (07...).'
          });
      }

        const token = req.body['g-recaptcha-response'];

        if (!token) {
          return res.status(400).render('jobs/upload-error', {
            title: 'Captcha Error',
            message: 'Captcha verification failed. Please try again.'
          });
        }

        const captchaVerifyUrl = `https://www.google.com/recaptcha/api/siteverify`;
        const verifyResponse = await axios.post(captchaVerifyUrl, null, {
          params: {
            secret: RECAPTCHA_SECRET_KEY,
            response: token
          }
        });

        if (!verifyResponse.data.success) {
          return res.status(400).render('jobs/upload-error', {
            title: 'Captcha Error',
            message: 'Captcha failed verification. Please try again.'
          });
        }

        // const isBodyshop = await Bodyshop.findOne({ where: { email } });
        // if (isBodyshop) {
        //   return res.status(403).render('jobs/upload-error', {
        //     title: 'Access Denied',
        //     message: 'You are not allowed to upload jobs using a bodyshop account.'
        //   });
        // }

      const apiKey = process.env.OPENCAGE_API_KEY;
      const geoRes = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
          params: {
              q: location,
              key: apiKey,
              countrycode: 'gb',
              limit: 1
          }
      });

      if (!geoRes.data || !geoRes.data.results || !geoRes.data.results.length) {
          console.error('No coordinates found for:', location);
          return res.status(400).render('jobs/upload-error', {
              title: 'Location Error',
              message: 'Unable to find coordinates for the given postcode.'
          });
      }

      const { lat, lng } = geoRes.data.results[0].geometry;
      console.log('Latitude:', lat, 'Longitude:', lng);

      const uploadedS3Urls = [];

      if (!req.files || req.files.length === 0) {
          console.warn('No files were submitted with the form.');
      } else {
          for (const file of req.files) {
              console.log(`Processing file: ${file.originalname}`);
              console.log(`File buffer length: ${file.buffer ? file.buffer.length : 'undefined/null'}`);
              console.log(`File mimetype: ${file.mimetype}`);

              if (!file.buffer || file.buffer.length === 0) {
                  console.warn(`Skipping empty or invalid file buffer for: ${file.originalname}`);
                  continue;
              }

              try {
                  const compressedBuffer = await sharp(file.buffer)
                      .resize({ width: 1920, withoutEnlargement: true })
                      .jpeg({ quality: 75 })
                      .toBuffer();

                  const uniqueFileName = `${randomUUID()}.jpg`;
                  const s3Key = `job-images/${uniqueFileName}`;

                  const command = new PutObjectCommand({
                      Bucket: process.env.AWS_BUCKET_NAME,
                      Key: s3Key,
                      Body: compressedBuffer,
                      ContentType: 'image/jpeg',
                  });

                  await s3Client.send(command);

                  const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
                  uploadedS3Urls.push(imageUrl);
                  console.log(`Successfully uploaded to S3: ${imageUrl}`);

              } catch (fileProcessingError) {
                  console.error(`Error processing or uploading file ${file.originalname} to S3:`, fileProcessingError);
              }
          }
      }

      console.log('Attempting to create job with data:', {
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

      const newJob = await Job.create({
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
      console.log('Job successfully created in DB with ID:', newJob.id);

      res.render('jobs/upload-success');

  } catch (routeError) {
      console.error('Final catch - Error in jobs.js upload route:', routeError);
      if (routeError.name === 'SequelizeValidationError') {
          const messages = routeError.errors.map(err => err.message).join(', ');
          console.error('Sequelize Validation Errors:', messages);
          return res.status(400).render('<jobs/upload-error', {
              title: 'Validation Error',
              message: `Data validation failed: ${messages}`
          });
      }
      res.status(500).render('jobs/upload-error', {
          title: 'Server Error',
          message: 'Something went wrong. Please try again later.'
      });
  }
});


router.get('/admin', async (req, res) => {
  try {
    const filter = req.query.filter || 'total';
     const { whereClause, includeClause } = getJobFilterOptions(filter);

    const jobs = await Job.findAll({
      where: whereClause,
      include: includeClause,
      order: [['createdAt', 'DESC']]
    });

    // --- Use helper function for counts ---
    const counts = await getJobCounts();

    res.render('admin/jobs-dashboard', {
      jobs,
      ...counts, // Spread the counts object into the render context
      filter
    });

  } catch (err) {
    console.error('❌ Admin dashboard error:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/:id/approve', async (req, res) => {
  try {
    await Job.update({ status: 'approved' }, { where: { id: req.params.id } });
    res.redirect('/jobs/admin?filter=live');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error approving job.');
  }
});

router.post('/:id/reject', async (req, res) => {
  try {
    await Job.update({ status: 'rejected' }, { where: { id: req.params.id } });
    res.redirect('/jobs/admin?filter=rejected');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error rejecting job.');
  }
});

router.post('/:jobId/archive', async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.jobId);
    if (!job || job.status !== 'rejected') {
      return res.status(400).send('Only rejected jobs can be archived.');
    }

    await job.update({ status: 'archived' });
    res.redirect('/jobs/admin?filter=archived');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error.');
  }
});

router.post('/:jobId/restore', async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const job = await Job.findByPk(jobId);

    if (!job || !['rejected', 'archived'].includes(job.status)) {
      return res.status(400).send('Only archived jobs can be restored.');
    }

    await job.update({ status: 'pending' });

    res.redirect('/jobs/admin?filter=live');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error.');
  }
});

router.post('/:jobId/delete', async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.jobId);
    if (!job || job.status !== 'archived') {
      return res.status(400).send('Only archived jobs can be deleted.');
    }

    await job.update({ status: 'deleted' });

    res.redirect('/jobs/admin?filter=deleted');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error.');
  }
});

router.post('/:jobId/restore-deleted', async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.jobId);

    if (!job || job.status !== 'deleted') {
      return res.status(400).send('Only deleted jobs can be restored.');
    }

    await job.update({ status: 'pending' });

    res.redirect('/jobs/admin?filter=deleted');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error.');
  }
});

// routes/jobs.js (within the router.get('/admin/quotes') route)

router.get('/admin/quotes', async (req, res) => {
  try {
      const jobs = await Job.findAll({
          include: [
              {
                  model: Quote,
                  as: 'quotes',
                  include: [
                      {
                          model: Bodyshop,
                          as: 'bodyshop' 
                      }
                  ]
              }
          ],
          order: [['createdAt', 'DESC']]
      });

      const counts = await getJobCounts(); 



      res.render('admin/jobs-quotes', {
          jobs,
          ...counts
      });
  } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
  }
});


// === Customer Actions ===
router.get('/extend/:jobId', extendJobQuoteTime);
router.get('/cancel/:jobId', showCancelJobPage);
router.post('/cancel/:jobId', cancelJob);



//Jobs with Quotes 
router.get('/admin/quotes', renderJobsWithQuotes);
router.get('/admin/quotes/export', exportJobsWithQuotesCSV);
router.get('/admin/quotes/remind', remindUnselectedJobs);



export default router;