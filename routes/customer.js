import express from 'express';
const router = express.Router();


// === View All Quotes for a Job ===
router.get('/quotes/:jobId', async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.jobId);
    if (!job) return res.status(404).send('Job not found');

    const quotes = await Quote.findAll({ where: { jobId: job.id } });

    res.render('job-quotes', { job, quotes });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading quotes');
  }
});

// === Accept a Quote (lock job to bodyshop) ===
router.post('/quotes/:jobId/select', async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const selectedBodyshop = req.body.bodyshopName;

    const job = await Job.findByPk(jobId);

    if (!job) return res.status(404).send('Job not found');
    if (job.selectedBodyshop) return res.status(400).send('Quote already accepted');

    await job.update({
      selectedBodyshop,
      status: 'allocated'
    });

    res.redirect(`/quotes/${jobId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error accepting quote');
  }
});


export default router;
