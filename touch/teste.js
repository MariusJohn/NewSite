// === ADMIN DASHBOARD ===
router.get('/', async (req, res) => {
  try {
    const filter = req.query.filter || 'total';
    const { whereClause, includeClause } = getJobFilterOptions(filter);

    const jobs = await Job.findAll({
      where: whereClause,
      include: includeClause,
      order: [['createdAt', 'DESC']]
    });

    //  Add daysPending calculation
    const now = new Date();
    jobs.forEach(job => {
      const createdAt = new Date(job.createdAt);
      const msInDay = 1000 * 60 * 60 * 24;
      const daysPending = Math.floor((now - createdAt) / msInDay);
      job.dataValues.daysPending = daysPending;
    });

    const counts = await getJobCounts();

    res.render('admin/jobs-dashboard', { jobs, ...counts, filter });
  } catch (err) {
    console.error('❌ Dashboard Error:', err);
    res.status(500).send('Internal Server Error');
  }
});
