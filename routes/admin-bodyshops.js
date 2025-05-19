// routes/admin-bodyshops.js
import express from 'express';
import { Bodyshop, Job } from '../models/index.js';

const router = express.Router();

// Show all bodyshops pending approval
router.get('/bodyshops', async (req, res) => {
    try {
        // Fetch bodyshops
        const bodyshops = await Bodyshop.findAll({
            order: [['createdAt', 'DESC']]
        });

        // Fetch job counts
        const totalCount = await Job.count();
        const liveCount = await Job.count({ where: { status: 'pending' } });
        const approvedCount = await Job.count({ where: { status: 'approved' } });
        const rejectedCount = await Job.count({ where: { status: 'rejected' } });
        const archivedCount = await Job.count({ where: { status: 'archived' } });
        const deletedCount = await Job.count({ where: { status: 'deleted' } });

        // Render the template
        res.render('admin-bodyshops', {
            bodyshops,
            totalCount,
            liveCount,
            approvedCount,
            rejectedCount,
            archivedCount,
            deletedCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Approve bodyshop
router.post('/bodyshops/:id/approve', async (req, res) => {
    try {
        const bodyshop = await Bodyshop.findByPk(req.params.id);
        if (bodyshop) {
            bodyshop.adminApproved = true;
            await bodyshop.save();
            res.redirect('/jobs/admin/bodyshops');
        } else {
            res.status(404).send('Bodyshop not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Reject bodyshop
router.post('/bodyshops/:id/reject', async (req, res) => {
    try {
        const bodyshop = await Bodyshop.findByPk(req.params.id);
        if (bodyshop) {
            await bodyshop.destroy();
            res.redirect('/jobs/admin/bodyshops');
        } else {
            res.status(404).send('Bodyshop not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

export default router;