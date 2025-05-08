

// === Restore Rejected Job ===
router.post('/:id/restore', async (req, res) => {
    try {
      const jobId = req.params.id;
      const job = await Job.findByPk(jobId);
  
      if (!job || job.status !== 'rejected') {
        return res.status(400).send('Only rejected jobs can be restored.');
      }
  
      // Restore the job to "pending" (or another status if needed)
      await job.update({ status: 'pending' });
  
      res.redirect('/jobs/admin?filter=rejected');
    } catch (err) {
      console.error(err);
      res.status(500).send('❌ Error restoring job.');
    }
  });