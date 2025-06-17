import { Job, Quote, Bodyshop } from '../models/index.js';

// Fetch jobs where bodyshop submitted a quote but wasn't selected
export const getUnselectedJobs = async (req, res) => {
  try {
    const bodyshopId = req.session.bodyshopId;

    // Find jobs where this bodyshop quoted
    const quotedJobs = await Quote.findAll({
      where: { bodyshopId },
      include: [{ model: Job, where: { paid: true }, required: true }]
    });

    const unselectedJobs = quotedJobs
    .filter(q => 
      q.Job.selectedBodyshopId && 
      q.Job.selectedBodyshopId !== bodyshopId
    )
    .map(q => ({
      jobId: q.Job.id,
      createdAt: q.Job.createdAt,
      quoteAmount: q.price,
      quoteDate: q.createdAt,
      wasAllocatedTo: q.Job.selectedBodyshopId // just info, optional
    }));
  

    res.render('bodyshop/unselected-jobs', {
      title: 'Unselected Jobs',
      bodyshopName: req.session.bodyshopName,
      unselectedJobs
    });

  } catch (err) {
    console.error('❌ Failed to load unselected jobs:', err);
    res.status(500).send('Error loading unselected jobs.');
  }
};
