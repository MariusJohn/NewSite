const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const session = require('express-session');
const customerRoutes = require('./routes/customer');
const adminRoutes = require('./routes/admin');
const adminAuth = require('./middleware/adminAuth');

require('./scheduler');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;



app.use(session({
    secret: 'SESSION_KEY', 
    resave: false,
    saveUninitialized: false
  }));


// Import routes
const indexRoutes = require('./routes/index'); // <--- Import the router objects
const quotationsRoutes = require('./routes/quotations');
const bodyshopRoutes = require('./routes/bodyshop');
const trainingRoutes = require('./routes/training');
const pricingRoutes = require('./routes/pricing');
const contactRoutes = require('./routes/contact');
const privacyRoutes = require('./routes/privacy')
const jobsRoutes = require('./routes/jobs');
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const adminBodyshopRoutes = require('./routes/admin-bodyshops');


// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Set view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Mount routes
app.use('/', indexRoutes); // Use index routes for / path
app.use('/quotations', quotationsRoutes);
app.use('/bodyshop', bodyshopRoutes);
app.use('/training', trainingRoutes);
app.use('/pricing', pricingRoutes);
app.use('/contact', contactRoutes);
app.use('/privacy', privacyRoutes)
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

app.listen(port,'0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});
