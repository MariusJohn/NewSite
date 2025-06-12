// routes/admin.js
import express from 'express';
const router = express.Router();
import speakeasy from 'speakeasy';
import dotenv from 'dotenv';

dotenv.config();

router.get('/login', (req, res) => {
  if (req.session?.isAdmin) {
    return res.redirect('/jobs/admin');
  }
  const expired = req.query.expired === 'true';
  res.render('admin/login', {
    error: expired ? 'Session expired. Please log in again.' : null
  });
});

router.post('/login', (req, res) => {
  const { email, password, token, role } = req.body;

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD; // Typo fix: ADMIN.PASSWORD -> ADMIN_PASSWORD
  const admin2FASecret = process.env.ADMIN_2FA_SECRET;

  const isAuthenticated = email === adminEmail && password === adminPassword;

  const is2FAValid = speakeasy.totp.verify({
    secret: admin2FASecret,
    encoding: 'base32',
    token
  });

  if (!isAuthenticated || !is2FAValid) {
    return res.render('admin/login', { error: 'Invalid credentials or 2FA code.' });
  }

  req.session.isAdmin = true;
  req.session.role = role;
  req.session.lastActivity = Date.now();
  req.session.idleExpired = false;

  req.session.save(err => {
    if (err) {
      console.error('Error saving session:', err); // Keep error log
      return res.render('admin/login', { error: 'Login failed. Please try again.' });
    }

    res.redirect('/jobs/admin');
  });
});

const handleLogout = (req, res) => {
  if (!req.session) {
    return res.redirect('/admin/login');
  }

  req.session.destroy(err => {
    if (err) {
      console.error('Session destroy error:', err); // Keep error log
      return res.status(500).send('Logout failed');
    }

    res.clearCookie('connect.sid', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax'
    });

    return res.redirect('/admin/login');
  });
};

router.post('/logout', handleLogout);
router.get('/logout', handleLogout);

router.get('/', (req, res) => {
  if (req.session?.isAdmin) {
    return res.redirect('/jobs/admin');
  } else {
    res.render('admin/login', { error: null });
  }
});

export default router;