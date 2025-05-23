import express from 'express';
const router = express.Router();
import nodemailer from 'nodemailer';
import bodyParser from 'body-parser';

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

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
        res.render('static/contact', pageData);
    } catch (error) {
        next(error);
    }
});

// POST /contact (handle form submission)
router.post('/', (req, res, next) => {
    const { name, email, subject, message, consent } = req.body;

  

    if (!consent) {
        console.error('Consent not given');
        return res.status(400).send('You must agree to the Privacy Policy.');
    }

    if (!email) {
        console.error('Email is undefined or empty');
        return res.status(400).send('Email address is required');
    }


    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
        console.error('Invalid email address:', email);
        return res.status(400).send('Invalid email address format');
    }


    const transporter = nodemailer.createTransport({
        host: 'smtp.ionos.co.uk',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER, 
        replyTo: email,
        to: 'office@mcquote.co.uk',
        subject: subject || 'No Subject', 
        text: `New contact form submission:

Name: ${name || 'No Name'}
Email: ${email}
Subject: ${subject || 'No Subject'}

Message:
${message || 'No Message'}`,
    };

    transporter.sendMail(mailOptions)
        .then(() => {
            console.log('Email sent successfully');
            res.redirect('/contact?sent=true');
        })
        .catch((error) => {
            console.error('Error sending email:', error);
            next(error); 
        });
});

export default router;