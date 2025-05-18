// routes/bodyshop.js
import express from 'express';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import axios from 'axios';
import crypto from 'crypto';
import { Job, Quote, Bodyshop, sequelize } from '../models/index.js';
import { requireBodyshopLogin } from '../middleware/auth.js';

dotenv.config();

const router = express.Router();

const headerData = {
    logo: '/public/img/logo.png',
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

        // Fetching coordinates from OpenCage API
        const apiKey = process.env.OPENCAGE_API_KEY;
        const response = await axios.get(`https://api.opencagedata.com/geocode/v1/json`, {
            params: {
                q: area,
                key: apiKey,
                countrycode: 'gb',
                limit: 1
            }
        });

        if (!response.data || !response.data.results || response.data.results.length === 0) {
            return res.render('bodyshop-register', { error: 'Unable to find coordinates for the given postcode.' });
        }

        const { lat, lng } = response.data.results[0].geometry;

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create the bodyshop
        await Bodyshop.create({
            name,
            email,
            password: hashedPassword,
            area,
            latitude: lat,
            longitude: lng,
            verificationToken
        });

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

// === GET: Bodyshop Logout ===
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/bodyshop/login');
    });
});

export default router;