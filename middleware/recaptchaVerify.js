// middleware/recaptchaVerify.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

export const verifyRecaptcha = async (req, res, next) => {
    const token = req.body['g-recaptcha-response'];

    if (!token) {
        console.error('❌ reCAPTCHA: No token found in request body.');
        return res.status(400).render('jobs/upload-error', {
            title: 'Captcha Error',
            message: 'Captcha verification failed: No reCAPTCHA token provided. Please try again.'
        });
    }

    try {
        const verifyResponse = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
            params: {
                secret: RECAPTCHA_SECRET_KEY,
                response: token
            }
        });

        if (!verifyResponse.data.success) {
            console.error('❌ reCAPTCHA: Verification failed.', verifyResponse.data['error-codes']);
            return res.status(400).render('jobs/upload-error', {
                title: 'Captcha Error',
                message: `Captcha verification failed: ${verifyResponse.data['error-codes'].join(', ')}. Please try again.`
            });
        }

        console.log('✅ reCAPTCHA: Verification successful.');
        next(); // Proceed to the next middleware/route handler
    } catch (error) {
        console.error('❌ reCAPTCHA: Error during verification:', error.message);
        return res.status(500).render('jobs/upload-error', {
            title: 'Server Error',
            message: 'An error occurred during captcha verification. Please try again later.'
        });
    }
};