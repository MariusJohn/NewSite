// routes/admin-bodyshops.js
import express from 'express';
import { Bodyshop } from '../models/index.js';

const router = express.Router();

// Show all bodyshops pending approval
router.get('/bodyshops', async (req, res) => {
    try {
        const bodyshops = await Bodyshop.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.render('admin-bodyshops', { bodyshops });
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