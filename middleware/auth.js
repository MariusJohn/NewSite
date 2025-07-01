// middleware/auth.js

const ADMIN_BASE = process.env.ADMIN_BASE;

export function requireBodyshopLogin(req, res, next) {
  if (req.session && req.session.bodyshopId) {
    next();
  } else {
    res.redirect('/bodyshop/login');
  }
}

export function requireAdminLogin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    next();
  } else {
    res.redirect(`${ADMIN_BASE}/login`);
  }
}
