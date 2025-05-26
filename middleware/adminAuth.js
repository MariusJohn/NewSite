// middleware/adminAuth.js
export default function adminAuth(req, res, next) {
  console.log('adminAuth middleware - isAdmin:', req.session.isAdmin);
  
  if (!req.session.isAdmin) {
    return res.redirect('/admin/login');
  }
  next();
}