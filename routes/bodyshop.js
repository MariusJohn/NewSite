// routes/bodyshop.js
import express from 'express';
const router = express.Router();
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv'; 
import axios from 'axios';
import crypto from 'crypto';
import { Job, Quote, Bodyshop, sequelize } from '../models/index.js'; 
import { requireBodyshopLogin } from '../middleware/auth.js'; 
import { getUnselectedJobs } from '../controllers/bodyshopUnselectedJobsController.js';
import { checkSubscriptionActive } from '../middleware/subscriptionCheck.js';
import jwt from 'jsonwebtoken'; 

import { submitQuote } from '../controllers/bodyshopController.js';


dotenv.config(); // Keep this as it is after the import


// === Haversine distance calculator ===
function calculateDistance(lat1, lon1, lat2, lon2) {
    const toRad = deg => deg * (Math.PI / 180);
    const R = 6371; // Radius of Earth in km
  
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
  
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) ** 2;
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c) * 0.621371; // Convert to miles
  }




const headerData = {
    logo: '/public/img/logo.svg',
    navLinks: [
        { url: '/', text: 'Home' },
        { url: '/quotations', text: 'Private Quotations' },
        { url: '/bodyshop', text: 'Bodyshop Support' },
        { url: '/training', text: 'Training' },
        { url: '/pricing', text: 'Pricing' },
        { url: '/contact', text: 'Contact' }
    ]
};

const footerData = {
    content: '&copy; 2025 My Car Quote'
};

// === Main Bodyshop Support page ===
router.get('/', (req, res) => {
    const pageData = {
        title: 'My Car Quote - Bodyshop',
        headerData,
        mainContent: 'Welcome to the My Car Quote website!',
        sidebarContent: 'This is the sidebar on the bodyshop page.',
        content1: 'Bodyshop Content 1',
        content2: 'Bodyshop Content 2',
        content3: 'Bodyshop Content 3',
        footerData
    };
    res.render('static/bodyshop', pageData);
});

// === GET Registration Page ===
router.get('/register', (req, res) => {
    res.render('bodyshop/register', { error: null });
});

