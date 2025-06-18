// routes/admin-bodyshops.js
import express from 'express';
const router = express.Router();

import { Bodyshop, Job } from '../models/index.js';



// Show all bodyshops pending approval
router.get('/', async (req, res) => {
    try {
        // Fetch bodyshops
        const bodyshops = await Bodyshop.findAll({
          attributes: [
            'id',
            'name',
            'email',
            'phone',
            'area',
            'verified',
            'adminApproved',
            'status',
            'subscriptionType',
            'subscriptionStatus',
            'subscriptionEndsAt'
          ],
          
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
        res.render('admin/bodyshops', {
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
router.post('/:id/approve', async (req, res) => {
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

// Reject bodyshop (soft deactivate)
router.post('/:id/reject', async (req, res) => {
    try {
      const bodyshop = await Bodyshop.findByPk(req.params.id);
      if (bodyshop) {
        bodyshop.status = 'inactive'; // ⛔️ Set as inactive
        bodyshop.adminApproved = false; // 🔓 Optional: also revoke approval
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
  
  // Reactivate bodyshop
router.post('/:id/reactivate', async (req, res) => {
    try {
      const bodyshop = await Bodyshop.findByPk(req.params.id);
      if (bodyshop) {
        bodyshop.status = 'active';
        bodyshop.adminApproved = true; // ✅ Re-approve upon reactivation
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
  

export default router;