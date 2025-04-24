const express = require('express');
const router = express.Router(); // ✅ Correct

//  Import header/footer data if it's in a separate file
const headerData = {  //  Move this to a separate file if used in multiple routes
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
    content: '&copy; 2024 MC Quote'
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