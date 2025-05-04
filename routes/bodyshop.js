// routes/bodyshop.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { Op } = require('sequelize');
const { Job, Quote } = require('../models');
const { requireBodyshopLogin } = require('../middleware/auth');


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

// === GET: Bodyshop Login Page ===
router.get('/login', (req, res) => {
    res.render('bodyshop-login');
  });
  
  // === POST: Handle Bodyshop Login ===
  router.post('/login', (req, res) => {
    const { bodyshopName, bodyshopArea } = req.body;
  
    if (!bodyshopName || !bodyshopArea) {
      return res.status(400).send('Both fields are required');
    }
    req.session.bodyshopId = bodyshop.id;
    req.session.bodyshopName = bodyshopName;
    req.session.bodyshopArea = bodyshopArea;
  
    res.redirect('/bodyshop/dashboard');
  });
  

// === Bodyshop Dashboard (View Available Jobs) ===
router.get('/dashboard', requireBodyshopLogin, async (req, res) => {
    console.log('Bodyshop area from session:', req.session.bodyshopArea);

    try {
        const bodyshopArea = 'WS10';

        const jobs = await Job.findAll({
            where: {
                status: 'pending',
                location: { [Op.like]: `${bodyshopArea}%` }
            }
        });
        res.render('bodyshop-dashboard', { headerData, footerData, jobs });
    } catch (error) {
        console.error(error);
        res.status(500).send('❌ Error loading jobs.');
    }
});

// === Submit a Quote ===
router.post('/quote/:jobId',requireBodyshopLogin, async (req, res) => {
    try {
        const { quoteAmount } = req.body;
        const { jobId } = req.params;
        const bodyshopName = 'VASILE SRL';

        // Prevent duplicate quotes
        const existing = await Quote.findOne({ where: { jobId, bodyshopName } });
        if (existing) {
            return res.status(400).send('You have already submitted a quote for this job.');
        }

        await Quote.create({
            jobId,
            bodyshopName,
            price: quoteAmount
        });

        res.redirect('/bodyshop/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error submitting quote');
    }
});

// === Download all job images as ZIP ===
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

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
      res.redirect('/bodyshop/login');
    });
  });
  

  // === GET: Simulated Payment Page for a Job ===
router.get('/pay/:jobId', async (req, res) => {
    try {
      const job = await Job.findByPk(req.params.jobId);
      if (!job || job.paid) {
        return res.status(400).send('Job already paid or not found.');
      }
      res.render('pay-job', { job });
    } catch (err) {
      console.error(err);
      res.status(500).send('Error loading payment page.');
    }
  });
  
  // === POST: Simulate Payment Confirmation ===
  router.post('/pay/:jobId', async (req, res) => {
    try {
      const job = await Job.findByPk(req.params.jobId);
      if (!job || job.paid) {
        return res.status(400).send('Job already paid or not found.');
      }
  
      // Simulate Stripe payment success
      await job.update({ paid: true });
  
      // Send confirmation email to bodyshop
      const quote = await Quote.findOne({
        where: { jobId: job.id, bodyshopName: job.selectedBodyshop }
      });
  
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
          subject: '✅ Payment Confirmed – Job Details Released',
          text: `Hello ${quote.bodyshopName},
  
  The job #${job.id} has been confirmed after payment.
  
  Customer Details:
  Name: ${job.customerName}
  Email: ${job.customerEmail}
  Location: ${job.location}
  
  Please proceed to contact the customer and schedule the repair.
  
  - MC Quote`
        };
  
        await transporter.sendMail(mailOptions);
        console.log(`📧 Full job email sent to ${quote.email}`);
      }
  
      res.send('✅ Payment processed. Customer details sent to your email.');
    } catch (err) {
      console.error(err);
      res.status(500).send('❌ Payment processing failed.');
    }
  });
  

module.exports = router;
