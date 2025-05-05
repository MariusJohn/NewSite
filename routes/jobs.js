// routes/jobs.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');
const { Job, Quote } = require('../models');

require('dotenv').config();

const router = express.Router();
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

const tempDir = path.join(__dirname, '..', 'uploads', 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// === Multer Storage Config (temporary location for Sharp to process) ===
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'temp'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: tempStorage }); // ✅ No file size limit here


// === GET Upload Form ===
router.get('/upload', (req, res) => {
  res.render('job-upload');
});

// === POST Upload Form with Sharp Compression and Cleanup ===
router.post('/upload', (req, res, next) => {
  upload.array('images', 8)(req, res, async (err) => {
    if (err && err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).render('upload-error', {
        title: 'Upload Error',
        message: 'Too many files uploaded. Maximum allowed is 8 images.'
      });
    } else if (err) {
      console.error('❌ Multer error:', err);
      return res.status(500).render('upload-error', {
        title: 'Upload Error',
        message: 'An unexpected error occurred during file upload.'
      });
    }

    try {
      const { name, email, location } = req.body;
      const recaptchaResponse = req.body['g-recaptcha-response'];

      if (!recaptchaResponse) {
        return res.status(400).render('upload-error', {
          title: 'CAPTCHA Error',
          message: 'CAPTCHA missing. Please complete the CAPTCHA verification.'
        });
      }

      const verifyRes = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        new URLSearchParams({
          secret: RECAPTCHA_SECRET_KEY,
          response: recaptchaResponse
        })
      );

      if (!verifyRes.data.success) {
        return res.status(400).render('upload-error', {
          title: 'CAPTCHA Error',
          message: 'CAPTCHA verification failed. Please try again.'
        });
      }

      // Duplicate check
      const uploadedFilenames = req.files.map(file => file.originalname);
      const duplicates = uploadedFilenames.filter((item, idx) => uploadedFilenames.indexOf(item) !== idx);
      if (duplicates.length > 0) {
        return res.status(400).render('upload-error', {
          title: 'Upload Error',
          message: `Duplicate images detected: ${duplicates.join(', ')}`
        });
      }

      // === Sharp Compression and File Size Enforcement ===
      const compressedFilenames = [];
      const finalDir = path.join(__dirname, '..', 'uploads', 'job-images');

      for (const file of req.files) {
        const stats = fs.statSync(file.path);
        const sizeMB = stats.size / (1024 * 1024);

        if (sizeMB > 20) {
          fs.unlinkSync(file.path);
          return res.status(400).render('upload-error', {
            title: 'Image Too Large',
            message: `The image "${file.originalname}" is larger than 20MB and was rejected.`
          });
        }

        const compressedFilename = `compressed-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
        const outputPath = path.join(finalDir, compressedFilename);

        await sharp(file.path)
          .resize({ width: 1920 })
          .jpeg({ quality: 75 })
          .toFile(outputPath);

        fs.unlinkSync(file.path); // Clean up temp file
        compressedFilenames.push(compressedFilename);
      }

      // Save job to DB
      await Job.create({
        customerName: name,
        customerEmail: email,
        location,
        images: JSON.stringify(compressedFilenames),
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



// === Admin Job List ===
router.get('/admin', async (req, res) => {
  try {
    const jobs = await Job.findAll();
    res.render('admin-jobs', { jobs });
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Error loading jobs.');
  }
});

// === Approve Job ===
router.post('/:id/approve', async (req, res) => {
  try {
    await Job.update({ status: 'approved' }, { where: { id: req.params.id } });
    res.redirect('/jobs/admin');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Error approving job.');
  }
});

// === Reject Job ===
router.post('/:id/reject', async (req, res) => {
  try {
    await Job.update({ status: 'rejected' }, { where: { id: req.params.id } });
    res.redirect('/jobs/admin');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Error rejecting job.');
  }
});

// === View Quotes for a Job ===
router.get('/quotes/:jobId', async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.jobId);
    const quotes = await Quote.findAll({ where: { jobId: job.id } });
    res.render('job-quotes', { job, quotes });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading quotes');
  }
});

// === Accept a Quote and Notify ===
router.post('/quotes/:jobId/select', async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const selectedBodyshop = req.body.bodyshopName;

    const job = await Job.findByPk(jobId);
    if (!job || job.selectedBodyshop) {
      return res.status(400).send('Quote already accepted or job not found');
    }

    await job.update({ selectedBodyshop, status: 'allocated' });

    const quote = await Quote.findOne({ where: { jobId, bodyshopName: selectedBodyshop } });

    if (quote) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.ionos.co.uk',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: quote.email,
        subject: '✅ Your quote has been accepted!',
        html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #0066cc;">MC Quote - Quote Accepted</h2>
          <p>Hello <strong>${quote.bodyshopName}</strong>,</p>
          <p>Great news! Your quote of <strong>£${quote.price}</strong> has been selected for the following job:</p>
          <ul>
            <li><strong>Job ID:</strong> ${job.id}</li>
            <li><strong>Location:</strong> ${job.location}</li>
          </ul>
          <p>Please log in to your dashboard to view the full job details.</p>
          <br>
          <p>Thank you,</p>
          <p><strong>MC Quote Team</strong></p>
        </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`📧 Email sent to ${quote.email}`);
    }

    res.redirect(`/jobs/quotes/${jobId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error accepting quote');
  }
});

module.exports = router;
