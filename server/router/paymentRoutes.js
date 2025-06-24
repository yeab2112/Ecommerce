// paymentRoutes.js
import express from 'express';
import { initiateChapaPayment, chapaCallback } from '../controller/paymentController.js';

const router = express.Router();

// Special middleware for Vercel's GET-with-body case
const vercelGetBodyParser = (req, res, next) => {
  if (req.method === 'GET' && req.headers['content-type'] === 'application/json') {
    express.json()(req, res, next);
  } else {
    next();
  }
};

router.post('/chapa', initiateChapaPayment);
router.get('/callback', vercelGetBodyParser, chapaCallback);
router.post('/callback', express.json(), chapaCallback);

export default router;