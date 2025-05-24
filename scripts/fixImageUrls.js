// fixImageUrls.js
import dotenv from 'dotenv';
import { Job } from './models/index.js';

dotenv.config();

async function fixImageUrls() {
    try {
        const region = process.env.AWS_REGION || 'eu-north-1';
        const bucketName = process.env.AWS_S3_BUCKET_NAME || 'newsite-images-mcquote';
        const s3BaseUrl = `https://${bucketName}.s3.${region}.amazonaws.com/`;

        // Fetch all jobs
        const jobs = await Job.findAll();

        for (const job of jobs) {
            const fixedUrls = job.images.map(filename => {
                // If the URL is already corrected, skip it
                if (filename.startsWith(s3BaseUrl)) return filename;
                
                // Ensure the filename does not contain the full URL already
                const fileKey = filename.split('/').pop();
                return `${s3BaseUrl}job-images/${fileKey}`;
            });

            // Update the job with fixed URLs
            job.images = fixedUrls;
            await job.save();
            console.log(`✅ Updated images for Job ID: ${job.id}`);
        }

        console.log('✅ All image URLs have been updated successfully.');
    } catch (error) {
        console.error('❌ Error updating image URLs:', error);
    } finally {
        process.exit();
    }
}

fixImageUrls();