// === POST Registration Handler with Password Validation ===
router.post('/register', async (req, res) => {
  const { name, email, password, phone, confirmPassword, area } = req.body;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  const postcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i;
  const phoneRegex = /^07\d{9}$/;
  const normalizedArea = area.replace(/\s+/g, '').toUpperCase();

  if (!phoneRegex.test(phone)) {
    return res.render('bodyshop/register', { error: 'Please enter a valid UK phone number (07...)' });
  }
  if (!passwordRegex.test(password)) {
    return res.render('bodyshop/register', { error: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.' });
  }
  if (!postcodeRegex.test(normalizedArea)) {
    return res.render('bodyshop/register', { error: 'Please enter a valid UK postcode.' });
  }
  if (password !== confirmPassword) {
    return res.render('bodyshop/register', { error: 'Passwords do not match.' });
  }

  try {
    const existing = await Bodyshop.findOne({ where: { email } });
    if (existing) {
      return res.render('bodyshop/register', { error: 'This email is already registered.' });
    }

    // Get coordinates from OpenCage
    const apiKey = process.env.OPENCAGE_API_KEY;
    const response = await axios.get(`https://api.opencagedata.com/geocode/v1/json`, {
      params: { q: normalizedArea, key: apiKey, countrycode: 'gb', limit: 1 }
    });

    if (!response.data.results.length) {
      return res.render('bodyshop/register', { error: 'Unable to find coordinates for the given postcode.' });
    }

    const { lat, lng } = response.data.results[0].geometry;
    const hashedPassword = await bcrypt.hash(password, 10);
    const trialEndsAt = new Date(new Date().setFullYear(new Date().getFullYear() + 1));

    // Create JWT payload
    const payload = {
      name,
      email,
      phone,
      password: hashedPassword,
      area: normalizedArea,
      latitude: lat,
      longitude: lng,
      trialEndsAt,
    };

    console.log(process.env.JWT_SECRET)

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '72h' });
    const verificationUrl = `http://${req.headers.host}/bodyshop/verify/${token}`;

    // Send verification email
    const transporter = nodemailer.createTransport({
      host: 'smtp.ionos.co.uk',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    console.log('⚠️ Reached transporter setup...');


    try {

        await transporter.verify();
        console.log('✅ SMTP server is ready to send emails.');
      } catch (err) {
        console.error('❌ SMTP verification failed:', err);
      }
      
      const mailOptions = {
        from: '"My Car Quote" <office@mcquote.co.uk>',
        to: email,
        subject: '📧 Verify Your Bodyshop Account',
        html: `
          <div style="font-family: Arial, sans-serif; color: #002f5c; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://mcquote.co.uk/img/logo.svg" alt="My Car Quote Logo" style="height: 60px;" />
            </div>
      
            <h2 style="color: #002f5c;">Verify Your Bodyshop Email</h2>
      
            <p>Thank you for registering your bodyshop with My Car Quote.</p>
            <p>To complete your registration, please verify your email by clicking the button below:</p>
      
            <p style="text-align: center; margin: 20px 0;">
              <a href="${verificationUrl}" style="
                display: inline-block;
                padding: 12px 24px;
                background-color: #28a745;
                color: #fff;
                font-weight: bold;
                text-decoration: none;
                border-radius: 5px;
              ">✅ Verify My Email</a>
            </p>
      
            <p>This link will expire in <strong>72 hours</strong>.</p>
      
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ccc;" />
      
            <p style="font-size: 13px; color: #999;">
              If you didn’t request this, please ignore this message.<br/>
              No changes will be made unless the link is used.
            </p>
          </div>
        `
      };
      
      
      

    await transporter.sendMail(mailOptions);
    console.log(`📧 Verification email sent to ${email}`);

    res.render('bodyshop/register', {
      error: 'Registration successful! Please check your email to verify your account.'
    });
  } catch (error) {
    console.error('❌ Outer registration error:', error.message, error.stack);
    res.render('bodyshop/register', { error: 'Registration failed. Please try again later.' });
  
  }

});



// === GET: Verify Bodyshop Email ===
router.get('/verify/:token', async (req, res) => {
  const token = req.params.token;

  try {
    // 1. Decode token
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { name, email, phone, password, area, latitude, longitude, trialEndsAt } = payload;

    // 2. Check if user already verified
    const existing = await Bodyshop.findOne({ where: { email } });
    if (existing) {
      return res.send('✅ Your account is already verified or awaiting admin approval.');
    }

    // 3. Create Bodyshop record
    await Bodyshop.create({
      name,
      email,
      phone,
      password,
      area,
      latitude,
      longitude,
      verified: true,
      adminApproved: false,
      status: 'pending',
      subscriptionType: 'free',
      subscriptionStatus: 'trial',
      subscriptionEndsAt: trialEndsAt
    });

    return res.render('bodyshop/verification-confirmed', {
      message: '✅ Email verified! Your account is under review by the admin team.'
    });

  } catch (err) {
    console.error('❌ Email verification failed:', err);
    return res.status(400).send('Verification link is invalid or has expired.');
  }
});


// GET: Bodyshop Login Page
router.get('/login', (req, res) => {
    res.render('bodyshop/login', { error: null });
  });
  

// === GET: Bodyshop Logout ===
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/bodyshop/login');
    });
});

// === POST: Bodyshop Login ===
router.post('/login', async (req, res) => {
    const { email, password, area } = req.body;
    const postcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i;

    try {
        // Check if the email exists
        const bodyshop = await Bodyshop.findOne({ where: { email } });

        if (!bodyshop) {
            return res.render('bodyshop/login', { error: 'Invalid email, password, or postcode.' });
        }

        // Check password
        const passwordMatch = await bcrypt.compare(password, bodyshop.password);
        if (!passwordMatch) {
            return res.render('bodyshop/login', { error: 'Invalid email, password, or postcode.' });
        }

        // Check if the postcode matches
        if (!postcodeRegex.test(area)) {
            return res.render('bodyshop/login', { error: 'Invalid postcode format. Please enter a valid UK postcode.' });
        }

        // Check if the area matches the registered postcode
        if (bodyshop.area.replace(/\s+/g, '').toUpperCase() !== area.replace(/\s+/g, '').toUpperCase()) {
            return res.render('bodyshop/login', { error: 'Incorrect postcode for this account.' });
        }

        // Check if the account is verified
        if (!bodyshop.verified) {
            return res.render('bodyshop/login', { error: 'Please verify your email before logging in.' });
        }

        // ❌ Block inactive bodyshops
        if (bodyshop.status === 'inactive') {
            return res.render('bodyshop/login', { error: 'Your account has been deactivated. Please contact support to reactivate.' });
        }


        // Check if the account is admin approved
        if (!bodyshop.adminApproved) {
            return res.render('bodyshop/login', { error: 'Your account has not been approved by the admin yet.' });
        }

        if (bodyshop.subscriptionType === 'free') {
            const expiry = bodyshop.subscriptionEndsAt || new Date(new Date(bodyshop.createdAt).setFullYear(new Date(bodyshop.createdAt).getFullYear() + 1));
            req.session.subscriptionMessage = '🎉 You’re on a 1-year free trial. Expires: ' + expiry.toDateString();
          }
          

        // Set session
        req.session.bodyshopId = bodyshop.id;
        req.session.bodyshopName = bodyshop.name;
        req.session.bodyshopEmail = bodyshop.email;
        req.session.loggedIn = true;
      




        console.log(`✅ Bodyshop ${email} logged in successfully.`);
        res.redirect('/bodyshop/dashboard');
    } catch (err) {
        console.error('❌ Error during bodyshop login:', err);
        res.render('bodyshop/login-error', { error: 'Bodyshop login failed, please check your login credentials.' });
    }
});

