//app.js
import express from 'express';
import session from 'express-session';
import flash from 'connect-flash';
import helmet from 'helmet';
import path from 'path';
import { Pool } from 'pg'; 
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cron from 'node-cron';
import csurf from 'csurf';
import connectPgSimple from 'connect-pg-simple'; 
import { sequelize as db } from './models/index.js';
import publicJobsRoutes from './routes/public-jobs.js';
import customerRoutes from './routes/customer.js';
import adminRoutes from './routes/admin.js';
import indexRoutes from './routes/index.js';
import servicesRoutes from './routes/services.js';

import bodyshopRoutes from './routes/bodyshop.js';
import bodyshopSubscriptionRoutes from './routes/bodyshop-subscription.js';
import webhookRoutes from './routes/webhook.js';
import contactRoutes from './routes/contact.js';
import uploadsRoutes from './routes/uploads.js'; 

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
const _dirname = path.resolve();
const port = process.env.PORT || 3000;

const sessionDbPool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

sessionDbPool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client for session DB Pool', err.stack);
  }
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) {
      return console.error('Error executing test query for session DB Pool', err.stack);
    }
    console.log('Session DB Pool connected successfully');
  });
});


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.google.com", "https://www.gstatic.com", "https://cdn.jsdelivr.net"],
      frameSrc: ["'self'", "https://www.google.com"],
      imgSrc: ["'self'", "data:", process.env.AWS_BUCKET_URL ? `https://${process.env.AWS_BUCKET_URL}` : '*'],
      connectSrc: ["'self'", "https://www.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      formAction: ["'self'", "https://mcquote.co.uk", "https://checkout.stripe.com"]

    },
  },
}));

const PgSession = connectPgSimple(session);
const sessionStore = new PgSession({
  pool: sessionDbPool, 
  tableName: 'session',
  createTableIfMissing: true,
});

app.use(session({
  name: 'admin.sid', 
  store: sessionStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000
  }
}));

app.use(flash()); 

const csrfProtection = csurf({ cookie: true });


app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken ? req.csrfToken() : null;
  next();
});

if (process.env.NODE_ENV !== 'production') {
  app.use('/dev', devRoutes);
}

app.use(express.static(path.join(process.cwd(), 'public')));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/webhook', webhookRoutes);

app.set('views', path.join(process.cwd(), 'views'));
app.set('view engine', 'ejs');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please try again later.'
});

app.use('/admin', adminRoutes);
app.use('/jobs/admin', adminAuth, adminJobsRoutes);
app.use('/jobs/admin/bodyshops', adminAuth, adminBodyshopRoutes);

app.use('/jobs', uploadsRoutes); 
app.use('/jobs', publicJobsRoutes);
app.use('/', indexRoutes);
app.use('/services', servicesRoutes);
app.use('/bodyshop', bodyshopRoutes);
app.use('/bodyshop', bodyshopSubscriptionRoutes);
app.use('/contact', contactRoutes);
app.use('/', customerRoutes);
app.use('/', staticRoutes);
app.use('/payment', paymentRoutes);

if (process.env.NODE_ENV === 'development') {
  console.log('📩 Email preview routes ENABLED');
  app.use('/email', emailPreviewRoutes);
}

app.get('/session-test', (req, res) => {
  console.log('Session test:', req.session);
  res.send(`isAdmin: ${req.session.isAdmin || 'NOT SET'}`);
});

app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    console.error('CSRF token validation failed:', err.stack);
    return res.status(403).render('error', {
      title: 'Security Error',
      message: 'Invalid security token. Please try submitting the form again.'
    });
  }
  console.error('Unhandled Error:', err.stack);
  res.status(500).render('error', {
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again later.'
  });
});

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing in .env file');
}

db.sync()
  .then(() => {
    console.log('✅ Database synced');

    app.listen(port, '0.0.0.0', () => {
      console.log(`✅ Server running on http://localhost:${port}`);
    });

    // Keep the app alive even if nothing is pending
    setInterval(() => {}, 1000); // Keeps Node alive for debugging
  })
  .catch(err => {
    console.error('❌ Failed to sync database:', err);
    process.exit(1);
  });


cron.schedule('0 * * * *', runSchedulerNow);

console.log('End of file reached');
