// routes/jobs.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { Job } = require('../models');
const axios = require('axios');

const RECAPTCHA_SECRET_KEY = '6LdiViwrAAAAABQSjcrF9er3Jktqgi6E3iCMPcRb';

const router = express.Router();

// === Multer Storage Config ===
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads', 'job-images'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
});

// === Route: GET Upload Form ===
router.get('/upload', (req, res) => {
  res.render('job-upload');
});

// === Route: POST Upload Form ===
router.post('/upload', upload.array('images', 8), async (req, res) => {
  try {
    const { name, email, location } = req.body;
    const recaptchaResponse = req.body['g-recaptcha-response'];

    // Validate CAPTCHA
    if (!recaptchaResponse) {
      return res.status(400).send('Error: Please complete the CAPTCHA.');
    }

    const captchaVerifyRes = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      new URLSearchParams({
        secret: RECAPTCHA_SECRET_KEY,
        response: recaptchaResponse
      })
    );

    if (!captchaVerifyRes.data.success) {
      return res.status(400).send('Error: CAPTCHA verification failed.');
    }

    //Check for duplicate filenames in upload batch
    const uploadedFilenames = req.files.map(file => file.originalname);
    const duplicates = uploadedFilenames.filter((item, index) => uploadedFilenames.indexOf(item) !== index);

    if (duplicates.length > 0) {
      return res.status(400).send(`Error: Duplicate images detected: ${duplicates.join(', ')}. Please upload unique images.`);
    }

    // Save job to database
    const imageFilenames = req.files.map(file => file.filename);

    await Job.create({
      customerName: name,
      customerEmail: email,
      location,
      images: JSON.stringify(imageFilenames),
      status: 'pending'
    });

    res.send('✅ Your job has been submitted and is awaiting approval!');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Error submitting your job.');
  }
});

// === Route: Admin View - List Jobs ===
router.get('/admin', async (req, res) => {
  try {
    const jobs = await Job.findAll();
    res.render('admin-jobs', { jobs });
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Error loading jobs.');
  }
});

module.exports = router;
