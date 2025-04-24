const express = require('express');
const router = express.Router();

// Reusable header data
const headerData = {
    logoPath: '/public/img/logo.png',  // Ensure this is correctly pointing to your logo path
    navLinks: [
        { url: '/', text: 'Home' },
        { url: '/quotations', text: 'Private Quotations' },
        { url: '/bodyshop', text: 'Bodyshop Support' },
        { url: '/training', text: 'Training' },
        { url: '/contact', text: 'Contact' }
    ]
};

// Reusable footer data
const footerData = {
    content: '&copy; 2024 MC Quote'
};

router.get('/', (req, res, next) => {
    try {
        const pageData = {
            title: 'MC Quote - Home',
            headerData: headerData,
            mainContent: 'Welcome to the MC Quote website!',
            sidebarContent: 'This is the sidebar on the home page.',
            content1: 'Home Content 1',
            content2: 'Home Content 2',
            content3: 'Home Content 3',
            footerData: footerData,
            logoPath: headerData.logo  // Add logoPath to pageData
        };
        res.render('index', pageData);
    } catch (error) {
        next(error); // Pass error to the error-handling middleware
    }
});

module.exports = router;