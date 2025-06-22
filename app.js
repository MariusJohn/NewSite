import express from 'express';
import session from 'express-session';
import path from 'path';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cron from 'node-cron';
import csurf from 'csurf';
import { sequelize } from './models/index.js';

import customerRoutes from './routes/customer.js';
import adminRoutes from './routes/admin.js';
import indexRoutes from './routes/index.js';
import servicesRoutes from './routes/services.js';

import bodyshopRoutes from './routes/bodyshop.js';
import bodyshopSubscriptionRoutes from './routes/bodyshop-subscription.js';
import webhookRoutes from './routes/webhook.js';
import contactRoutes from './routes/contact.js';
import publicJobsRoutes from './routes/public-jobs.js';

import adminJobsRoutes from './routes/admin-jobs.js';
import adminBodyshopRoutes from './routes/admin-bodyshops.js';
import adminAuth from './middleware/adminAuth.js';

import staticRoutes from './routes/static.js';
import emailPreviewRoutes from './routes/email-preview.js';
import paymentRoutes from './routes/payment.js';

import { runSchedulerNow } from './scheduler.js';

import devRoutes from './routes/dev.js';

import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// ======= MIDDLEWARE =======
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// CSRF Protection Middleware
const csrfProtection = csurf({ cookie: true });
app.use(csrfProtection);

// Pass CSRF Token to Views
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken ? req.csrfToken() : null;
  next();
});

// Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'SESSION_KEY',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    name: 'admin.sid',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000
  }
}));

// ======= SECURITY MIDDLEWARE =======
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// ======= DEV ROUTES =======
if (process.env.NODE_ENV !== 'production') {
  app.use('/', devRoutes);
}

// ======= STATIC & VIEW SETUP =======
app.use(express.static(path.join(process.cwd(), 'public')));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/webhook', webhookRoutes);

app.set('views', path.join(process.cwd(), 'views'));
app.set('view engine', 'ejs');

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please try again later.'
});

// ======= ROUTES =======
app.use('/admin', adminRoutes);
app.use('/jobs/admin', adminAuth, adminJobsRoutes);
app.use('/jobs/admin/bodyshops', adminAuth, adminBodyshopRoutes);

app.use('/jobs', publicJobsRoutes);
app.use('/', indexRoutes);
app.use('/services', servicesRoutes);
app.use('/bodyshop', bodyshopRoutes);
app.use('/bodyshop', bodyshopSubscriptionRoutes);
app.use('/contact', contactRoutes);
app.use('/', customerRoutes);
app.use('/', staticRoutes);
app.use('/payment', paymentRoutes);

if (process.env.NODE_ENV !== 'development') {
  app.use('/preview', emailPreviewRoutes);
}

// ======= SESSION TEST =======
app.get('/session-test', (req, res) => {
  console.log('🧪 Session test:', req.session);
  res.send(`isAdmin: ${req.session.isAdmin || 'NOT SET'}`);
});

// ======= ERROR HANDLER =======
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    console.error('CSRF token validation failed:', err);
    return res.status(403).send('Invalid CSRF token');
  }
  console.error(err);
  res.status(500).send('Internal Server Error');
});

// ======= STARTUP =======
if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL is missing in .env file');
}

sequelize.sync()
  .then(() => {
    console.log('✅ Database synced');
    app.listen(port, '0.0.0.0', (err) => {
      if (err) {
        console.error('❌ Error starting server:', err);
        process.exit(1); // Exit if binding fails
      } else {
        console.log(`✅ Server running on port ${port}`);
      }
    });
  })
  .catch(err => {
    console.error('❌ Failed to sync database:', err);
    process.exit(1); // Exit if DB sync fails
  });

// ======= SCHEDULER =======
cron.schedule('0 * * * *', runSchedulerNow);

console.log('🚨 End of file reached');