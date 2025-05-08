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

const upload = multer({ storage: tempStorage });

// === GET Upload Form ===
router.get('/upload', (req, res) => {
  res.render('job-upload');
});

// === POST Upload Form with Sharp Compression and Cleanup ===
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

      // Image Compression
      const compressedFilenames = [];
      const finalDir = path.join(__dirname, '..', 'uploads', 'job-images');
      for (const file of req.files) {
        const compressedFilename = `compressed-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
        const outputPath = path.join(finalDir, compressedFilename);

        await sharp(file.path)
          .resize({ width: 1920 })
          .jpeg({ quality: 75 })
          .toFile(outputPath);

        fs.unlinkSync(file.path);
        compressedFilenames.push(compressedFilename);
      }

      // Save job to DB
      await Job.create({
        customerName: name,
        customerEmail: email,
        customerPhone: telephone,
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

// === Admin Job List with Filters and Counts ===
router.get('/admin', async (req, res) => {
  try {
    const filter = req.query.filter || 'total';
    let whereClause = {};

    switch (filter) {
      case 'total':
        break;
      case 'live':
        whereClause.status = { [Op.or]: ['pending', 'approved'] };
        break;
      case 'approved':
        whereClause.status = 'approved';
        break;
      case 'rejected':
        whereClause.status = 'rejected';
        break;
      case 'archived':
        whereClause.status = 'archived';
        break;
      case 'deleted':
        whereClause.status = 'deleted';
        break;
      default:
        break;
    }

    const jobs = await Job.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    const totalCount = await Job.count();
    const liveCount = await Job.count({ where: { status: { [Op.or]: ['pending', 'approved'] } } });
    const approvedCount = await Job.count({ where: { status: 'approved' } });
    const rejectedCount = await Job.count({ where: { status: 'rejected' } });
    const archivedCount = await Job.count({ where: { status: 'archived' } });
    const deletedCount = await Job.count({ where: { status: 'deleted' } });

    res.render('admin-jobs', {
      jobs,
      totalCount,
      liveCount,
      approvedCount,
      rejectedCount,
      archivedCount,
      deletedCount,
      filter
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// === Approve Job ===
router.post('/:id/approve', async (req, res) => {
  try {
    await Job.update({ status: 'approved' }, { where: { id: req.params.id } });
    res.redirect('/jobs/admin?filter=live');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Error approving job.');
  }
});

// === Reject Job ===
router.post('/:id/reject', async (req, res) => {
  try {
    await Job.update({ status: 'rejected' }, { where: { id: req.params.id } });
    res.redirect('/jobs/admin?filter=rejected');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Error rejecting job.');
  }
});




// === Restore Archived & Rejected Job ===
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
    res.status(500).send('Server error');
  }
});


// === Delete Job ===
router.post('/:jobId/delete', async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.jobId);
    if (!job || job.status !== 'archived') {
      return res.status(400).send('Only archived jobs can be deleted.');
    }

    const images = JSON.parse(job.images);
    for (const image of images) {
      const imagePath = path.join(__dirname, '..', 'uploads', 'job-images', image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await job.destroy();
    res.redirect('/jobs/admin?filter=deleted');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;