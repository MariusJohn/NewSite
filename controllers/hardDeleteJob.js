// controllers/hardDeleteJob.js
import { Job } from '../models/index.js';
import { S3Client, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const hardDeleteJob = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const job = await Job.findByPk(jobId);

    if (!job || job.status !== 'deleted') {
      return res.status(400).send('Only deleted jobs can be permanently removed.');
    }

    const imageKeys = (job.images || [])
      .map(url => {
        const match = url.match(/job-images\/(.+\.jpg)/);
        return match ? `job-images/${match[1]}` : null;
      })
      .filter(Boolean);

    if (imageKeys.length) {
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Delete: {
            Objects: imageKeys.map(Key => ({ Key })),
          },
        })
      );
      console.log(`🗑️ Deleted ${imageKeys.length} image(s) from S3 for job #${jobId}`);
    }

    await job.destroy();
    console.log(`✅ Job #${jobId} permanently deleted`);
    res.redirect('/jobs/admin?filter=deleted');
  } catch (err) {
    console.error('❌ Error during hard delete:', err);
    res.status(500).send('Server error while deleting job.');
  }
};
