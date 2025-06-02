import express  from 'express';
import authenticateUser from '../middleware/user.js';

import {initiateChapaPayment,chapaCallback} from'../controller/paymentController.js';
const paymentRoutes = express.Router();
// Initiate Chapa payment
paymentRoutes.post('/initiate',authenticateUser, initiateChapaPayment);

// Chapa callback URL
paymentRoutes.get('/chapa/callback',authenticateUser, chapaCallback);

export default paymentRoutes;