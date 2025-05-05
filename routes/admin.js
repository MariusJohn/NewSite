// routes/admin.js
const express = require('express');
const router = express.Router();

require('dotenv').config();

router.get('/login', (req, res) => {
  res.render('admin-login', { error: null });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (email === adminEmail && password === adminPassword) {
    req.session.isAdmin = true;
    return res.redirect('/jobs/admin');
  } else {
    return res.render('admin-login', { error: 'Invalid credentials' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

module.exports = router;
