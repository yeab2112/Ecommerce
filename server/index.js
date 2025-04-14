import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import userRouter from './router/user.js';
import productRouter from './router/product.js';
import './config/db.js';
import dotenv from 'dotenv';
import cartRoutes from './router/cartRout.js';
import orderRoutes from './router/order.js';
import paymentRoutes from './router/paymentRoutes.js';
import morgan from 'morgan';

dotenv.config();

const app = express();

// Middleware Setup
app.use(helmet());
app.use(morgan('dev'));

// Rate limiting setup
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// CORS setup
const allowedOrigins = [
  'https://ecommerce-client-lake.vercel.app',
  'https://ecommerce-5ulb.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('🚨 Blocked by CORS:', origin);
      callback(new Error(`Not allowed by CORS. Origin ${origin} not permitted`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200 // Handle legacy browsers (i.e., IE)
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Pre-flight for all routes

// Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    status: 'API Online',
    message: 'Welcome to Yeabsi E-Commerce API',
    version: '1.0.0',
    endpoints: {
      users: '/api/user',
      products: '/api/product',
      cart: '/api/cart',
      orders: '/api/orders',
      payment: '/api/payment',
      health: '/health'
    },
    docs: 'https://github.com/yeab2112/Yeabsi_e/docs'
  });
});

// API routes
app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);

// Error handling for unknown routes
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: 'Resource not found',
    path: req.originalUrl
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.stack);

  // Handle CORS errors specifically
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      status: 'error',
      error: 'CORS policy violation',
      message: 'Request not allowed from this origin'
    });
  }

  // General error handling
  res.status(err.statusCode || 500).json({
    status: 'error',
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// MongoDB Connection and server startup
const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🔒 CORS enabled for origins: ${allowedOrigins.join(', ')}`);
  console.log(`MongoDB connected`);
});

// Handling unhandled promise rejections (if any)
process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => process.exit(1));
});

export default app;
