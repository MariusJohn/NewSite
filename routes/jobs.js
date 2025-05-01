// routes/jobs.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { Job } = require('../models');

const router = express.Router();

// Configure multer (upload to uploads/job-images/)
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

// Route: GET form
router.get('/upload', (req, res) => {
  res.render('job-upload');
});

// Route: POST form
router.post('/upload', upload.array('images', 5), async (req, res) => {
  try {
    const { name, email, location } = req.body;
    const imageFilenames = req.files.map(file => file.filename);

    // Save job in database (pending approval)
    await Job.create({
      customerName: name,
      customerEmail: email,
      location,
      images: JSON.stringify(imageFilenames),
      status: 'pending'
    });

    res.send('Your job has been submitted and is awaiting approval!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error submitting your job.');
  }
});

module.exports = router;
