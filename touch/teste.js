import express from 'express';
const router = express.Router();
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
  limits: { fileSize: 8 * 1024 * 1024 },
});

// === Job Upload Form ===
router.get('/upload', (req, res) => {
  res.render('jobs/upload');
});

// === Job Upload Submission ===
router.post('/upload', jobUploadLimiter, upload.array('images', 8), async (req, res) => {
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

    const verifyResponse = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
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

    const geoRes = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
      params: {
        q: location,
        key: process.env.OPENCAGE_API_KEY,
        countrycode: 'gb',
        limit: 1
      }
    });

    if (!geoRes.data.results?.length) {
      return res.status(400).render('jobs/upload-error', {
        title: 'Location Error',
        message: 'Unable to find coordinates for the given postcode.'
      });
    }

    const { lat, lng } = geoRes.data.results[0].geometry;
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
      customerName: name,
      customerEmail: email,
      customerPhone: telephone,
      location,
      latitude: lat,
      longitude: lng,
      images: uploadedS3Urls,
      status: 'pending',
      paid: false,
      extendToken,
      cancelToken
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

// === Customer Action (Extend/Cancel) ===
router.get('/action/:jobId/:token', handleJobAction);

export default router;
