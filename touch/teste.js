// === Reject Job ===
router.post('/:id/reject', async (req, res) => {
    try {
        const jobId = req.params.id;
        console.log(`➡️ Attempting to reject job with ID: ${jobId}`);

        await Job.update({ status: 'rejected' }, { where: { id: jobId } });
        console.log(`✅ Job ${jobId} rejected successfully.`);
        res.redirect('/jobs/admin?filter=rejected');
    } catch (err) {
        console.error('❌ Error rejecting job:', err);
        res.status(500).send('❌ Error rejecting job.');
    }
});