// === POST Upload Form with Sharp Compression and Coordinates Fetching ===
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

            const recaptchaResponse = req.body['g-recaptcha-response'];
            if (!recaptchaResponse) {
                return res.status(400).render('upload-error', {
                    title: 'CAPTCHA Error',
                    message: 'CAPTCHA missing. Please complete the CAPTCHA verification.'
                });
            }

            const verifyRes = await axios.post(
                'https://www.google.com/recaptcha/api/siteverify',
                new URLSearchParams({
                    secret: process.env.RECAPTCHA_SECRET_KEY,
                    response: recaptchaResponse
                })
            );

            if (!verifyRes.data.success) {
                return res.status(400).render('upload-error', {
                    title: 'CAPTCHA Error',
                    message: 'CAPTCHA verification failed. Please try again.'
                });
            }

            // Fetching coordinates from OpenCage API
            const apiKey = process.env.OPENCAGE_API_KEY;
            const geoRes = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
                params: {
                    q: location,
                    key: apiKey,
                    countrycode: 'gb',
                    limit: 1
                }
            });

            if (!geoRes.data || !geoRes.data.results || !geoRes.data.results.length) {
                return res.status(400).render('upload-error', {
                    title: 'Location Error',
                    message: 'Unable to find coordinates for the given postcode.'
                });
            }

            const { lat, lng } = geoRes.data.results[0].geometry;

            // Image Compression
            const compressedFilenames = [];
            const finalDir = path.join(__dirname, '..', 'uploads', 'job-images');
            for (const file of req.files) {
                const compressedFilename = `compressed-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
                const outputPath = path.join(finalDir, compressedFilename);

                await sharp(file.path)
                    .resize({ width: 1920 })
                    .jpeg({ quality: 75 })
                    .toFile(outputPath);

                fs.unlinkSync(file.path);
                compressedFilenames.push(compressedFilename);
            }

            // Save job to DB
            await Job.create({
                customerName: name,
                customerEmail: email,
                customerPhone: telephone,
                location,
                latitude: lat,
                longitude: lng,
                images: compressedFilenames,
                status: 'pending',
                paid: false
            });

            res.render('upload-success');
        } catch (err) {
            console.error('❌ Error in upload logic:', err);
            res.status(500).render('upload-error', {
                title: 'Server Error',
                message: 'Something went wrong. Please try again later.'
            });
        }
    });
});