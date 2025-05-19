// routes/admin.js
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// === Admin Login Page ===
router.get('/login', (req, res) => {

  if (req.session.isAdmin) {
    return res.redirect('/jobs/admin');
  }
  res.render('admin-login', { error: null });
});

// === Admin Login Handler ===
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (email === adminEmail && password === adminPassword) {
    req.session.isAdmin = true;
    req.session.save(err => {
      if (err) {
        console.error('❌ Error saving session:', err);
        return res.render('admin-login', { error: 'Login failed. Please try again.' });
      }
      res.redirect('/jobs/admin');
    });
  } else {
    return res.render('admin-login', { error: 'Invalid credentials' });
  }
});

// === Admin Logout Handler(POST) ===
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('❌ Error destroying session:', err);
      return res.status(500).send('Error logging out. Please try again.');
    }
    res.redirect('/admin/login');
  });
});

export default router;