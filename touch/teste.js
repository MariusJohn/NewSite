// ... (existing code up to Lat/Lng calculation) ...

const uploadedS3Urls = []; // This will store the full S3 URLs

if (!req.files || req.files.length === 0) {
    console.warn('⚠️ No files were submitted with the form.');
} else {
    for (const file of req.files) {
        console.log(`Processing file: ${file.originalname}`);
        console.log(`File buffer length: ${file.buffer ? file.buffer.length : 'undefined/null'}`);
        console.log(`File mimetype: ${file.mimetype}`);

        // Ensure file.buffer exists and has data before attempting sharp
        if (!file.buffer || file.buffer.length === 0) {
            console.warn(`⚠️ Skipping empty or invalid file buffer for: ${file.originalname}`);
            continue; // Skip to the next file
        }

        try { // This try-catch is for the individual file processing (sharp and S3)
            const compressedBuffer = await sharp(file.buffer)
                .resize({ width: 1920, withoutEnlargement: true })
                .jpeg({ quality: 75 })
                .toBuffer();

            const uniqueFileName = `${randomUUID()}.jpg`;
            const s3Key = `job-images/${uniqueFileName}`;

            const command = new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: s3Key,
                Body: compressedBuffer,
                ContentType: 'image/jpeg',
            });

            await s3Client.send(command);
            
            const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
            uploadedS3Urls.push(imageUrl);
            console.log(`✅ Successfully uploaded to S3: ${imageUrl}`);

        } catch (fileProcessingError) { // Catch specific error for this file (e.g., Sharp invalid input)
            console.error(`❌ Error processing or uploading file ${file.originalname} to S3:`, fileProcessingError);
            // Crucially, we do NOT re-throw here. We log the error and allow the loop to continue.
            // This ensures the main job creation logic is still attempted even if one image fails.
        }
    }
}

// --- DATABASE SAVE SECTION (THIS IS WHAT WE WANT TO REACH) ---
console.log('Attempting to create job with data:', {
    customerName: name,
    customerEmail: email,
    customerPhone: telephone,
    location,
    latitude: lat,
    longitude: lng,
    images: uploadedS3Urls,
    status: 'pending',
    paid: false
});

const newJob = await Job.create({
    customerName: name,
    customerEmail: email,
    customerPhone: telephone,
    location,
    latitude: lat,
    longitude: lng,
    images: uploadedS3Urls,
    status: 'pending',
    paid: false
});
console.log('✅ Job successfully created in DB with ID:', newJob.id);

res.render('upload-success');

} catch (routeError) { // This catch block handles errors *outside* the file processing loop
    console.error('❌ Final catch - Error in jobs.js upload route:', routeError);
    // ... (Sequelize error handling, etc. as before) ...
}