// routes/static.js
import express from 'express';
const router = express.Router();

router.get('/bodyshop', (req, res) => res.render('static/bodyshop'));
router.get('/training', (req, res) => res.render('static/training'));
router.get('/pricing', (req, res) => res.render('static/pricing'));
router.get('/contact', (req, res) => res.render('static/contact'));
router.get('/privacy', (req, res) => res.render('static/privacy'));

export default router;