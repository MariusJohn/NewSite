// middleware/adminAuth.js
export default function adminAuth(req, res, next) {
    // Allow access to the login and logout pages directly
    if (req.originalUrl.startsWith('/admin/login') || req.originalUrl.startsWith('/admin/logout')) {
        return next();
    }
  
    // Check if the user is authenticated or if their session has expired due to idle time.
    if (!req.session?.isAdmin || req.session.idleExpired) {
        // Destroy the session upon redirection due to expiration or lack of authentication.
        if (req.session) {
            req.session.destroy(err => {
                if (err) {
                    console.error('Session destroy error in adminAuth:', err); // Keep error log
                }
                res.clearCookie('admin.sid'); // Clear the session cookie.
                return res.redirect('/admin/login?expired=true'); // Redirect to login page with an 'expired' flag.
            });
        } else {
            // If no session exists (e.g., first visit to a protected page), just redirect.
            return res.redirect('/admin/login?expired=true');
        }
    } else {
        // If authenticated and not expired, update last activity.
        req.session.lastActivity = Date.now();
        req.session.idleExpired = false; // Reset idleExpired flag
        next(); // Proceed
    }
  }