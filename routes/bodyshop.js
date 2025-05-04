// routes/bodyshop.js
const express = require('express');
const router = express.Router();
const headerData = {
    logo: '/public/img/logo.png',
    navLinks: [
        { url: '/', text: 'Home' },
        { url: '/quotations', text: 'Private Quotations' },
        { url: '/bodyshop', text: 'Bodyshop Support' },
        { url: '/training', text: 'Training' },
        { url: '/training', text: 'Pricing' },
        { url: '/contact', text: 'Contact' }
    ]
};
const footerData = {
    content: '&copy; 2025 MC Quote'
};

// === Main Bodyshop Support page ===
router.get('/', (req, res) => {
    const pageData = {
        title: 'MC Quote - Bodyshop',
        headerData,
        mainContent: 'Welcome to the MC Quote website!',
        sidebarContent: 'This is the sidebar on the bodyshop page.',
        content1: 'Bodyshop Content 1',
        content2: 'Bodyshop Content 2',
        content3: 'Bodyshop Content 3',
        footerData
    };
    res.render('bodyshop', pageData);
});

// === Bodyshop Dashboard (View Available Jobs) ===
router.get('/dashboard', async (req, res) => {
    try {
        const jobs = await Job.findAll({ where: { status: 'pending' } }); // Only show pending jobs
        res.render('bodyshop-dashboard', { headerData, footerData, jobs });
    } catch (error) {
        console.error(error);
        res.status(500).send('❌ Error loading jobs.');
    }
});

const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { Job } = require('../models');

// === Route: Download all job images as ZIP ===
router.get('/download/:jobId', async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.jobId);
    if (!job) return res.status(404).send('Job not found.');

    const images = JSON.parse(job.images);
    const archive = archiver('zip', { zlib: { level: 9 } });

    res.attachment(`job-${job.id}-images.zip`);
    archive.pipe(res);

    images.forEach(filename => {
      const filePath = path.join(__dirname, '..', 'uploads', 'job-images', filename);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: filename });
      }
    });

    await archive.finalize();
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating ZIP file.');
  }
});


module.exports = router;
