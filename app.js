// app.js
import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import session from 'express-session';
import customerRoutes from './routes/customer.js';
import adminRoutes from './routes/admin.js';
import adminAuth from './middleware/adminAuth.js';
import indexRoutes from './routes/index.js';
import quotationsRoutes from './routes/quotations.js';
import bodyshopRoutes from './routes/bodyshop.js';
import contactRoutes from './routes/contact.js';
import jobsRoutes from './routes/jobs.js';
import adminBodyshopRoutes from './routes/admin-bodyshops.js';
import staticRoutes from './routes/static.js';
import emailPreviewRoutes from './routes/email-preview.js';//temp route for testing
import paymentRoutes from './routes/payment.js';

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
     next();
});



// Mount routes
// Protected admin routes
app.use('/admin',  adminRoutes);
app.use('/jobs/admin', adminAuth, adminBodyshopRoutes);

// Public routes
app.use('/', indexRoutes);
app.use('/quotations', quotationsRoutes);
app.use('/bodyshop', bodyshopRoutes);
app.use('/contact', contactRoutes);
app.use('/jobs', jobsRoutes);
app.use('/', customerRoutes);
app.use('/', staticRoutes);
app.use('/payment', paymentRoutes);

// Development-only routes
if (process.env.NODE_ENV !== 'production') {
  app.use('/preview', emailPreviewRoutes);
}


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Internal Server Error');
});

// Start the server
app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
});