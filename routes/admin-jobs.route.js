// routes/admin-jobs.route.js
import express from 'express';
import { showJobsWithQuotes, remindBodyshops } from '../controllers/adminJobsController.js';
const router = express.Router();

router.get('/quotes', showJobsWithQuotes);
router.post('/remind/:jobId', remindBodyshops);

export default router;
