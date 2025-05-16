// middleware/adminAuth.js
module.exports = function (req, res, next) {
    if (req.session && req.session.isAdmin) {
      return next();
    } else {
      return res.redirect('/admin/login');
    }
  };
  
  const fileUpload = require('express-fileupload');
  app.use(fileUpload());
  