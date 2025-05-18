import express from 'express';
const router = express.Router();


const headerData = {
    logoPath: '/public/img/logo.png',  
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
            title: 'MC Quote - Home',
            headerData: headerData,
            mainContent: 'Welcome to the MC Quote website!',
            sidebarContent: 'This is the sidebar on the home page.',
            content1: 'Home Content 1',
            content2: 'Home Content 2',
            content3: 'Home Content 3',
            footerData: footerData,
            logoPath: headerData.logo  
        };
        res.render('index', pageData);
    } catch (error) {
        next(error);
    }
});

export default router;