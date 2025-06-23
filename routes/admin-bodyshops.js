import express from 'express';
const router = express.Router();
import { Op } from 'sequelize';
import { Bodyshop, Job } from '../models/index.js';
import nodemailer from 'nodemailer';
import csurf from 'csurf';
import adminAuth from '../middleware/adminAuth.js';



// Apply adminAuth middleware to all routes in this file
router.use(adminAuth);

router.use(csurf({ cookie: true }));

router.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});



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
      search,
      csrfToken: req.csrfToken()
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
        from: '"My Car Quote" <office@mcquote.co.uk>',
        to: bodyshop.email,
        subject: '✅ Your Bodyshop Has Been Approved',
        html: `
          <div style="font-family: Arial, sans-serif; color: #002f5c; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://mcquote.co.uk/img/logo-true.svg" alt="My Car Quote Logo" style="height: 60px;" />
            </div>
      
            <h2 style="color: #25D366;">Welcome, ${bodyshop.name}!</h2>
      
            <p>Your bodyshop account has been <strong>approved</strong>.</p>
      
            <p>You can now log in to view jobs and submit quotes:</p>
      
            <p>
              <a href="http://${req.headers.host}/bodyshop/login" style="
                display: inline-block;
                padding: 12px 20px;
                background-color: #002f5c;
                color: #fff;
                text-decoration: none;
                border-radius: 5px;
              ">
                🔐 Log In to Dashboard
              </a>
            </p>
      
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ccc;" />
      
            <p style="font-size: 13px; color: #999;">
              This email was sent by My Car Quote | <a href="https://mcquote.co.uk">mcquote.co.uk</a><br/>
              If you didn’t request this, please ignore this email.
            </p>
          </div>
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
        from: '"My Car Quote" <office@mcquote.co.uk>',
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
        from: '"My Car Quote" <office@mcquote.co.uk>',
        to: bodyshop.email,
        subject: '🔄 Your Bodyshop Account Has Been Reactivated',
        html: `
          <div style="font-family: Arial, sans-serif; color: #002f5c; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://mcquote.co.uk/img/logo-true.svg" alt="My Car Quote Logo" style="height: 60px;" />
            </div>
      
            <h2 style="color: #25D366;">Welcome Back, ${bodyshop.name}!</h2>
      
            <p>Your bodyshop account has been <strong>reinstated</strong> and is now active again.</p>
      
            <p>You can resume quoting on new jobs by logging into your dashboard:</p>
      
            <p>
              <a href="http://${req.headers.host}/bodyshop/login" style="
                display: inline-block;
                padding: 12px 20px;
                background-color: #002f5c;
                color: #fff;
                text-decoration: none;
                border-radius: 5px;
              ">
                🔐 Log In to Dashboard
              </a>
            </p>
      
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ccc;" />
      
            <p style="font-size: 13px; color: #999;">
              This email was sent by My Car Quote | <a href="https://mcquote.co.uk">mcquote.co.uk</a><br/>
              If you didn’t request this change, please ignore this message.
            </p>
          </div>
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
