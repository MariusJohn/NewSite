import express from 'express';
import session from 'express-session';
import path from 'path';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { sequelize } from './models/index.js';

import customerRoutes from './routes/customer.js';
import adminRoutes from './routes/admin.js';
import indexRoutes from './routes/index.js';
import servicesRoutes from './routes/services.js';
import bodyshopRoutes from './routes/bodyshop.js';
import contactRoutes from './routes/contact.js';
import publicJobsRoutes from './routes/public-jobs.js';

import adminJobsRoutes from './routes/admin-jobs.js';
import adminBodyshopRoutes from './routes/admin-bodyshops.js';
import adminAuth from './middleware/adminAuth.js';

import staticRoutes from './routes/static.js';
import emailPreviewRoutes from './routes/email-preview.js';
import paymentRoutes from './routes/payment.js';

import { runSchedulerNow } from './scheduler.js';


import idleTimeout from './middleware/idleTimeout.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// ======= DEBUG ENV =======
console.log('DEBUG ENV:', process.env.NODE_ENV);

// ======= MIDDLEWARE =======
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'SESSION_KEY',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    name: 'admin.sid',
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
   
    maxAge: 15 * 60 * 1000 // 15 minutes
  }
}));


// Idle timeout
//  app.use(idleTimeout);

// ======= STATIC & VIEW SETUP =======
app.use(express.static(path.join(process.cwd(), 'public')));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set('views', path.join(process.cwd(), 'views'));
app.set('view engine', 'ejs');

// ======= ROUTES =======
app.use('/admin', adminRoutes);
app.use('/jobs/admin', adminAuth, adminJobsRoutes);
app.use('/jobs/admin/bodyshops', adminAuth, adminBodyshopRoutes);


app.use('/jobs', publicJobsRoutes);
app.use('/', indexRoutes);
app.use('/services', servicesRoutes);
app.use('/bodyshop', bodyshopRoutes);
app.use('/contact', contactRoutes);
app.use('/', customerRoutes);
app.use('/', staticRoutes);
app.use('/payment', paymentRoutes);

if (process.env.NODE_ENV !== 'production') {
  app.use('/preview', emailPreviewRoutes);
}

// ======= SESSION TEST =======
app.get('/session-test', (req, res) => {
  console.log('🧪 Session test:', req.session);
  res.send(`isAdmin: ${req.session.isAdmin || 'NOT SET'}`);
});

// ======= ERROR HANDLER =======
app.use((err, req, res, next) => {
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
        process.exit(1);  // Exit if binding fails
      } else {
        console.log(`✅ Server running on port ${port}`);
      }
    });
  })
  .catch(err => {
    console.error('❌ Failed to sync database:', err);
    process.exit(1);  // Exit if DB sync fails
  });

  


// ======= SCHEDULER =======
cron.schedule('0 * * * *', runSchedulerNow);

console.log('🚨 End of file reached');
