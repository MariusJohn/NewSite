// middleware/subscriptionCheck.js
import { Bodyshop } from '../models/index.js';

export const checkSubscriptionActive = async (req, res, next) => {
  try {
    const bodyshop = await Bodyshop.findByPk(req.session.bodyshopId);

    if (!bodyshop) return res.redirect('/bodyshop/login');

    const now = new Date();
    const isTrialExpired =
      bodyshop.subscriptionType === 'free' &&
      bodyshop.subscriptionStatus === 'trial' &&
      bodyshop.subscriptionEndsAt &&
      new Date(bodyshop.subscriptionEndsAt) < now;

    const isPaidExpired =
      bodyshop.subscriptionType === 'paid' &&
      bodyshop.subscriptionStatus === 'active' &&
      bodyshop.subscriptionEndsAt &&
      new Date(bodyshop.subscriptionEndsAt) < now;

    if (isTrialExpired || isPaidExpired) {
      req.session.subscriptionMessage = '⚠️ Your subscription has expired. Please renew to continue.';
      return res.redirect('/bodyshop/subscribe');
    }

    next();
  } catch (err) {
    console.error('❌ Subscription check failed:', err);
    res.status(500).send('Subscription verification error.');
  }
};
