// app.mjs
import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import session from 'express-session';

import { sequelize } from './models/index.js';

import customerRoutes from './routes/customer.js';
import adminRoutes from './routes/admin.js';
import adminAuth from './middleware/adminAuth.js';
import indexRoutes from './routes/index.js';
import quotationsRoutes from './routes/quotations.js';
import bodyshopRoutes from './routes/bodyshop.js';
import contactRoutes from './routes/contact.js';

import publicJobsRoutes from './routes/public-jobs.js';
import adminJobsRoutes from './routes/admin-jobs.js';



import adminBodyshopRoutes from './routes/admin-bodyshops.js';
import staticRoutes from './routes/static.js';
import emailPreviewRoutes from './routes/email-preview.js';
import paymentRoutes from './routes/payment.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

app.use(session({
    secret: process.env.SESSION_SECRET || 'SESSION_KEY',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
}));

app.use(express.static(path.join(process.cwd(), 'public')));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set('views', path.join(process.cwd(), 'views'));
app.set('view engine', 'ejs');

app.use((req, res, next) => {
    next();
});

// Mount routes
app.use('/admin', adminRoutes);

//Admin routes 
app.use('/jobs/admin', adminAuth, adminJobsRoutes);




// Apply adminAuth to adminBodyshopRoutes if it has specific routes under /jobs/admin/bodyshops
app.use('/jobs/admin/bodyshops', adminAuth, adminBodyshopRoutes);

app.use('/', indexRoutes);
app.use('/quotations', quotationsRoutes);
app.use('/bodyshop', bodyshopRoutes);
app.use('/contact', contactRoutes);

// General /jobs routes for public facing or non-admin actions
app.use('/jobs', publicJobsRoutes);

app.use('/', customerRoutes);
app.use('/', staticRoutes);
app.use('/payment', paymentRoutes);

if (process.env.NODE_ENV !== 'production') {
    app.use('/preview', emailPreviewRoutes);
}

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Internal Server Error');
});

sequelize.sync()
    .then(() => {
        app.listen(port, () => {
            console.log(`✅ Server running on port ${port}`);
        });
    })
    .catch(err => {
        console.error('❌ Failed to sync database or start server:', err);
    });