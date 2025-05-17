// routes/uploads.js
const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const dotenv = require('dotenv');
const { randomUUID } = require('crypto');

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
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
});

// Handle file uploads
router.post('/upload', upload.array('images', 8), async (req, res) => {
    try {
        const { name, email, telephone, location } = req.body;
        const bucketName = process.env.AWS_S3_BUCKET_NAME;
        const uploadedFiles = [];

        for (const file of req.files) {
            const uniqueFileName = `job-images/${randomUUID()}-${file.originalname}`;
            const params = {
                Bucket: bucketName,
                Key: uniqueFileName,
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: 'public-read',
            };

            await s3Client.send(new PutObjectCommand(params));

            const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;
            uploadedFiles.push(fileUrl);
        }

        console.log("Uploaded files:", uploadedFiles);

        // Respond with the uploaded file URLs
        res.json({
            message: 'Files uploaded successfully',
            files: uploadedFiles,
            name,
            email,
            telephone,
            location
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: 'Error uploading files' });
    }
});

module.exports = router;