const express = require('express');
const router = express.Router(); //



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

//  Reusable footer data
const footerData = {
        content: '&copy; 2025 MC Quote'
};

router.get('/', (req, res) => {
    try {
        const pageData = {
            title: 'MC Quote - Bodyshop',
            headerData: headerData,
            mainContent: 'Welcome to the MC Quote website!',
            sidebarContent: 'This is the sidebar on the bodyshop page.',
            content1: 'Bodyshop Content 1',
            content2: 'Bodyshop Content 2',
            content3: 'Bodyshop Content 3',
            footerData: footerData
        };
        res.render('bodyshop', pageData);
    } catch (error) {
        next(error); // Pass error to the error-handling middleware in app.js
    }
});

//  Add other routes here (router.get, router.post, etc.)

module.exports = router; // <-- Export the router instance