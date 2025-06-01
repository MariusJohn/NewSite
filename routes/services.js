// routes/index.js
import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.render('static/services'); // no data passed for now
});

export default router;
