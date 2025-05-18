import express from 'express';
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

router.get('/', (req, res) => {
    res.render('privacy', {
        title: 'Privacy Policy',
        headerData,
        footerData
    });
});

export default router;
