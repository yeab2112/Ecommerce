import express from 'express';
import cors from 'cors';
import userRouter from './router/user.js';
import productRouter from './router/product.js';
import './config/db.js';
import dotenv from 'dotenv';
import cartRoutes from "./router/cartRout.js";
import orderRoutes from './router/order.js';
import paymentRoutes from './router/paymentRoutes.js';

dotenv.config();

const app = express();

// Proper CORS setup
const allowedOrigins = [
  'https://ecommerce-client-lake.vercel.app/',
  'https://admin-ecomm-six.vercel.app',
  'http://localhost:3000', // For local 
  'http://localhost:3001' // For local development

];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Root route handler
app.get('/', (req, res) => {
  res.json({
    status: 'API Online',
    message: 'Welcome to Yeabsi E-Commerce API',
    endpoints: {
      users: '/api/user',
      products: '/api/product',
      cart: '/api/cart',
      orders: '/api/orders',
      payment: '/api/payment'
    }
  });
});

// API routes
app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  next(err);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

export default app; // For Vercel serverless functions