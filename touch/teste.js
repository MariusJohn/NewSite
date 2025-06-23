// routes/uploads.js
import express from 'express';
import { geocodeAddress } from '../utils/geocode.js';
import { sendFinalEmails } from '../controllers/emailController.js'; // Ensure correct function for your email logic
import multer from 'multer'; // Make sure multer is imported
import csurf from 'csurf'; // <--- IMPORTANT: Import csurf here if you removed global csrfProtection

const router = express.Router();

// Define csrfProtection locally IF you removed app.use(csrfProtection) from app.js
const csrfProtection = csurf({ cookie: true }); // <--- Add this line here

// Configure multer storage (your existing config)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Your existing GET route for rendering the upload form (if it's in this file)
// Make sure this GET route still has access to req.csrfToken()
// If you removed `app.use(csrfProtection)` from `app.js`, and this GET route is here,
// you might need to apply `csrfProtection` here too, like:
// router.get('/upload', csrfProtection, (req, res) => {
//    res.render('jobs/upload', { csrfToken: req.csrfToken(), recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY });
// });
// Or ensure your global `app.use((req, res, next) => { res.locals.csrfToken = req.csrfToken ? req.csrfToken() : null; next(); });`
// is sufficient for passing the token to your EJS template.

// The POST route with corrected middleware order
router.post(
  '/upload',
  jobUploadLimiter,
  verifyRecaptcha,
  upload.array('images', 8), // Multer runs FIRST, parses req.body (including _csrf)
  csrfProtection,             // <--- csurf runs NOW, after multer has populated req.body
  async (req, res) => {
    // For debugging, you can add this line to see the token
    console.log('CSRF Token from req.body (after multer):', req.body._csrf);

    const { customerName, email, phone, postcode, description } = req.body;

    try {
      const phoneRegex = /^07\d{9}$/;
      if (!phoneRegex.test(phone)) {
          return res.status(400).render('jobs/upload-error', {
              title: 'Invalid telephone number',
              message: 'Please enter a valid UK phone number (07...).'
          });
      }

      const bodyshopMatch = await Bodyshop.findOne({
          where: {
              email: email.trim(),
              postcode: postcode.trim(),
          }
      });
      if (bodyshopMatch) {
        return res.status(403).render('jobs/upload-error', {
            title: 'Access Restricted',
            message: 'This email and postcode are already registered to a bodyshop. Please log in through the bodyshop portal.',
        });
      }

      let geoData;
      try {
          geoData = await geocodeAddress(postcode);
      } catch (geoError) {
          console.error('❌ Geocoding error in uploads.js:', geoError.message);
          return res.status(500).render('jobs/upload-error', {
              title: 'Location Error',
              message: 'Failed to process location. Please try again later.'
          });
      }

      if (!geoData) {
          return res.status(400).render('jobs/upload-error', {
              title: 'Location Error',
              message: 'Unable to find a precise location for the given postcode. Please try a more specific address.'
          });
      }

      const { lat, lng } = geoData;

      const uploadedS3Urls = [];
      for (const file of req.files || []) {
        if (!file.buffer?.length) continue;

        let processedBuffer;
        try {
            if (file.mimetype === 'image/heic') {
                processedBuffer = await sharp(file.buffer).toFormat('jpeg').jpeg({ quality: 80 }).toBuffer();
            } else {
                processedBuffer = await sharp(file.buffer)
                    .resize({ width: 1600, withoutEnlargement: true })
                    .jpeg({ quality: 60, mozjpeg: true, progressive: true })
                    .toBuffer();
            }
        } catch (imgErr) {
            console.error('❌ Image processing error:', imgErr);
            return res.status(400).render('jobs/upload-error', {
                title: 'Image Processing Error',
                message: 'Failed to process an image. Please try again with valid image files.',
            });
        }

        const s3Key = `job-images/${crypto.randomUUID()}.jpg`;
        await s3Client.send(new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: s3Key,
          Body: processedBuffer,
          ContentType: 'image/jpeg',
          Metadata: {
            uploadedBy: 'customer-upload',
            originalFilename: file.originalname,
          },
          CacheControl: 'max-age=31536000',
        }));
        uploadedS3Urls.push(`https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`);
      }

      const newJob = await db.Job.create({ // Ensure Job is accessed via db.Job
        customerName: customerName.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        location: postcode.trim(),
        description: description.trim(),
        latitude: lat,
        longitude: lng,
        images: uploadedS3Urls,
        status: 'pending',
        paid: false,
        extendToken: crypto.randomBytes(32).toString('hex'),
        cancelToken: crypto.randomBytes(32).toString('hex'),
        extendTokenUsed: false,
        cancelTokenUsed: false
      });

      console.log('✅ Job created:', newJob.id);

      // IMPORTANT: Revisit your email sending logic here.
      // `sendFinalEmails` takes `job` and `quote`. If this is just job submission,
      // you might need a different email function that takes only `job`.
      // If it's truly final, you shouldn't call it here.
      // For now, commenting out to avoid issues if args are wrong:
      // await sendFinalEmails(newJob, null);

      res.render('jobs/upload-success');
    } catch (err) {
      console.error('❌ Job upload failed:', err);
      let errorMessage = 'Something went wrong. Please try again later.';
      let errorTitle = 'Upload Error';

      if (err instanceof multer.MulterError) {
        errorMessage = `File upload error: ${err.message}`;
      } else if (err.message.includes('Only .jpeg, .png, and .heic files are allowed!')) {
        errorMessage = err.message;
      } else if (err.message.includes('Unable to find coordinates')) { 
        errorMessage = 'Invalid postcode. Please enter a valid UK postcode.';
        errorTitle = 'Location Error';
      }

      res.status(500).render('jobs/upload-error', {
        title: errorTitle,
        message: errorMessage,
      });
    }
  }
);


export default router;