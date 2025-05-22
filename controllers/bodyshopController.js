import Quote from '../models/Quote.js';

export const submitQuote = async (req, res) => {
    try {
      const jobId = req.params.jobId;
      const { quoteAmount } = req.body;
      const bodyshopId = req.session.bodyshopId;
      const email = req.session.bodyshopEmail;
  
      const existing = await Quote.findOne({ where: { jobId, bodyshopId } });
      if (existing) return res.send('You already submitted a quote for this job.');
  
      await Quote.create({
        jobId,
        bodyshopId,
        price: parseFloat(quoteAmount),
        email
      });
  
      res.redirect('/bodyshop/dashboard');
    } catch (err) {
      console.error('❌ Quote submission error:', err);
      res.status(500).send('Internal Server Error');
    }
  };