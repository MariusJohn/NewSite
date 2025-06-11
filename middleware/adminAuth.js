//middleware/adminAuth.js

export default function adminAuth(req, res, next) {
  if (!req.session) {
    console.log('⛔ Redirecting to login: No session');
    return res.redirect('/admin/login');
  }

  const { isAdmin, idleExpired } = req.session;

  console.log('🔒 adminAuth session check:', { isAdmin, idleExpired });
  console.log('🍪 Incoming cookies:', req.headers.cookie || 'None');

  if (!isAdmin || idleExpired) {
    const reason = idleExpired
      ? 'Session expired due to inactivity'
      : 'User not admin';
    console.log(`⛔ Redirecting to login: ${reason}`);

    return res.redirect(idleExpired ? '/admin/login?expired=true' : '/admin/login');
  }

  // ✅ Refresh activity timestamp and clear idle flag
  req.session.lastActivity = Date.now();
  req.session.idleExpired = false;


  next();
}
