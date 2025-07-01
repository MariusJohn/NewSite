// routes/payment.js
import express from 'express';
const router = express.Router();


import { Job, Quote, Bodyshop } from '../models/index.js';
import { createCheckoutSession, confirmPayment } from '../controllers/paymentController.js';
import { sendFinalEmails } from '../controllers/emailController.js';
import { syncJobStatus } from '../utils/syncJobStatus.js';


import dotenv from 'dotenv';

dotenv.config();


// === GET Payment Page ===
router.get('/', async (req, res) => {
  const jobId = req.query.jobId;

  try {
    const job = await Job.findByPk(jobId, {
      include: [{
        model: Quote,
        as: 'quotes',
        include: [{
          model: Bodyshop,
        as: 'bodyshop'
      }] 
      }]
    });

    if (!job) return res.status(404).send('Job not found');

    const quotes = job.quotes || [];
    
    res.render('payment/view', {
      job,
      quotes,
      paid: job.paid,
      paymentAmount: process.env.PAYMENT_AMOUNT || '5.00'
    });

  } catch (err) {
    console.error('❌ Payment page error:', err);
    res.status(500).send('Server error');
  }
});

// === POST Confirm Payment Manually (optional backup path) ===
router.get('/confirm', async (req, res) => {
  const jobId = req.query.jobId;
  console.log(`>>> Reached /confirm for jobId: ${jobId}`);

  try {
    const job = await Job.findByPk(jobId);
    if (!job) {
      console.error('❌ Job not found for jobId:', jobId);
      return res.status(404).send('Job not found');
    }

    if (!job.paid) {
      job.paid = true;
      await job.save();
      console.log(`✅ Job ${jobId} marked as paid`);

      // 🔁 Sync status after payment
      await syncJobStatus(jobId);
    }

    res.redirect(`/payment?jobId=${jobId}`);
  } catch (err) {
    console.error('❌ Payment confirmation error:', err);
    res.status(500).send('Payment failed');
  }
});



// === POST Stripe Checkout Trigger ===
router.post('/checkout', createCheckoutSession);

// === Optional Success/Cancel Routes for Stripe ===
router.get('/success', (req, res) => {
  res.render('payment/success');
});

router.get('/cancel', (req, res) => {
  res.render('payment/cancel');
});

router.post('/select', async (req, res) => {
  const { jobId, bodyshopId } = req.body;

  try {
    const job = await Job.findByPk(jobId, {
      include: {
        model: Quote,
        as: 'quotes',
        include: [{
          model: Bodyshop,
          as: 'bodyshop'
        }]
      }
    });

    if (!job || !job.paid) {
      return res.status(400).send('Invalid request or job not paid.');
    }

    job.selectedBodyshopId = bodyshopId;
    job.finalDecision = 'customer_selected';
    job.finalDecisionRequestedAt = new Date();
    await job.save();

    const quote = job.quotes.find(q => q.bodyshopId === parseInt(bodyshopId));
    if (!quote) {
      return res.status(404).send('Selected quote not found.');
    }

    // Final email to customer and bodyshop
    await sendFinalEmails(job, quote);

    // 🔁 Sync status after selection
    await syncJobStatus(jobId);

    res.render('payment/selected-confirmation', {
      job,
      selectedBodyshop: quote.bodyshop
    });
  } catch (err) {
    console.error('❌ Error selecting bodyshop:', err);
    res.status(500).send('Server error');
  }
});


// === GET: Confirmation after selecting bodyshop ===
router.get('/selected/:jobId', async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.jobId, {
      include: [{
        model: Quote,
        include: [{
          model: Bodyshop,
          as: 'bodyshop'
      }]
      }]
    });

    const selectedQuote = job.quotes.find(q => q.bodyshopId === job.selectedBodyshopId);

    res.render('payment/selected-confirmation', {
      job,
     selectedBodyshop: selectedQuote.bodyshop
    });
  } catch (err) {
    console.error('❌ Error loading selection confirmation:', err);
    res.status(500).send('Server error.');
  }
});


router.get('/confirm', confirmPayment);

export default router;