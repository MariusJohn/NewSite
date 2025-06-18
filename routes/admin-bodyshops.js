import express from 'express';
const router = express.Router();
import { Op } from 'sequelize';
import { Bodyshop, Job } from '../models/index.js';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.ionos.co.uk',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Show all bodyshops
router.get('/', async (req, res) => {
  try {
    const search = req.query.search || '';

    const bodyshops = await Bodyshop.findAll({
      where: search
        ? {
            [Op.or]: [
              { name: { [Op.iLike]: `%${search}%` } },
              { area: { [Op.iLike]: `%${search}%` } }
            ]
          }
        : {},
      attributes: ['id', 'name', 'email', 'phone', 'area', 'verified', 'adminApproved', 'status', 'subscriptionStatus', 'subscriptionEndsAt'],
      order: [['createdAt', 'DESC']]
    });

    const totalCount = await Job.count();
    const liveCount = await Job.count({ where: { status: 'pending' } });
    const approvedCount = await Job.count({ where: { status: 'approved' } });
    const rejectedCount = await Job.count({ where: { status: 'rejected' } });
    const archivedCount = await Job.count({ where: { status: 'archived' } });
    const deletedCount = await Job.count({ where: { status: 'deleted' } });

    res.render('admin/bodyshops', {
      bodyshops,
      totalCount,
      liveCount,
      approvedCount,
      rejectedCount,
      archivedCount,
      deletedCount,
      search
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
      bodyshop.status = 'active';      
      await bodyshop.save();

      await transporter.sendMail({
        from: '"My Car Quote" <noreply@mcquote.co.uk>',
        to: bodyshop.email,
        subject: '✅ Your Bodyshop Has Been Approved',
        html: `
          <p>Hello <strong>${bodyshop.name}</strong>,</p>
          <p>Your bodyshop account has been <strong>approved</strong>.</p>
          <p>You can now <a href="http://${req.headers.host}/bodyshop/login">log in</a> and begin submitting quotes.</p>
          <p>Welcome to My Car Quote!</p>
        `
      });

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
router.post('/:id/reject', async (req, res) => {
  try {
    const bodyshop = await Bodyshop.findByPk(req.params.id);
    if (bodyshop) {
      bodyshop.status = 'inactive';
      bodyshop.adminApproved = false;
      await bodyshop.save();

      await transporter.sendMail({
        from: '"My Car Quote" <noreply@mcquote.co.uk>',
        to: bodyshop.email,
        subject: '❌ Your Bodyshop Registration Was Not Approved',
        html: `
          <p>Hello <strong>${bodyshop.name}</strong>,</p>
          <p>Unfortunately, your registration was <strong>not approved</strong> at this time.</p>
          <p>If you believe this is a mistake, feel free to <a href="mailto:office@mcquote.co.uk">contact us</a>.</p>
        `
      });

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
      bodyshop.adminApproved = true;
      await bodyshop.save();

      await transporter.sendMail({
        from: '"My Car Quote" <noreply@mcquote.co.uk>',
        to: bodyshop.email,
        subject: '🔄 Your Bodyshop Account Has Been Reactivated',
        html: `
          <p>Hello <strong>${bodyshop.name}</strong>,</p>
          <p>Your bodyshop account has been <strong>reinstated</strong> and is now active again.</p>
          <p>You can resume quoting by <a href="http://${req.headers.host}/bodyshop/login">logging in here</a>.</p>
          <p>Welcome back to My Car Quote!</p>
        `
      });

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
