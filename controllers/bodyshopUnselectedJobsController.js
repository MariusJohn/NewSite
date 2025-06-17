import { Job, Quote, Bodyshop } from '../models/index.js';

// Fetch jobs where bodyshop submitted a quote but wasn't selected
export const getUnselectedJobs = async (req, res) => {
  try {
    const bodyshopId = req.session.bodyshopId;

    const quotedJobs = await Quote.findAll({
      where: { bodyshopId },
      include: [{
        model: Job,
        as: 'job',
        where: { paid: true },
        required: true,
        include: [{
          model: Quote,
          as: 'quotes',
          include: [{
            model: Bodyshop,
            as: 'bodyshop'
          }]
        }]
      }]
    });
    
    const unselectedJobs = quotedJobs
      .filter(q => q.job.selectedBodyshopId && q.job.selectedBodyshopId !== bodyshopId)
      .map(q => ({
        jobId: q.job.id,
        createdAt: q.job.createdAt,
        quoteDate: q.createdAt,
        allQuotes: q.job.quotes.map(quote => ({
          bodyshopId: quote.bodyshopId,
          bodyshopName: quote.bodyshop?.name || 'N/A',
          price: quote.price,
          isMine: quote.bodyshopId === bodyshopId,
          isSelected: quote.bodyshopId === q.job.selectedBodyshopId
        }))
      }));
    

    const bodyshop = await Bodyshop.findByPk(bodyshopId);

    // Step 3: Render in dashboard under `tab: unselected`
    res.render('bodyshop/dashboard', {
      title: 'Unselected Jobs',
      tab: 'unselected',
      bodyshopName: bodyshop.name,
      unselectedJobs,
      bodyshop,
      subscriptionMessage: null
    });

  } catch (err) {
    console.error('❌ Failed to load unselected jobs:', err);
    res.status(500).send('Error loading unselected jobs.');
  }
};
