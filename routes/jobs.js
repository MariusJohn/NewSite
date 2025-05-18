// routes/jobs.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import { Job } from '../models/index.js';
import adminAuth from '../middleware/adminAuth.js';
import { fileURLToPath } from 'url';
import { Op } from 'sequelize'; // Import Sequelize Operators


dotenv.config();

const router = express.Router();

// Handle __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === AWS S3 Configuration ===
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// === Multer Storage Config (temporary location for Sharp to process) ===
const tempStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = path.join(__dirname, '..', 'uploads', 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ storage: tempStorage });

// === Helper Function for S3 Uploads ===
async function uploadToS3(filePath, fileName) {
    try {
        const compressedBuffer = await sharp(filePath)
            .resize({ width: 1920 })
            .jpeg({ quality: 75 })
            .toBuffer();

        const s3Key = `job-images/${fileName}`;
        const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: s3Key,
            Body: compressedBuffer,
            ContentType: 'image/jpeg'
        };

        await s3Client.send(new PutObjectCommand(uploadParams));
        console.log(`✅ Uploaded to S3: ${s3Key}`);
        return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
    } catch (error) {
        console.error(`❌ Error uploading to S3: ${error.message}`);
        throw error;
    }
}

// === POST Upload Form with S3 Upload ===
router.post('/upload', (req, res, next) => {
    upload.array('images', 8)(req, res, async (err) => {
        if (err) {
            console.error('❌ Multer error:', err);
            return res.status(500).render('upload-error', {
                title: 'Upload Error',
                message: 'An unexpected error occurred during file upload.'
            });
        }

        try {
            const phoneRegex = /^07\d{9}$/;
            const { name, email, location, telephone } = req.body;

            if (!phoneRegex.test(telephone)) {
                return res.status(400).render('upload-error', {
                    title: 'Invalid telephone number',
                    message: 'Please enter a valid UK phone number (07...).'
                });
            }

            // === Fetch Geolocation Data ===
            const apiKey = process.env.OPENCAGE_API_KEY;
            const geoRes = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
                params: {
                    q: location,
                    key: apiKey,
                    countrycode: 'gb',
                    limit: 1
                }
            });

            if (!geoRes.data || !geoRes.data.results || geoRes.data.results.length === 0) {
                console.error('❌ No coordinates found for:', location);
                return res.status(400).render('upload-error', {
                    title: 'Location Error',
                    message: 'Unable to find coordinates for the given postcode.'
                });
            }

            const { lat, lng } = geoRes.data.results[0].geometry;
            console.log('Latitude:', lat, 'Longitude:', lng);

            // === Process and Upload Images to S3 ===
            const uploadedFiles = [];
            for (const file of req.files) {
                const uniqueFileName = `compressed-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;

                try {
                    const fileUrl = await uploadToS3(file.path, uniqueFileName);
                    uploadedFiles.push(fileUrl);
                } catch (uploadError) {
                    console.error(`❌ Error uploading ${file.originalname}:`, uploadError);
                    return res.status(500).render('upload-error', {
                        title: 'Upload Error',
                        message: `Failed to upload ${file.originalname}. Please try again.`
                    });
                } finally {
                    // Clean up temp file
                    fs.unlinkSync(file.path);
                }
            }

            try {
                const newJob = await Job.create({
                    customerName: name,
                    customerEmail: email,
                    customerPhone: telephone,
                    location,
                    latitude: lat,
                    longitude: lng,
                    images: uploadedFiles, // Save as array
                    status: 'pending',
                    paid: false
                });
                console.log("✅ Job created successfully!", newJob.toJSON());
                res.render('upload-success', { files: uploadedFiles });
            } catch (dbError) {
                console.error('❌ Error creating job in database:', dbError);
                return res.status(500).render('upload-error', {
                    title: 'Database Error',
                    message: 'Failed to save job details. Please try again later.'
                });
            }

        } catch (err) {
            console.error('❌ Error in upload logic:', err);
            res.status(500).render('upload-error', {
                title: 'Server Error',
                message: 'Something went wrong. Please try again later.'
            });
        }
    });
});

// === Admin Job List with Filters and Counts ===
router.get('/admin', adminAuth, async (req, res) => {
    try {
        const filter = req.query.filter || 'total';
        let whereClause = {};

        switch (filter) {
            case 'total':
                break;
            case 'live':
                whereClause.status = { [Op.or]: ['pending', 'approved'] };
                break;
            case 'approved':
                whereClause.status = 'approved';
                break;
            case 'rejected':
                whereClause.status = 'rejected';
                break;
            case 'archived':
                whereClause.status = 'archived';
                break;
            case 'deleted':
                whereClause.status = 'deleted';
                break;
            default:
                break;
        }

        const jobs = await Job.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            raw: true
        });

        const totalCount = await Job.count();
        const liveCount = await Job.count({ where: { status: { [Op.or]: ['pending', 'approved'] } } });
        const approvedCount = await Job.count({ where: { status: 'approved' } });
        const rejectedCount = await Job.count({ where: { status: 'rejected' } });
        const archivedCount = await Job.count({ where: { status: 'archived' } });
        const deletedCount = await Job.count({ where: { status: 'deleted' } });

        res.render('admin-jobs', {
            jobs,
            totalCount,
            liveCount,
            approvedCount,
            rejectedCount,
            archivedCount,
            deletedCount,
            filter
        });
    } catch (err) {
        console.error('❌ Error loading admin jobs:', err);
        res.status(500).send('Server error');
    }
});

// === Approve Job ===
router.post('/jobs/:id/approve', adminAuth, async (req, res) => {
    const { id } = req.params;
    try {
        await Job.update({ status: 'approved' }, { where: { id: id } });
        res.redirect('/jobs/admin?filter=live');
    } catch (err) {
        console.error('❌ Error approving job:', err);
        res.status(500).send('Server error while approving job.');
    }
});




// === Reject Job ===
router.post('/:id/reject', adminAuth, async (req, res) => {
    const { id } = req.params;
    try {
        await Job.update({ status: 'rejected' }, { where: { id: id } });
        res.redirect('/jobs/admin?filter=rejected');
    } catch (err) {
        console.error('❌ Error rejecting job:', err);
        res.status(500).send('Server error while rejecting job.');
    }
});

// === Restore Job ===
router.post('/:id/restore', adminAuth, async (req, res) => {

    const { id } = req.params;
    try {
        await Job.update({ status: 'pending' }, { where: { id: id } }); // Or 'live'
        res.redirect('/jobs/admin?filter=live');
    } catch (err) {
        console.error('❌ Error restoring job:', err);
        res.status(500).send('Server error while restoring job.');
    }
});



// === Move Job from Archived to Deleted ===
router.post('/:id/delete', adminAuth, async (req, res) => {
    const { id } = req.params;
 
    
    try {
     
        await Job.update({ status: 'deleted' }, { where: { id: id } });
        console.log(`✅ Job ${id} moved to 'deleted' status successfully.`);
        

        res.redirect('/jobs/admin?filter=deleted');
    } catch (err) {
        console.error('❌ Error moving job to deleted:', err);
        res.status(500).send('Server error while moving job to deleted.');
    }
});
export default router;