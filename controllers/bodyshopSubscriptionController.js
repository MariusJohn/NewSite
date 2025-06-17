// controllers/bodyshopSubscriptionController.js
import { Bodyshop } from '../models/index.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// GET: Render subscription page
export const renderSubscribePage = async (req, res) => {
  try {
    const bodyshopId = req.session.bodyshopId;
    if (!bodyshopId) return res.redirect('/bodyshop/login');

    const bodyshop = await Bodyshop.findByPk(bodyshopId);
    const now = new Date();
    const trialExpired = bodyshop.subscriptionType === 'trial' && bodyshop.subscriptionEndsAt && now > new Date(bodyshop.subscriptionEndsAt);

    res.render('bodyshop/subscribe', {
      title: 'Subscription',
      trialEndsAt: bodyshop.subscriptionEndsAt,
      trialExpired,
      subscriptionType: bodyshop.subscriptionType,
      subscriptionStatus: bodyshop.subscriptionStatus
    });
  } catch (err) {
    console.error('❌ Failed to render subscribe page:', err);
    res.status(500).send('Server error loading subscription page.');
  }
};

// POST: Start Stripe session and handle upgrade
export const handleSubscription = async (req, res) => {
  const { plan } = req.body;
  const bodyshopId = req.session.bodyshopId;

  if (!bodyshopId || !plan) return res.status(400).send('Missing data');

  const bodyshop = await Bodyshop.findByPk(bodyshopId);

  const priceMap = {
    monthly: process.env.STRIPE_PRICE_MONTHLY,
    '3m': process.env.STRIPE_PRICE_3M,
    '6m': process.env.STRIPE_PRICE_6M,
    '12m': process.env.STRIPE_PRICE_12M
  };

  const selectedPriceId = priceMap[plan];
  if (!selectedPriceId) return res.status(400).send('Invalid plan');

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: plan === 'monthly' ? 'subscription' : 'payment',
      line_items: [{
        price: selectedPriceId,
        quantity: 1
      }],
      customer_email: bodyshop.email,
      metadata: {
        bodyshopId: bodyshop.id,
        planType: plan
      },
      success_url: `${process.env.BASE_URL}/bodyshop/subscribe/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${process.env.BASE_URL}/bodyshop/subscribe/cancel`
    });

    res.redirect(303, session.url);
  } catch (err) {
    console.error('❌ Stripe session error:', err);
    res.status(500).send('Could not start payment process.');
  }
};


// GET: Handle successful subscription
export const handleSubscriptionSuccess = async (req, res) => {
  const { session_id, plan } = req.query;
  const bodyshopId = req.session.bodyshopId;

  if (!bodyshopId || !plan || !session_id) {
    return res.status(400).send('Invalid subscription confirmation.');
  }

  const bodyshop = await Bodyshop.findByPk(bodyshopId);
  if (!bodyshop) return res.status(404).send('Bodyshop not found');

  // Calculate duration based on selected plan
  const now = new Date();
  let durationMonths = 1; // default for 'monthly'
  if (plan === '3m') durationMonths = 3;
  if (plan === '6m') durationMonths = 6;
  if (plan === '12m') durationMonths = 12;

  const newEndDate = new Date();
  newEndDate.setMonth(newEndDate.getMonth() + durationMonths);

  try {
    bodyshop.subscriptionType = 'paid';
    bodyshop.subscriptionStatus = 'active';
    bodyshop.subscriptionEndsAt = newEndDate;
    await bodyshop.save();

    // Store message in session and redirect to dashboard
    req.session.subscriptionMessage = '✅ Subscription successful!';
    res.redirect('/bodyshop/dashboard');
  } catch (err) {
    console.error('❌ Failed to update bodyshop subscription:', err);
    res.status(500).send('Subscription update failed.');
  }
};
