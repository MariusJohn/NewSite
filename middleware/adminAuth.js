export default function adminAuth(req, res, next) {
    // Allow access to the login and logout pages directly
    const ADMIN_BASE = process.env.ADMIN_BASE;


    if (
            req.originalUrl.startsWith(`${ADMIN_BASE}/login`) ||
            req.originalUrl.startsWith(`${ADMIN_BASE}/logout`)
    ) {
        return next();
    }

    // Check if the user is authenticated or if their session has expired due to idle time.
    if (!req.session?.isAdmin || req.session.idleExpired) {
        if (req.session) {
            req.session.destroy(err => {
                if (err) {
                    console.error('Session destroy error in adminAuth:', err);
                }
                res.clearCookie('admin.sid');
                return res.redirect(`${ADMIN_BASE}/login?expired=true`);
            });
        } else {
                    return res.redirect(`${ADMIN_BASE}/login?expired=true`);
        }
    } else {
        req.session.lastActivity = Date.now();
        req.session.idleExpired = false;
        next();
    }
}
