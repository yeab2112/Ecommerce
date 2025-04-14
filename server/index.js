import express from 'express';
import cors from 'cors';
import helmet from 'helmet'; // Added for security headers
import rateLimit from 'express-rate-limit'; // Added for rate limiting
import userRouter from './router/user.js';
import productRouter from './router/product.js';
import './config/db.js';
import dotenv from 'dotenv';
import cartRoutes from "./router/cartRout.js";
import orderRoutes from './router/order.js';
import paymentRoutes from './router/paymentRoutes.js';
import morgan from 'morgan'; // Added for request logging

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(morgan('dev')); // Log requests in development

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// CORS configuration
const allowedOrigins = [
  'https://ecommerce-client-lake.vercel.app',
  'https://admin-ecomm-six.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('🚨 Blocked by CORS:', origin);
      callback(new Error(`Not allowed by CORS. Origin ${origin} not permitted`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));
// Handle preflight requests
app.options('*', cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10kb' })); // Limit payload size
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// API documentation endpoint
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
    docs: 'https://github.com/yeab2112/Yeabsi_e/docs' // Add your docs link if available
  });
});

// API routes
app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: 'Resource not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.stack);
  
  if (err.message.includes('CORS')) {
    return res.status(403).json({ 
      status: 'error',
      error: 'CORS policy violation',
      message: 'Request not allowed from this origin'
    });
  }

  // Handle other errors
  res.status(err.statusCode || 500).json({
    status: 'error',
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🔒 CORS enabled for origins: ${allowedOrigins.join(', ')}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => process.exit(1));
});

export default app;