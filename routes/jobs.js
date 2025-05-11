// routes/jobs.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');
const { Job, Quote,Bodyshop } = require('../models');

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

// === POST Upload Form with Sharp Compression and Coordinates Fetching ===
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

// === Archive Job ===
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
    res.status(500).send('Server error');
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


// === Move Job to Deleted Status (from Archived) ===
router.post('/:jobId/delete', async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.jobId);
    if (!job || job.status !== 'archived') {
      return res.status(400).send('Only archived jobs can be deleted.');
    }

    // Move to "deleted" status instead of full removal
    await job.update({ status: 'deleted' });

    res.redirect('/jobs/admin?filter=deleted');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


// === Restore Deleted Job ===
router.post('/:jobId/restore-deleted', async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.jobId);

    if (!job || job.status !== 'deleted') {
      return res.status(400).send('Only deleted jobs can be restored.');
    }

    // Restore the job to 'pending' or another appropriate status
    await job.update({ status: 'pending' });

    res.redirect('/jobs/admin?filter=deleted');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// === Jobs with Quotes (Admin) ===
router.get('/admin/quotes', async (req, res) => {
  try {
      const jobs = await Job.findAll({
          include: [
              {
                  model: Quote,
                  include: [Bodyshop]
              }
          ],
          order: [['createdAt', 'DESC']]
      });

      // Count jobs by status
      const totalCount = await Job.count();
      const liveCount = await Job.count({ where: { status: { [Op.or]: ['pending', 'approved'] } } });
      const approvedCount = await Job.count({ where: { status: 'approved' } });
      const rejectedCount = await Job.count({ where: { status: 'rejected' } });
      const archivedCount = await Job.count({ where: { status: 'archived' } });
      const deletedCount = await Job.count({ where: { status: 'deleted' } });

      console.log("Fetched Jobs with Quotes:", jobs); // Debug line

      res.render('admin-jobs-quotes', {
          jobs,
          totalCount,
          liveCount,
          approvedCount,
          rejectedCount,
          archivedCount,
          deletedCount
      });
  } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
  }
});


module.exports = router;