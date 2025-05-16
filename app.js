const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const session = require('express-session');
const customerRoutes = require('./routes/customer');
const adminRoutes = require('./routes/admin');
const adminAuth = require('./middleware/adminAuth');
const AWS= require ('aws-sdk');

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});
const s3BucketName = process.env.S3_BUCKET_NAME;

const redis = require('redis');
const { createClient } = redis; // Import createClient
const connectRedis = require('connect-redis');// Correct import

const Redis = require('ioredis');

const redis = new Redis.Cluster([
  { host: 'my-app-redis-001.my-app-redis.tpqboa.eun1.cache.amazonaws.com:6379', port: 6379 },
  { host: 'my-app-redis-002.my-app-redis.tpqboa.eun1.cache.amazonaws.com:6379', port: 6379 },
  
]);

redis.on('connect', () => console.log('Connected to Redis Cluster'));
redis.on('error', (err) => console.error('Redis Cluster Error:', err));


const fileUpload = require('express-fileupload');
app.use(fileUpload());

require('./scheduler');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// === Redis Setup ===
const redisClient = redis.createClient({
    url: process.env.REDIS_URL,
});

redisClient.on('error', err => { // Add error handling for the Redis client
    console.error('Redis Client Error:', err);
});

// Session Configuration (AFTER Redis Client is Ready)
let RedisStore = connectRedis(session); // <--- Change: Call connectRedis immediately
app.use(session({
    store: new RedisStore({  //  <---  Use the result
        client: redisClient,
        ttl: 86400,
    }),
    secret: process.env.SESSION_SECRET || 'SESSION_KEY',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    },
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

app.get('/image/:s3Key', async (req, res) => {
    const { s3Key } = req.params;

    try {
        const imageMetadata = await redis.get(s3Key);
        if (!imageMetadata) {
            return res.status(404).send('Image not found.');
        }
        const { s3Url } = JSON.parse(imageMetadata);
        res.redirect(s3Url); 
        
    } catch (error) {
        res.status(500).send('Error retrieving image URL.');
    }
});


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

// Start the server
app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${port}`);
});