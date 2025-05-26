// controllers/paymentController.js
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createCheckoutSession(req, res) {
  const jobId = req.body.jobId;

  if (!jobId) {
    return res.status(400).send('Missing job ID');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'gbp',
        product_data: {
          name: `Access quotes for Job #${jobId}`,
        },
        unit_amount: parseInt(process.env.PAYMENT_AMOUNT_PENCE) || 500,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.BASE_URL}/payment/confirm?jobId=${jobId}`,
    cancel_url: `${process.env.BASE_URL}/payment?jobId=${jobId}`,
  });

  res.redirect(303, session.url);
}