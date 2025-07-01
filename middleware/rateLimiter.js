// middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

export const jobUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 10, 
  message: 'Too many job uploads from this IP, please try again after an hour.',
  standardHeaders: true,
  legacyHeaders: false,
});
