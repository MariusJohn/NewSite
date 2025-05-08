// routes/bodyshop.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { Op } = require('sequelize');
const { Job, Quote, Bodyshop } = require('../models');
const { requireBodyshopLogin } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

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

// === GET Registration Page ===
router.get('/register', (req, res) => {
    res.render('bodyshop-register', { error: null });
});

// === POST Registration Handler with Password Validation ===
router.post('/register', async (req, res) => {
    const { name, email, password, confirmPassword, area } = req.body;

    // Password strength check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    const postcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i;

    if (!passwordRegex.test(password)) {
        return res.render('bodyshop-register', { error: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.' });
    }

    if (!postcodeRegex.test(area)) {
        return res.render('bodyshop-register', { error: 'Please enter a valid UK postcode.' });
    }

    if (password !== confirmPassword) {
        return res.render('bodyshop-register', { error: 'Passwords do not match.' });
    }

    try {
        const existing = await Bodyshop.findOne({ where: { email } });
        if (existing) {
            return res.render('bodyshop-register', { error: 'This email is already registered.' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const verificationToken = require('crypto').randomBytes(32).toString('hex');

        await Bodyshop.create({ name, email, password: hashed, area, verificationToken });

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

        const verificationUrl = `http://${req.headers.host}/bodyshop/verify/${verificationToken}`;
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify Your Bodyshop Account',
            html: `
            <div>
                <h2>Welcome to MC Quote</h2>
                <p>Thank you for registering your bodyshop. Please verify your email by clicking the link below:</p>
                <a href="${verificationUrl}" style="background-color:#25D366;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Verify Email</a>
                <p>If you did not register, please ignore this email.</p>
            </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Verification email sent to ${email}`);

        res.render('bodyshop-register', { error: 'Registration successful! Please check your email to verify your account.' });
    } catch (err) {
        console.error(err);
        res.render('bodyshop-register', { error: 'Registration failed. Try again later.' });
    }
});


// === GET: Verify Bodyshop Email ===
router.get('/verify/:token', async (req, res) => {
    try {
        const token = req.params.token;
        const bodyshop = await Bodyshop.findOne({ where: { verificationToken: token } });

        if (!bodyshop) {
            return res.status(400).send('Invalid or expired verification token.');
        }

        // Mark as verified
        bodyshop.verified = true;
        bodyshop.verificationToken = null;
        await bodyshop.save();

        res.send('✅ Your email has been successfully verified. You can now log in.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error. Please try again later.');
    }
});

// === GET: Bodyshop Login Page ===
router.get('/login', (req, res) => {
    res.render('bodyshop-login');
});

// === POST: Handle Bodyshop Login ===
router.post('/login', async (req, res) => {
    const { email, password,area } = req.body;
    

    if (!email || !password || !area) {
        return res.status(400).send('Email, password and postcode are required');
    }
    const postcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i;
    if (!postcodeRegex.test(area)) {
        return res.status(400).send('Invalid postcode format');
    }

    try {
        const bodyshop = await Bodyshop.findOne({ where: { email } });

        if (!bodyshop || !bodyshop.verified) {
            return res.status(401).send('Invalid credentials or account not verified');
        }

        const valid = await bcrypt.compare(password, bodyshop.password);
        if (!valid || bodyshop.area !== area.toUpperCase()) {
            return res.status(401).render('bodyshop-login-error', {
                error: 'Invalid credentials. Please check your email, password, and postcode.'
            });
        }

        req.session.bodyshopId = bodyshop.id;
        req.session.bodyshopName = bodyshop.name;
        req.session.bodyshopArea = bodyshop.area;

        res.redirect('/bodyshop/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// === GET: Password Reset Request Page ===
router.get('/password-reset', (req, res) => {
    res.render('bodyshop-password-reset', { error: null });
});

// === POST: Send Password Reset Email ===
router.post('/password-reset', async (req, res) => {
    const { email } = req.body;

    try {
        const bodyshop = await Bodyshop.findOne({ where: { email } });
        if (!bodyshop) {
            return res.render('bodyshop-password-reset', { error: 'No account found with this email.' });
        }

        // Generate reset token
        const resetToken = require('crypto').randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        bodyshop.resetToken = resetToken;
        bodyshop.resetTokenExpiry = resetTokenExpiry;
        await bodyshop.save();

        // Send reset email
        const transporter = nodemailer.createTransport({
            host: 'smtp.ionos.co.uk',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const resetUrl = `http://${req.headers.host}/bodyshop/reset-password/${resetToken}`;
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            html: `
            <div>
                <h2>Password Reset Request</h2>
                <p>We received a request to reset your password. Click the link below to reset it:</p>
                <a href="${resetUrl}" style="background-color:#25D366;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Reset Password</a>
                <p>This link will expire in 1 hour. If you did not request a password reset, you can ignore this email.</p>
            </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Password reset email sent to ${email}`);

        res.render('bodyshop-password-reset', { error: 'Password reset link sent to your email.' });
    } catch (err) {
        console.error(err);
        res.render('bodyshop-password-reset', { error: 'Failed to send reset email. Try again later.' });
    }
});


// === GET: Reset Password Page ===
router.get('/reset-password/:token', async (req, res) => {
    const { token } = req.params;

    try {
        const bodyshop = await Bodyshop.findOne({
            where: {
                resetToken: token,
                resetTokenExpiry: { [Op.gt]: new Date() }
            }
        });

        if (!bodyshop) {
            return res.send('Invalid or expired reset link.');
        }

        res.render('bodyshop-reset-password', { error: null, token });
    } catch (err) {
        console.error(err);
        res.send('Server error. Please try again later.');
    }
});

// === POST: Update Password with Validation ===
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // Password strength check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.render('bodyshop-reset-password', { error: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.', token });
    }

    if (password !== confirmPassword) {
        return res.render('bodyshop-reset-password', { error: 'Passwords do not match.', token });
    }

    try {
        const bodyshop = await Bodyshop.findOne({
            where: {
                resetToken: token,
                resetTokenExpiry: { [Op.gt]: new Date() }
            }
        });

        if (!bodyshop) {
            return res.send('Invalid or expired reset link.');
        }

        // Update the password
        const hashedPassword = await bcrypt.hash(password, 10);
        bodyshop.password = hashedPassword;
        bodyshop.resetToken = null;
        bodyshop.resetTokenExpiry = null;
        bodyshop.verified = true;
        await bodyshop.save();

        res.send('✅ Your password has been updated. You can now log in.');
    } catch (err) {
        console.error(err);
        res.send('Server error. Please try again later.');
    }
});


// === Bodyshop Dashboard (View Available Jobs) ===
router.get('/dashboard', requireBodyshopLogin, async (req, res) => {
    console.log('Bodyshop area from session:', req.session.bodyshopArea);

    try {
        const bodyshopArea = req.session.bodyshopArea;

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
router.post('/quote/:jobId', requireBodyshopLogin, async (req, res) => {
    try {
        const { quoteAmount } = req.body;
        const { jobId } = req.params;
        const bodyshopName = req.session.bodyshopName;

        const existing = await Quote.findOne({ where: { jobId, bodyshopName } });
        if (existing) {
            return res.status(400).send('You have already submitted a quote for this job.');
        }

        await Quote.create({ jobId, bodyshopName, price: quoteAmount });

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

        await job.update({ paid: true });

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


