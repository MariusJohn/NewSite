// Route: /admin
import express from 'express';
const router = express.Router();
import speakeasy from 'speakeasy';
import dotenv from 'dotenv';
import { runSchedulerNow } from '../scheduler.js';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import csurf from 'csurf';
import adminAuth from '../middleware/adminAuth.js';

dotenv.config();

// Ensure required environment variables are set
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_2FA_SECRET) {
  throw new Error('❌ Missing required environment variables for admin authentication');
}


router.use(adminAuth);

const ADMIN_BASE = process.env.ADMIN_BASE;


// CSRF Protection Middleware
const csrfProtection = csurf({ cookie: true });


const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 5 login attempts per window
  message: 'Too many login attempts. Please try again later.',
  handler: (req, res) => {
    console.warn(`Rate limit reached for IP: ${req.ip}`);
    res.status(429).send('Too many login attempts. Please try again later.');
  }
});
// ======= LOGIN ROUTE =======
router.get('/login', csrfProtection, (req, res) => {
  if (req.session?.isAdmin) {
    return res.redirect(`/jobs${ADMIN_BASE}`);
  }
  const expired = req.query.expired === 'true';
  res.render('admin/login', {
    error: expired ? 'Session expired. Please log in again.' : null,
    csrfToken: req.csrfToken(),
    ADMIN_BASE: process.env.ADMIN_BASE
  });
});

router.post('/login', loginLimiter, csrfProtection, async (req, res) => {
  const { email, password, token, role } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPasswordHash = process.env.ADMIN_PASSWORD;
  const admin2FASecret = process.env.ADMIN_2FA_SECRET;

  console.log('Login attempt:', { email, role });

  // Authenticate Admin
  const isAuthenticated = email === adminEmail && await bcrypt.compare(password, adminPasswordHash);
  console.log('Password match:', isAuthenticated);

  // Verify 2FA Token
  const is2FAValid = speakeasy.totp.verify({
    secret: admin2FASecret,
    encoding: 'base32',
    token
  });

  if (!isAuthenticated || !is2FAValid) {
    return res.render('admin/login', {
      error: 'Invalid credentials or 2FA code.',
      csrfToken: req.csrfToken()
    });
  }

  console.log('2FA valid:', is2FAValid);

  // Set Session Data
  req.session.isAdmin = true;
  req.session.role = role;
  req.session.lastActivity = Date.now();

  req.session.save(err => {
    if (err) {
      console.error('Error saving session:', err);
      return res.render('admin/login', { error: 'Login failed. Please try again.', csrfToken: req.csrfToken() });
    }

    res.redirect(`/jobs${ADMIN_BASE}`);

  });
});




// ======= LOGOUT ROUTE =======
// Define the handleLogout function
const handleLogout = (req, res) => {
  if (!req.session) {
    return res.redirect(`${ADMIN_BASE}/login`);
  }

  req.session.destroy(err => {
    if (err) {
      console.error('Session destroy error:', err);
      return res.status(500).send('Logout failed');
    }

    res.clearCookie('admin.sid', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });

   return res.redirect(`${ADMIN_BASE}/login`);

  });
};

// Use handleLogout for both GET and POST routes
router.post('/logout', csrfProtection, handleLogout);
router.get('/logout', handleLogout);

// ======= ADMIN DASHBOARD =======
router.get('/', (req, res) => {
  if (req.session?.isAdmin) {
     return res.redirect(`/jobs${ADMIN_BASE}`);
  } else {
    res.render('admin/login', { error: null });
  }
});

// ======= MANUAL SCHEDULER RUN =======
router.post('/scheduler/manual-run', csrfProtection, async (req, res) => {
  if (!req.session?.isAdmin) {
    return res.status(403).send('Unauthorized');
  }

  try {
    await runSchedulerNow();
    res.redirect(`/jobs${ADMIN_BASE}/quotes`);
  } catch (err) {
    console.error('Manual scheduler run failed:', err);
    res.status(500).send('An error occurred. Please try again later.');
  }
});

export default router;