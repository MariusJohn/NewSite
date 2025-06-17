// routes/bodyshop-subscription.js
import express from 'express';
import {
  renderSubscribePage,
  handleSubscription,
  handleSubscriptionSuccess
} from '../controllers/bodyshopSubscriptionController.js';

import { requireBodyshopLogin } from '../middleware/auth.js';

const router = express.Router();

// Subscription page
router.get('/subscribe', requireBodyshopLogin, renderSubscribePage);

// Handle form POST to start Stripe session
router.post('/subscribe', requireBodyshopLogin, handleSubscription);

// Success and cancel routes
router.get('/subscribe/success', requireBodyshopLogin, handleSubscriptionSuccess);

router.get('/subscribe/cancel', requireBodyshopLogin, (req, res) => {
  res.render('bodyshop/subscribe-cancel', { title: 'Subscription Cancelled' });
});


export default router;
