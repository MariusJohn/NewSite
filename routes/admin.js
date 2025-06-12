// routes/admin.js
import express from 'express';
const router = express.Router();
import speakeasy from 'speakeasy';
import dotenv from 'dotenv';

dotenv.config();

router.get('/login', (req, res) => {
  if (req.session?.isAdmin) {
    console.log('✅ Already logged in. Redirecting from /admin/login to /jobs/admin');  
    return res.redirect('/jobs/admin');
  }
  const expired = req.query.expired === 'true';
  console.log('Serving admin/login page. Expired param:', expired);
  res.render('admin/login', {
    error: expired ? 'Session expired. Please log in again.' : null
  });
});

router.post('/login', (req, res) => {
  console.log('🔐 Admin login POST hit');

  const { email, password, token, role } = req.body;

  console.log('  Attempting login with:');
  console.log('  Email:', email);
  console.log('  2FA Token:', token);
  console.log('  Role:', role);

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const admin2FASecret = process.env.ADMIN_2FA_SECRET;

  console.log('  Expected Admin Email (from .env):', adminEmail);
  console.log('  Expected 2FA Secret (from .env):', admin2FASecret ? 'Set' : 'NOT SET');

  const isAuthenticated = email === adminEmail && password === adminPassword;

  console.log('  isAuthenticated (Email/Password match):', isAuthenticated);

  const is2FAValid = speakeasy.totp.verify({
    secret: admin2FASecret,
    encoding: 'base32',
    token
  });

  console.log('  is2FAValid (Speakeasy check):', is2FAValid);

  if (!isAuthenticated || !is2FAValid) {
    console.log('❌ Authentication or 2FA failed. Rerendering login page.');
    return res.render('admin/login', { error: 'Invalid credentials or 2FA code.' });
  }

  console.log('✅ Authentication and 2FA successful! Setting session.');

  req.session.isAdmin = true;
  req.session.role = role;
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

router.get('/', (req, res) => {
  console.log('--- Inside router.get(/) handler in routes/admin.js (for /admin path) ---');
  console.log('Session status for /admin:', { isAdmin: req.session?.isAdmin });

  if (req.session?.isAdmin) {
    console.log('User is authenticated, redirecting to /jobs/admin');
    return res.redirect('/jobs/admin');
  } else {
    console.log('User not authenticated, redirecting to /admin/login');
    return res.redirect('/admin/login');
  }
});

export default router;