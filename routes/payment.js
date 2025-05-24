// routes/payment.js
import express from 'express';
import { Job, Quote, Bodyshop } from '../models/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const jobId = req.query.jobId;

  try {
    const job = await Job.findByPk(jobId, {
      include: [{
        model: Quote,
        as: 'quotes',
        include: job.paid ? [Bodyshop] : []
      }]
    });

    if (!job) return res.status(404).send('Job not found');

    res.render('payment/view', {
      job,
      quotes: job.quotes,
      paid: job.paid
    });
  } catch (err) {
    console.error('❌ Payment page error:', err);
    res.status(500).send('Server error');
  }
});


router.post('/confirm', async (req, res) => {
    const jobId = req.body.jobId;
  
    try {
      const job = await Job.findByPk(jobId);
      if (!job) return res.status(404).send('Job not found');
  
      job.paid = true;
      job.status = 'pending_payment';
      await job.save();
  
      res.redirect(`/payment?jobId=${job.id}`);
    } catch (err) {
      console.error('❌ Payment confirmation error:', err);
      res.status(500).send('Payment failed');
    }
  });

  
export default router;