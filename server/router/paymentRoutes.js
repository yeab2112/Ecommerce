import express  from 'express';
import authenticateUser from '../middleware/user.js';

import {initiateChapaPayment,chapaCallback} from'../controller/paymentController.js';
const paymentRoutes = express.Router();
// Initiate Chapa payment
paymentRoutes.post('/chapa',authenticateUser, initiateChapaPayment);

// Chapa callback URL
paymentRoutes.get('/callback', chapaCallback);

export default paymentRoutes;