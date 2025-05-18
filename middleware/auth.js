// middleware/auth.js

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
      res.redirect('/admin/login');
  }
}