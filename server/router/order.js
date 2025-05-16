import express from 'express';
import{ createOrder,getOrderTracking, getUserOrders,getAllOrders,updateOrderStatus,confirmOrderReceived} from '../controller/orderController.js';
import authenticateUser from '../middleware/user.js';
import authoAdmin from "../middleware/autho.js";

const orderRoutes = express.Router();

// Create a new order
orderRoutes.post('/', authenticateUser, createOrder);

// Get all orders for authenticated user
orderRoutes.get('/user', authenticateUser, getUserOrders);
orderRoutes.get('/:orderId/tracking', authenticateUser, getOrderTracking);
// Admin route to get all orders
orderRoutes.get('/allOrder', authoAdmin, getAllOrders);

// Admin route to update order status
orderRoutes.put('/status/:orderId', authoAdmin, updateOrderStatus);
// New route for receipt confirmation
orderRoutes.put(  '/confirm-received/:id',authenticateUser,confirmOrderReceived);
export default orderRoutes;