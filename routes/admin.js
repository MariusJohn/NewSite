// routes/admin.js
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

  // --- ADD THESE LOGS TO SEE WHAT'S BEING RECEIVED ---
  console.log('  Attempting login with:');
  console.log('  Email:', email);
  // console.log('  Password:', password); // Be careful logging passwords in production
  console.log('  2FA Token:', token);
  console.log('  Role:', role);

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const admin2FASecret = process.env.ADMIN_2FA_SECRET; // Get secret here for logging

  // --- ADD THESE LOGS TO SEE ENV VARS ---
  console.log('  Expected Admin Email (from .env):', adminEmail);
  // console.log('  Expected Admin Password (from .env):', adminPassword); // Be careful
  console.log('  Expected 2FA Secret (from .env):', admin2FASecret ? 'Set' : 'NOT SET'); // Just check if it's set

  const isAuthenticated = email === adminEmail && password === adminPassword;

  // --- ADD THIS LOG FOR AUTH STATUS ---
  console.log('  isAuthenticated (Email/Password match):', isAuthenticated);

  const is2FAValid = speakeasy.totp.verify({
    secret: admin2FASecret, // Use the logged variable
    encoding: 'base32',
    token
  });

  // --- ADD THIS LOG FOR 2FA STATUS ---
  console.log('  is2FAValid (Speakeasy check):', is2FAValid);


  if (!isAuthenticated || !is2FAValid) {
    console.log('❌ Authentication or 2FA failed. Rerendering login page.'); // Log failure
    return res.render('admin/login', { error: 'Invalid credentials or 2FA code.' });
  }

  // --- IF YOU REACH HERE, AUTHENTICATION IS SUCCESSFUL ---
  console.log('✅ Authentication and 2FA successful! Setting session.');

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
