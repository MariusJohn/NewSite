// routes/public-jobs.js
import express from 'express';
import crypto from 'crypto';
import multer from 'multer';
import axios from 'axios';
import sharp from 'sharp';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { Job, Bodyshop } from '../models/index.js';
import { jobUploadLimiter } from '../middleware/rateLimiter.js';
import { handleJobAction } from '../controllers/customerJobActionsController.js';
import * as csurf from 'csurf'; 
import { geocodeAddress } from '../utils/geocode.js'; 
import { verifyRecaptcha } from '../middleware/recaptchaVerify.js'; 
import { Job } from '../models/index.js';


dotenv.config();

const router = express.Router();

const csrfProtection = csurf({ cookie: true });


// === AWS S3 Client ===
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// === Multer config ===
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

// === GET: Upload form ===
router.get('/upload', csrfProtection, (req, res) => {
  const csrfToken = req.csrfToken ? req.csrfToken() : null;
  console.log('CSRF Token for upload form:', csrfToken);
  res.render('jobs/upload', {
    recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY,
    csrfToken: csrfToken,
  });
});

// === POST: Upload form submission ===

router.post('/upload', jobUploadLimiter, csrfProtection, upload.array('images', 8), verifyRecaptcha, async (req, res) => {
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





    // --- REPLACED RECAPTCHA VERIFICATION WITH MIDDLEWARE ---
    // The verifyRecaptcha middleware now handles this.
    // If it reaches here, reCAPTCHA is already verified.

    let geoData;
    try {
        geoData = await geocodeAddress(safeLocation); // NEW: Use the geocode utility
    } catch (geoError) {
        // Handle errors thrown by geocodeAddress (e.g., API issues)
        console.error('❌ Geocoding error:', geoError.message);
        return res.status(500).render('jobs/upload-error', {
            title: 'Location Error',
            message: 'Failed to process location. Please try again later.'
        });
    }

    if (!geoData) {
     
      return res.status(400).render('jobs/upload-error', {
        title: 'Location Error',
        message: 'Unable to find a precise location for the given address/postcode. Please try a more specific address.'
      });
    }

    const { lat, lng } = geoData; 
    const uploadedS3Urls = [];

    for (const file of req.files || []) {
      const compressedBuffer = await sharp(file.buffer)
        .resize({ width: 1920, withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toBuffer();

      const uniqueFileName = `${randomUUID()}.jpg`;
      const s3Key = `job-images/${uniqueFileName}`;

      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key,
        Body: compressedBuffer,
        ContentType: 'image/jpeg',
      }));

      const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
      uploadedS3Urls.push(imageUrl);
    }

    const extendToken = crypto.randomBytes(32).toString('hex');
    const cancelToken = crypto.randomBytes(32).toString('hex');

    await Job.create({
      customerName: safeName,
      customerEmail: safeEmail,
      customerPhone: telephone,
      location: safeLocation,
      latitude: lat,
      longitude: lng,
      images: uploadedS3Urls,
      status: 'pending',
      paid: false,
      extendToken,
      cancelToken,
      extendTokenUsed: false,
      cancelTokenUsed: false
    });

    res.render('jobs/upload-success');
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).render('jobs/upload-error', {
      title: 'Server Error',
      message: 'Something went wrong. Please try again later.'
    });
  }
});

router.get('/action/:jobId/:token', (req, res, next) => {
  console.log('🔔 Route hit:', req.originalUrl);
  next();
}, handleJobAction);



// === POST: Extend job via secure token ===
router.post('/jobs/extend/:token', async (req, res) => {
  try {
    const job = await Job.findOne({ where: { extendToken: req.params.token } });

    if (!job) {
      return res.status(404).render('jobs/action-expired');
    }

    if (job.extendTokenUsed || job.extended) {
      return res.render('jobs/already-extended', { job });
    }

    job.extended = true;
    job.extendTokenUsed = true;
    job.extensionRequestedAt = new Date();
    await job.save();

    res.render('jobs/extended-confirmation', { job });
  } catch (err) {
    console.error('❌ Extend Error:', err);
    res.status(500).render('jobs/action-error', {
      message: 'Unable to extend the job. Please try again later.'
    });
  }
});



export default router;