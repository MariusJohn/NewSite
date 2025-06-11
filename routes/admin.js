//routes/admin.js

import express from 'express';
const router = express.Router();
import speakeasy from 'speakeasy';
import dotenv from 'dotenv';

dotenv.config();

// === Admin Login Page ===
router.get('/login', (req, res) => {
  if (req.session?.isAdmin) return res.redirect('/jobs/admin');

  const expired = req.query.expired === 'true';
  res.render('admin/login', {
    error: expired ? 'Session expired. Please log in again.' : null
  });
});

// === Admin Login Handler ===
router.post('/login', (req, res) => {
  console.log('🔐 Admin login POST hit');

  const { email, password, token, role } = req.body;

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  const isAuthenticated = email === adminEmail && password === adminPassword;

  const is2FAValid = speakeasy.totp.verify({
    secret: process.env.ADMIN_2FA_SECRET,
    encoding: 'base32',
    token
  });

  if (!isAuthenticated || !is2FAValid) {
    return res.render('admin/login', { error: 'Invalid credentials or 2FA code.' });
  }

  // ✅ Set session with role
  req.session.isAdmin = true;
  req.session.role = role; // Add role to session
  req.session.lastActivity = Date.now();
  req.session.idleExpired = false;

  req.session.save(err => {
    if (err) {
      console.error('❌ Error saving session:', err);
      return res.render('admin/login', { error: 'Login failed. Please try again.' });
    }

    console.log('✅ Session saved, redirecting to dashboard');
    res.redirect('/jobs/admin');
  });
});

// === Admin Logout Handler ===
const handleLogout = (req, res) => {
  if (!req.session) {
    return res.redirect('/admin/login');
  }

  req.session.destroy(err => {
    if (err) {
      console.error('❌ Session destroy error:', err);
      return res.status(500).send('Logout failed');
    }

    res.clearCookie('connect.sid', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax'
    });

    console.log('✅ Session destroyed, redirecting to login page');
    return res.redirect('/admin/login');
  });
};

router.post('/logout', handleLogout);
router.get('/logout', handleLogout);

export default router;
