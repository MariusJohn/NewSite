// === Restore Job ===
router.post('/:jobId/restore', async (req, res) => {
    try {
      const jobId = req.params.jobId;
      const job = await Job.findByPk(jobId);
  
      // Allow restoring both rejected and archived jobs
      if (!job || !['rejected', 'archived'].includes(job.status)) {
        return res.status(400).send('Only rejected or archived jobs can be restored.');
      }
  
      // Set the status to pending for both rejected and archived jobs
      await job.update({ status: 'pending' });
  
      res.redirect('/jobs/admin?filter=live'); // Redirect to live jobs after restore
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  });
  