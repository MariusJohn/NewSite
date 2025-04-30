const express = require('express');
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

router.get('/', (req, res, next) => {
    try {
        const pageData = {
            title: 'MC Quote - Training',
            headerData: headerData,
            mainContent: 'Get your training here.',
            sidebarContent: 'This is the sidebar on the training page.',
            content1: 'Training Content 1',
            content2: 'Training Content 2',
            content3: 'Training Content 3',
            footerData: footerData
        };
        res.render('training', pageData);
    } catch (error) {
        next(error);
    }
});

module.exports = router;