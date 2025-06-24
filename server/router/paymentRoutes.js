import express from 'express';
import { initiateChapaPayment, chapaCallback } from '../controller/paymentController.js';
import authenticateUser from '../middleware/user.js';

const paymentRoutes = express.Router();

// Payment initiation
paymentRoutes.post('/chapa', authenticateUser, initiateChapaPayment);

// Callback handler - supports both GET and POST
paymentRoutes.get('/callback', chapaCallback);
paymentRoutes.post('/callback', chapaCallback);

export default paymentRoutes;