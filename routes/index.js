// routes/index.js
import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index'); // no data passed for now
});

export default router;
