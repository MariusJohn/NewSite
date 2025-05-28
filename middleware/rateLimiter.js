// middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

export const jobUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10, // limit each IP to 10 job uploads per hour
  message: 'Too many job uploads from this IP, please try again after an hour.',
  standardHeaders: true,
  legacyHeaders: false,
});
