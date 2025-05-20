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

export default router;