// controllers/imageCleanupController.js
import { S3Client, DeleteObjectsCommand } from '@aws-sdk/client-s3';
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
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    console.warn('⚠️ No valid image URLs provided for deletion.');
    return;
  }

  // Extract filenames
  const imageKeys = imageUrls
    .map(url => {
      const match = url.match(/job-images\/(.+\.jpg)/);
      return match ? match[1] : null;
    })
    .filter(Boolean);

  if (!imageKeys.length) {
    console.warn('⚠️ No valid S3 keys extracted from image URLs.');
    return;
  }

  const deleteParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Delete: {
      Objects: imageKeys.map(filename => ({ Key: `job-images/${filename}` }))
    }
  };

  try {
    await s3Client.send(new DeleteObjectsCommand(deleteParams));
    console.log(`🧹 Deleted ${imageKeys.length} image(s) from S3`);
  } catch (err) {
    console.error(`❌ S3 deletion error:`, err.message);
  }
}
