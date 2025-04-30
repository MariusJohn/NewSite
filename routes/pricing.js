const express = require('express');
const router = express.Router();

// Common header and footer data
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


router.get('/', (req, res, next) => {
    try {
        const pageData = {
            title: 'MC Quote - Pricing',
            headerData: headerData,
            mainContent: 'View our competitive pricing options.',
            sidebarContent: 'This is the sidebar on the pricing page.',
            content1: 'Pricing Content 1',
            content2: 'Pricing Content 2',
            content3: 'Pricing Content 3',
            footerData: footerData
        };
        res.render('pricing', pageData);   
    } catch (error) {
        next(error);
    }
});

module.exports = router;
