import express from 'express';
import multer from 'multer';
import csurf from 'csurf';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

import { Job, Bodyshop } from '../models/index.js';
import { verifyRecaptcha } from '../middleware/recaptchaVerify.js';
import { jobUploadLimiter } from '../middleware/rateLimiter.js';
import { geocodeAddress } from '../utils/geocode.js';

dotenv.config();

const router = express.Router();

const csrfProtection = csurf({ cookie: true }); 

const DEBUG_UPLOAD = process.env.DEBUG_UPLOAD === 'true';

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
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'image/jpeg') {
      return cb(new Error('Only JPEG images are allowed!'));
    }
    cb(null, true);
  },
});

router.get('/upload', csrfProtection, (req, res) => {
  const csrfToken = req.csrfToken ? req.csrfToken() : null;
  console.log('CSRF Token for upload form (uploads.js GET):', csrfToken);
  res.render('jobs/upload', {
    recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY,
    csrfToken: csrfToken,
  });
});

router.post(
  '/upload',
  jobUploadLimiter,
  upload.array('images', 8),
  verifyRecaptcha,
  csrfProtection,
  async (req, res) => {
    const phoneRegex = /^07\d{9}$/;
    const { customerName, email, postcode, description } = req.body;
    const telephone = req.body.telephone ? req.body.telephone.trim() : ''; 
    

    if (DEBUG_UPLOAD) {
    console.log('CSRF Token from req.body (after multer):', req.body._csrf);
    console.log('reCAPTCHA response from req.body:', req.body['g-recaptcha-response']);
    console.log('Full req.body received:', req.body);

    console.log('--- Debugging Sanitize Inputs ---');
    console.log('customerName received:', customerName);
    console.log('email received:', email);
    console.log('postcode received:', postcode);
    console.log('---------------------------------');
    // ----------------------------

    console.log('Phone number received (after trim):', telephone);
    console.log('Phone number length (after trim):', telephone.length);
    console.log('Phone number type:', typeof telephone);
    console.log('Does phone match regex?', phoneRegex.test(telephone));
    }

    try {
      if (!phoneRegex.test(telephone)) {
          console.error('❌ Phone validation failed. Value:', telephone, 'Length:', telephone.length);
          return res.status(400).render('jobs/upload-error', {
              title: 'Invalid telephone number',
              message: 'Please enter a valid UK phone number (07...).'
          });
      }


      const sanitize = (text) => (text || '').trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const safeName = sanitize(customerName); 
      const safeEmail = sanitize(email);
      const safeLocation = sanitize(postcode);



      const bodyshopMatch = await Bodyshop.findOne({
          where: {
              email: safeEmail.trim(),
              area: safeLocation.trim(),
          }
      });


      if (bodyshopMatch) {
        return res.status(403).render('jobs/upload-error', {
            title: 'Access Restricted',
            message: 'This email and postcode are already registered to a bodyshop. Please log in through the bodyshop portal.',
        });
      }

    let geoData;
    try {
        geoData = await geocodeAddress(safeLocation);
    } catch (geoError) {
        console.error('❌ Geocoding error in uploads.js:', geoError.message);
        return res.status(500).render('jobs/upload-error', {
            title: 'Location Error',
            message: 'Failed to process location. Please try again later.'
        });
    }

    if (!geoData) {
        return res.status(400).render('jobs/upload-error', {
            title: 'Location Error',
            message: 'Unable to find a precise location for the given postcode. Please try a more specific address.'
        });
    }

    const { lat, lng } = geoData; 

      const uploadedS3Urls = [];
      for (const file of req.files || []) {
        if (!file.buffer?.length) continue;

        let processedBuffer;
        try {
            if (file.mimetype === 'image/heic') {
                processedBuffer = await sharp(file.buffer).toFormat('jpeg').jpeg({ quality: 80 }).toBuffer();
            } else {
                processedBuffer = await sharp(file.buffer)
                    .resize({ width: 1600, withoutEnlargement: true })
                    .jpeg({ quality: 60, mozjpeg: true, progressive: true })
                    .toBuffer();
            }
        } catch (imgErr) {
            console.error('❌ Image processing error:', imgErr);
            return res.status(400).render('jobs/upload-error', {
                title: 'Image Processing Error',
                message: 'Failed to process an image. Please try again with valid image files.',
            });
        }

        const s3Key = `job-images/${crypto.randomUUID()}.jpg`;
        await s3Client.send(new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: s3Key,
          Body: processedBuffer,
          ContentType: 'image/jpeg',
          Metadata: {
            uploadedBy: 'customer-upload',
            originalFilename: file.originalname,
          },
          CacheControl: 'max-age=31536000',
        }));
        uploadedS3Urls.push(`https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`);
      }

      const newJob = await Job.create({
        customerName: safeName,
        customerEmail: safeEmail,
        customerPhone: telephone,
        location: safeLocation.trim(),
        description: description ? description.trim() : null,
        latitude: lat,
        longitude: lng,
        images: uploadedS3Urls,
        status: 'pending',
        paid: false,
        extendToken: crypto.randomBytes(32).toString('hex'),
        cancelToken: crypto.randomBytes(32).toString('hex'),
        extendTokenUsed: false,
        cancelTokenUsed: false
      });

    if (DEBUG_UPLOAD) console.log('✅ Job created:', newJob.id);
      
      res.render('jobs/upload-success');
    } catch (err) {
      console.error('❌ Job upload failed:', err);
      let errorMessage = 'Something went wrong. Please try again later.';
      let errorTitle = 'Upload Error';

      if (err instanceof multer.MulterError) {
        errorMessage = `File upload error: ${err.message}`;
      } else if (err.message.includes('Only .jpeg, .png, and .heic files are allowed!')) {
        errorMessage = err.message;
      } else if (err.message.includes('Unable to find coordinates')) {
        errorMessage = 'Invalid postcode. Please enter a valid UK postcode.';
        errorTitle = 'Location Error';
      }

      res.status(500).render('jobs/upload-error', {
        title: errorTitle,
        message: errorMessage,
      });
    }
  }
);

export default router;