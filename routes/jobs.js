// routes/jobs.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Op } = require('sequelize');
const { Job, Quote, Bodyshop } = require('../models');

require('dotenv').config();

const router = express.Router();
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

// === AWS S3 Configuration ===
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// === Multer Storage Config (temporary location for Sharp to process) ===
const tempStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = path.join(__dirname, '..', 'uploads', 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ storage: tempStorage });

// === POST Upload Form with S3 Upload ===
router.post('/upload', (req, res, next) => {
    upload.array('images', 8)(req, res, async (err) => {
        if (err) {
            console.error('❌ Multer error:', err);
            return res.status(500).render('upload-error', {
                title: 'Upload Error',
                message: 'An unexpected error occurred during file upload.'
            });
        }

        try {
            const phoneRegex = /^07\d{9}$/;
            const { name, email, location, telephone } = req.body;

            if (!phoneRegex.test(telephone)) {
                return res.status(400).render('upload-error', {
                    title: 'Invalid telephone number',
                    message: 'Please enter a valid UK phone number (07...).'
                });
            }

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
                console.error('❌ No coordinates found for:', location);
                return res.status(400).render('upload-error', {
                    title: 'Location Error',
                    message: 'Unable to find coordinates for the given postcode.'
                });
            }

            const { lat, lng } = geoRes.data.results[0].geometry;
            console.log('Latitude:', lat, 'Longitude:', lng);

            const compressedFilenames = [];
            for (const file of req.files) {
                const compressedFilename = `compressed-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
                
                // Compress the image
                const compressedBuffer = await sharp(file.path)
                    .resize({ width: 1920 })
                    .jpeg({ quality: 75 })
                    .toBuffer();

                // Upload to S3
                const s3Key = `job-images/${compressedFilename}`;
                const uploadParams = {
                    Bucket: process.env.AWS_S3_BUCKET_NAME,
                    Key: s3Key,
                    Body: compressedBuffer,
                    ContentType: 'image/jpeg',
                    ACL: 'public-read'
                };

                await s3Client.send(new PutObjectCommand(uploadParams));
                console.log(`✅ Uploaded to S3: ${s3Key}`);
                compressedFilenames.push(s3Key);

                // Clean up temp file
                fs.unlinkSync(file.path);
            }

            // Save job to DB
            await Job.create({
                customerName: name,
                customerEmail: email,
                customerPhone: telephone,
                location,
                latitude: lat,
                longitude: lng,
                images: compressedFilenames,
                status: 'pending',
                paid: false
            });

            res.render('upload-success');
        } catch (err) {
            console.error('❌ Error in upload logic:', err);
            res.status(500).render('upload-error', {
                title: 'Server Error',
                message: 'Something went wrong. Please try again later.'
            });
        }
    });
});

module.exports = router;