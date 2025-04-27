const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

const headerData = {
    logo: '/public/img/logo.png',
    navLinks: [
        { url: '/', text: 'Home' },
        { url: '/quotations', text: 'Private Quotations' },
        { url: '/bodyshop', text: 'Bodyshop Support' },
        { url: '/training', text: 'Training' },
        { url: '/contact', text: 'Contact' }
    ]
};

const footerData = {
    content: '&copy; 2025 MC Quote'
};

// GET /contact page
router.get('/', (req, res, next) => {
    try {
        const pageData = {
            title: 'MC Quote - Contact',
            headerData,
            mainContent: 'Contact us here.',
            sidebarContent: 'This is the sidebar for the contact page',
            content1: 'Contact Content 1',
            content2: 'Contact Content 2',
            content3: 'Contact Content 3',
            footerData
        };
        res.render('contact', pageData);
    } catch (error) {
        next(error);
    }
});

// POST /contact (handle form submission)
router.post('/', (req, res, next) => {
    const { name, email, subject, message } = req.body;

    // 1. Log the request body to see what data is being sent.
    console.log('Request Body:', req.body);

    // 2.  Check if email is defined.
    if (!email) {
        console.error('email is undefined or empty');
        return res.status(400).send('Email address is required'); // More specific message
    }

    // 3. Basic email validation (improved regex)
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
        console.error('Invalid email address:', email);
        return res.status(400).send('Invalid email address format');
    }

    // create transporter inside the POST handler to access process.env
    const transporter = nodemailer.createTransport({
        host: 'smtp.ionos.co.uk',
        port: 587,
        secure: false, // Use TLS on port 587
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER, // Use a default
        replyTo: email,
        to: 'office@mcquote.co.uk', // your receiving email
        subject: subject || 'No Subject', // Provide a default
        text: `New contact form submission:

Name: ${name || 'No Name'}
Email: ${email}
Subject: ${subject || 'No Subject'}

Message:
${message || 'No Message'}`, // Provide a default
    };

    transporter.sendMail(mailOptions)
        .then(() => {
            console.log('Email sent successfully');
            res.redirect('/contact?sent=true');
        })
        .catch((error) => {
            console.error('Error sending email:', error);
            next(error); // Pass the error to the next middleware
        });
});

module.exports = router;