// === GET: Bodyshop Dashboard ===
router.get('/dashboard', requireBodyshopLogin, checkSubscriptionActive, async (req, res) => {
    console.log('Logged in bodyshopId:', req.session.bodyshopId);
    try {
        const tab = req.query.tab || 'available';
        const bodyshop = await Bodyshop.findByPk(req.session.bodyshopId);

        const subscriptionMessage = req.session.subscriptionMessage;
        delete req.session.subscriptionMessage;

        if (!bodyshop.latitude || !bodyshop.longitude) {
            return res.render('bodyshop/dashboard', {
                title: 'Bodyshop Dashboard',
                headerData,
                footerData,
                bodyshopName: bodyshop.name,
                bodyshop,
                jobs: [],
                quotedJobs: [],
                selectedJobs:[],
                tab,
                subscriptionMessage
          });
        }

        // Convert radius to meters (1 mile = 1609.34 meters)
        const maxDistance = (bodyshop.radius || 10) * 1609.34;

        // Fetch jobs within the bodyshop's radius using CTE
        const allJobs = await sequelize.query(`
            WITH JobDistances AS (
                SELECT
                    "Jobs".*,
                    (6371000 * acos(
                        cos(radians(:latitude)) * cos(radians(latitude)) *
                        cos(radians(longitude) - radians(:longitude)) +
                        sin(radians(:latitude)) * sin(radians(latitude))
                    )) AS distance
                FROM "Jobs"
                WHERE status = 'approved'
                AND latitude IS NOT NULL
                AND longitude IS NOT NULL
            )
            SELECT *
            FROM JobDistances
            WHERE distance <= :maxDistance
            ORDER BY distance ASC
        `, {
            replacements: {
                latitude: bodyshop.latitude,
                longitude: bodyshop.longitude,
                maxDistance: maxDistance
            },
            type: sequelize.QueryTypes.SELECT
        });

        const jobs = [];
        const quotedJobs = [];
    
        for (const job of allJobs) {
          const quote = await Quote.findOne({
            where: { bodyshopId: bodyshop.id, jobId: job.id }
          });
    
          if (quote) {
            job.quoteAmount = quote.price;
            job.quoteDate = quote.createdAt;
            job.allocated = quote.allocated || false;
            quotedJobs.push(job);
          } else {
            jobs.push(job);
          }
        }

    // Fetch jobs where this bodyshop was selected and the customer paid
    let selectedJobs = [];

    if (tab === 'selected') {
      selectedJobs = await Job.findAll({
        where: {
          selectedBodyshopId: bodyshop.id,
          paid: true
        },
        attributes: ['id', 'location', 'customerName', 'customerEmail', 'customerPhone', 'images', 'createdAt'],
        order: [['createdAt', 'DESC']]
      });
    }
    
    res.render('bodyshop/dashboard', {
      title: 'Bodyshop Dashboard',
      headerData,
      footerData,
      bodyshopName: bodyshop.name,
      bodyshop,
      jobs,
      quotedJobs,
      selectedJobs,
      tab,
      subscriptionMessage
    });


    } catch (err) {
        console.error('❌ Error loading dashboard:', err);
        res.status(500).send('Server error. Please try again later.');
    }
});



// === POST: Update Radius ===
router.post('/update-radius', requireBodyshopLogin, async (req, res) => {
    const { radius } = req.body;

    try {
        if (radius < 1 || radius > 50) {
            return res.redirect('/bodyshop/dashboard');
        }

        await Bodyshop.update({ radius }, { where: { id: req.session.bodyshopId } });

        console.log(`✅ Updated radius to ${radius} miles for bodyshop ID: ${req.session.bodyshopId}`);
        res.redirect('/bodyshop/dashboard');
    } catch (err) {
        console.error('❌ Error updating radius:', err);
        res.status(500).send('Server error. Please try again later.');
    }
});
// === POST: Job Quote (with distance calculation) ===
router.post('/quote/:jobId', requireBodyshopLogin, checkSubscriptionActive, async (req, res) => {
    const { jobId } = req.params;
    const { price, notes } = req.body;
  
    try {
      const bodyshopId = req.session.bodyshopId;
      const bodyshop = await Bodyshop.findByPk(bodyshopId);
      const job = await Job.findByPk(jobId);
  
      if (!job || !bodyshop) {
        return res.status(404).send('Job or Bodyshop not found.');
      }
  
      // Calculate distance
      let distance = null;
      if (job.latitude && job.longitude && bodyshop.latitude && bodyshop.longitude) {
        distance = calculateDistance(job.latitude, job.longitude, bodyshop.latitude, bodyshop.longitude);
      }
  
      // Save quote with distance
      await Quote.create({
        bodyshopId,
        jobId,
        price,
        notes,
        email: bodyshop.email,
        distance,
        status: 'pending'
      });
  
      res.redirect('/bodyshop/dashboard');
    } catch (err) {
      console.error('❌ Error submitting quote:', err);
      res.status(500).send('Server error while submitting quote.');
    }
  });

