function requireBodyshopLogin(req, res, next) {
    if (!req.session.bodyshopId) {
      return res.redirect('/bodyshop/login');
    }
    next();
  }
  
  module.exports = { requireBodyshopLogin };
  