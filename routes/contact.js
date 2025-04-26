const express = require('express');
const router = express.Router(); // 
const bodyParser = require('body-parser');

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

router.get('/', (req, res, next) => {
    try{
    const pageData = {
        title: 'MC Quote - Contact',
         headerData: headerData,
        mainContent: 'Contact us here.',
        sidebarContent: 'This is the sidebar for the contact page',
        content1: 'Contact Content 1',
        content2: 'Contact Content 2',
        content3: 'Contact Content 3',
        footerData: footerData
    };
    res.render('contact', pageData);
    } catch(error){
        next(error);
    }
});

router.post('/', (req, res, next) => {
    try {
        console.log('Contact form submitted:', req.body);
       
        res.redirect('/');
    } catch (error) {
        next(error);
    }
});

module.exports = router;