import express from 'express';
import { handleStripeWebhook } from '../controllers/webhookController.js';

const router = express.Router();

// Stripe sends raw body, so disable express.json for this route
router.post('/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

export default router;
