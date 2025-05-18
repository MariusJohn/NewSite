// middleware/adminAuth.js (ES Module version)
export default function adminAuth(req, res, next) {
  if (!req.session.isAdmin) {
      return res.redirect('/admin/login');
  }
  next();
}