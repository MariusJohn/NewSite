// controllers/imageCleanupController.js
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

export async function deleteImagesFromS3(imageUrls = []) {
  for (const url of imageUrls) {
    const key = url.split('/job-images/')[1];
    if (!key) continue;
    try {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `job-images/${key}`
      }));
      console.log(`🧹 Deleted from S3: ${key}`);
    } catch (err) {
      console.error(`❌ Failed to delete ${key}:`, err.message);
    }
  }
}
