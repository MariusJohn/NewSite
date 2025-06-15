// routes/dev.js
import express from 'express';
const router = express.Router();

router.get('/dev-preview', (req, res) => {
  res.render('dev-preview');
});


router.get('/upload-success', (req, res) => {
    res.render('jobs/upload-success');
  });

router.get('/upload-error', (req, res) => {
  res.render('jobs/upload-error', {
    title: 'Sample Upload Error',
    message: 'This is a test error message for preview purposes.'
  });
});
  
//Render the login-error view
router.get('/dev/login-error', (req, res) => {
  res.render('bodyshop/login-error', {
    error: req.query.msg || null
  });
});



export default router;
  