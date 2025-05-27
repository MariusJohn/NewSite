// middleware/adminAuth.js
export default function adminAuth(req, res, next) {

  if (!req.session.isAdmin) {
    return res.redirect('/admin/login');
  }
  next();
}