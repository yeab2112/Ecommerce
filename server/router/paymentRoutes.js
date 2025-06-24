import express from 'express';
import { initiateChapaPayment, chapaCallback } from '../controller/paymentController.js';
import authenticateUser from '../middleware/user.js';

const  paymentRoutes = express.Router();

// Initiate payment (authenticated)
paymentRoutes.post('/chapa', authenticateUser, initiateChapaPayment);

// Callback handler (public)
// In your paymentRoutes.js
paymentRoutes.post('/callback', 
  express.json(), // Enable JSON body parsing
  chapaCallback
);

paymentRoutes.get('/callback', 
  express.json(),
  express.urlencoded({ extended: true }),
  chapaCallback
);

export default paymentRoutes;