// === GET: Unselected Jobs ===
  router.get('/dashboard/unselected', requireBodyshopLogin, checkSubscriptionActive, getUnselectedJobs);



// === GET: Request Password Reset Page ===
router.get('/forgot-password', (req, res) => {
    res.render('bodyshop/forgot-password', { error: null });
  });
  
  // === POST: Send Reset Email ===
  router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
  
    try {
      const bodyshop = await Bodyshop.findOne({ where: { email } });
      if (!bodyshop) {
        return res.render('bodyshop/forgot-password', { error: 'No account with that email.' });
      }
  
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // expires in 1 hour
      
      await Bodyshop.update(
        { resetToken, resetTokenExpiry },
        { where: { email } }
      );
      const resetLink = `http://${req.headers.host}/bodyshop/reset-password/${token}`;
  
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
  
      await transporter.sendMail({
        to: bodyshop.email,
        from: process.env.EMAIL_USER,
        subject: 'Reset Your Password',
        html: `<p>Click to reset your password:</p><a href="${resetLink}">${resetLink}</a>`
      });
  
      res.send('Reset link sent to your email.');
    } catch (err) {
      console.error(err);
      res.render('bodyshop/forgot-password', { error: 'Something went wrong.' });
    }
  });
  
  // === GET: Show Password Reset Request Page ===
router.get('/password-reset', (req, res) => {
    res.render('bodyshop/password-reset', { error: null });
});

// === POST: Send Password Reset Link ===
router.post('/password-reset', async (req, res) => {
    const { email } = req.body;

    try {
        const bodyshop = await Bodyshop.findOne({ where: { email } });

        if (!bodyshop) {
            return res.render('bodyshop/password-reset', { error: 'No account found with that email.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        bodyshop.resetToken = token;
        bodyshop.resetTokenExpiry = Date.now() + 3600000; // 1 hour
        await bodyshop.save();

        const resetLink = `http://${req.headers.host}/bodyshop/reset-password/${token}`;

        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            to: email,
            from: process.env.EMAIL_USER,
            subject: 'Reset Your Bodyshop Password',
            html: `
                <p>To reset your password, click the link below:</p>
                <a href="${resetLink}">${resetLink}</a>
                <p>This link will expire in 1 hour.</p>
            `
        });

        res.render('bodyshop/password-reset', { error: 'Reset link sent. Please check your inbox.' });
    } catch (err) {
        console.error(err);
        res.render('bodyshop/password-reset', { error: 'Something went wrong.' });
    }
});

// === GET: Password Reset Form ===
router.get('/reset-password/:token', async (req, res) => {
    const bodyshop = await Bodyshop.findOne({
        where: {
            resetToken: req.params.token,
            resetTokenExpiry: { [Op.gt]: Date.now() }
        }
    });

    if (!bodyshop) return res.send('Reset link expired or invalid.');

    res.render('bodyshop/reset-password', { token: req.params.token, error: null });
});

// === POST: Submit New Password ===
router.post('/reset-password/:token', async (req, res) => {
    const { password, confirmPassword } = req.body;

    try {
        const bodyshop = await Bodyshop.findOne({
            where: {
                resetToken: req.params.token,
                resetTokenExpiry: { [Op.gt]: Date.now() }
            }
        });

        if (!bodyshop) return res.send('Token expired or invalid.');

        if (password !== confirmPassword) {
            return res.render('bodyshop/reset-password', { token: req.params.token, error: 'Passwords do not match.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        bodyshop.password = hashedPassword;
        bodyshop.resetToken = null;
        bodyshop.resetTokenExpiry = null;
        await bodyshop.save();

        res.send('✅ Password updated. You can now log in.');
    } catch (err) {
        console.error(err);
        res.send('❌ Error resetting password.');
    }
});

export default router;