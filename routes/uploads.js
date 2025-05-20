// routes/uploads.js
import express from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import path from 'path'; 
import mime from 'mime-types'; 

dotenv.config();

const router = express.Router();

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 8 * 1024 * 1024 },
});

// === Handle Image Uploads ===
router.post('/upload', upload.array('images', 10), async (req, res) => { 
    console.log('Upload route hit!');
    console.log('Request body:', req.body); 
    console.log('Files received:', req.files);
    try {
        if (!req.files || req.files.length === 0) {
            console.error('No files found in req.files.');
            return res.status(400).send('No files uploaded.');
        }

        const uploadedUrls = [];

        for (const file of req.files) {
            let processedBuffer = file.buffer;
            let outputContentType = 'image/jpeg'; 
            let outputExtension = '.jpg';

            if (file.mimetype.startsWith('image/')) {
                // Compress image using sharp
                processedBuffer = await sharp(file.buffer)
                    .resize({ width: 1024, withoutEnlargement: true }) 
                    .jpeg({ quality: 80 }) 
                    .toBuffer();
            } else {
                // If not an image (e.g., PDF), just upload as is
                outputContentType = mime.lookup(file.originalname) || 'application/octet-stream';
                outputExtension = path.extname(file.originalname);
            }
                
            // Generate unique filename with UUID
            const uniqueFileName = `${randomUUID()}${outputExtension}`;

          
            const key = `job-images/${uniqueFileName}`; // <-- This path must be used when putting to S3

            // Upload to S3
            const command = new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME, 
                Key: key,
                Body: processedBuffer,
                ACL: 'public-read', 
                ContentType: outputContentType, 
            });

            await s3Client.send(command);


            const imageUrl = `https://<span class="math-inline">\{process\.env\.AWS\_BUCKET\_NAME\}\.s3\.</span>{process.env.AWS_REGION}.amazonaws.com/${key}`;
            uploadedUrls.push(imageUrl);
        }

      
        
        res.status(200).json({
            message: 'Files uploaded successfully!',
            urls: uploadedUrls 
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload images' });
    }
});


export default router;