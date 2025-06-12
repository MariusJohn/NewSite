// middleware/adminAuth.js
export default function adminAuth(req, res, next) {
  console.log('🔒 adminAuth session check:', { isAdmin: req.session?.isAdmin, idleExpired: req.session?.idleExpired });
  console.log('🍪 Incoming cookies:', req.headers.cookie ? 'connect.sid=' + req.cookies['admin.sid'] : 'None');
  console.log('Current URL in adminAuth:', req.originalUrl); // Add this log

  // Allow access to the login and logout pages directly, regardless of session status.
  // The login process itself will establish the session.
  if (req.originalUrl.startsWith('/admin/login') || req.originalUrl.startsWith('/admin/logout')) {
      console.log('Allowing access to login/logout page. No auth check needed.');
      return next();
  }

  // For all other admin-protected routes:
  // Check if the user is authenticated and if their session has expired due to idle time.
  if (!req.session?.isAdmin || req.session.idleExpired) {
      console.log('⛔ Redirecting to login: User not admin or session idle expired');

      // Destroy the session upon redirection due to expiration or lack of authentication.
      if (req.session) {
          req.session.destroy(err => {
              if (err) {
                  console.error('❌ Session destroy error in adminAuth:', err);
                  // Even if session destroy fails, we still want to redirect.
              }
              res.clearCookie('admin.sid'); // Clear the session cookie.
              return res.redirect('/admin/login?expired=true'); // Redirect to login page with an 'expired' flag.
          });
      } else {
          // If no session exists (e.g., first visit to a protected page), just redirect.
          return res.redirect('/admin/login?expired=true');
      }
  } else {
      // If the user is authenticated and the session is not idle-expired,
      // update the last activity time to keep the session alive.
      req.session.lastActivity = Date.now();
      req.session.idleExpired = false; // Reset idleExpired flag if they are active again.
      next(); // Proceed to the next middleware or route handler.
  }
}