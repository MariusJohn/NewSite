// app.js
import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import session from 'express-session';

import customerRoutes from './routes/customer.js';
import adminRoutes from './routes/admin.js';
import adminAuth from './middleware/adminAuth.js';
//import fileUpload from 'express-fileupload';
//import uploadsRoutes from './routes/uploads.js';
import indexRoutes from './routes/index.js';
import quotationsRoutes from './routes/quotations.js';
import bodyshopRoutes from './routes/bodyshop.js';
import trainingRoutes from './routes/training.js';
import pricingRoutes from './routes/pricing.js';
import contactRoutes from './routes/contact.js';
import privacyRoutes from './routes/privacy.js';
import jobsRoutes from './routes/jobs.js';
import adminBodyshopRoutes from './routes/admin-bodyshops.js';
import './scheduler.js'; 

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;


// For serving static files relative to the project root
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

// === Session Setup (No Redis) ===
app.use(session({
    secret: process.env.SESSION_SECRET || 'SESSION_KEY',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',  
        maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
    }
}));

// Serve static files
app.use(express.static(path.join(process.cwd(), 'public')));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Set view engine
app.set('views', path.join(process.cwd(), 'views'));
app.set('view engine', 'ejs');

// Logging middleware
app.use((req, res, next) => {
    console.log(`➡️ Incoming request: ${req.method} ${req.url}`);
    next();
});



// Mount routes
app.use('/', indexRoutes);
app.use('/quotations', quotationsRoutes);
app.use('/bodyshop', bodyshopRoutes);
app.use('/training', trainingRoutes);
app.use('/pricing', pricingRoutes);
app.use('/contact', contactRoutes);
app.use('/privacy', privacyRoutes);
app.use('/jobs', jobsRoutes);
app.use('/', customerRoutes);
app.use('/admin', adminRoutes);
app.use('/jobs/admin', adminAuth);
app.use('/jobs/admin', adminBodyshopRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Internal Server Error');
});

// Start the server
app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
});