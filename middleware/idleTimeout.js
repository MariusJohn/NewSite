// middleware/idleTimeout.js

export default function idleTimeout(req, res, next) {
  const MAX_IDLE_MS = 15 * 60 * 1000;
  const now = Date.now();

  // Only apply to admin-protected paths
  if (req.session?.isAdmin && req.originalUrl.startsWith('/jobs/admin')) {
    const lastActivity = req.session.lastActivity || now;

    if (now - lastActivity > MAX_IDLE_MS) {
      console.log(`⏳ Idle timeout — session expired (idle > ${MAX_IDLE_MS / 60000} min)`);
      req.session.idleExpired = true;
      req.session.isAdmin = false;
    } else {
      req.session.lastActivity = now;
    }
  }

  next();
}
