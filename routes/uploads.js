// routes/uploads.js
import express from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import path from 'path';

dotenv.config();

const router = express.Router();

// Create S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Set up Multer (without using multer-s3 for more control)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 8 * 1024 * 1024 }, // 8MB max file size before compression
});

// === Serve the Job Upload Form (EJS) ===
router.get('/upload', (req, res) => {
    res.render('job-upload');
});

// Handle file uploads - THIS ROUTE IS NOW COMMENTED OUT
// The form submission should be handled by the /jobs/upload route in jobs.js
// router.post('/upload', upload.array('images', 8), async (req, res) => {
//     try {
//         const { name, email, telephone, location } = req.body;
//         const bucketName = process.env.AWS_S3_BUCKET_NAME;
//         const uploadedFiles = [];
//
//         for (const file of req.files) {
//             try {
//                 // Generate a unique file name
//                 const uniqueFileName = `job-images/${randomUUID()}-${file.originalname}`;
//
//                 // Compress and optimize the image
//                 const compressedBuffer = await sharp(file.buffer)
//                     .resize({
//                         width: 1920,
//                         withoutEnlargement: true
//                     }) // Resize but don't enlarge small images
//                     .jpeg({
//                         quality: 70,
//                         mozjpeg: true
//                     }) // High-efficiency JPEG compression
//                     .toBuffer();
//
//                 // Prepare S3 upload parameters
//                 const params = {
//                     Bucket: bucketName,
//                     Key: uniqueFileName,
//                     Body: compressedBuffer,
//                     ContentType: 'image/jpeg',
//                 };
//
//                 // Upload the compressed image to S3
//                 await s3Client.send(new PutObjectCommand(params));
//
//                 const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;
//                 uploadedFiles.push(fileUrl);
//             } catch (compressError) {
//                 console.error(`Compression error for file ${file.originalname}:`, compressError);
//                 return res.status(500).render('upload-error', {
//                     message: `Failed to process the image ${file.originalname}. Please try again with a different file.`
//                 });
//             }
//         }
//
//         console.log("Uploaded files:", uploadedFiles);
//
//         // Render the success page
//         res.render('upload-success', {
//             message: 'Files uploaded successfully',
//             files: uploadedFiles,
//             name,
//             email,
//             telephone,
//             location
//         });
//     } catch (error) {
//         console.error("upload-error:", error);
//
//         // Render the error page with a user-friendly message
//         res.render('upload-error', {
//             message: 'An error occurred while uploading the files. Please make sure each image is smaller than 8MB before compression.'
//         });
//     }
// });

export default router;