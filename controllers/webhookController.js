import Stripe from 'stripe';
import { Bodyshop } from '../models/index.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Only handle successful payments or subscriptions
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const metadata = session.metadata;
    const plan = metadata.planType;
    const bodyshopId = metadata.bodyshopId;

    try {
      const bodyshop = await Bodyshop.findByPk(bodyshopId);
      if (!bodyshop) return res.status(404).send('Bodyshop not found');

      // Default logic for subscription
      bodyshop.subscriptionStatus = 'active';
      bodyshop.subscriptionType = plan;

      if (plan === '3m') {
        bodyshop.subscriptionEndsAt = addMonths(new Date(), 3);
      } else if (plan === '6m') {
        bodyshop.subscriptionEndsAt = addMonths(new Date(), 6);
      } else if (plan === '12m') {
        bodyshop.subscriptionEndsAt = addMonths(new Date(), 12);
      } else {
        bodyshop.subscriptionEndsAt = null; // monthly auto-renew
      }

      await bodyshop.save();
      console.log(`✅ Subscription activated for Bodyshop ID ${bodyshopId} - Plan: ${plan}`);
    } catch (err) {
      console.error('❌ Failed to update subscription:', err);
    }
  }

  res.status(200).send('Received');
};

// Helper to add months
function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
