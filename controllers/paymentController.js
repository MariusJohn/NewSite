// controllers/paymentController.js
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { Job } from '../models/index.js';

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


export async function confirmPayment(req, res) {
  const { jobId } = req.query;

  if (!jobId) return res.status(400).send('Missing job ID');

  try {
    const job = await Job.findByPk(jobId);
    if (!job) return res.status(404).send('Job not found');

    job.paid = true;

    if (job.selectedBodyshopId) {
      job.status = 'processed';
    }


  } catch (err) {
    console.error('Payment confirmation error:', err);
    res.status(500).send('Server error');
  }
    await job.save(); 

    res.render('payment/confirm', { job }); 

}

