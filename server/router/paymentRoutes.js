import express from 'express';
import { initiateChapaPayment, chapaCallback } from '../controller/paymentController.js';
import authenticateUser from '../middleware/user.js';

const  paymentRoutes = express.Router();

// Initiate payment (authenticated)
paymentRoutes.post('/chapa', authenticateUser, initiateChapaPayment);

// Callback handler (public)
paymentRoutes.get('/callback', chapaCallback);
paymentRoutes.post('/callback', 
  express.json(),
  express.urlencoded({ extended: true }),
  chapaCallback
);

export default paymentRoutes;