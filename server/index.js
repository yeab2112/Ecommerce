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
import notificationRouter from './router/notificationRoutes.js';
import morgan from 'morgan';

dotenv.config();

const app = express();

// =============================================
// 1. PROXY CONFIGURATION (MUST BE FIRST)
// =============================================
app.set('trust proxy', 1); // Trust Vercel's proxy

// =============================================
// 2. SECURITY MIDDLEWARE
// =============================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Required for some payment processors
      connectSrc: ["'self'", "https://api.payment-gateway.com"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'] // Add your CDN
    }
  },
  crossOriginEmbedderPolicy: false // Disable for API endpoints
}));

// =============================================
// 3. RATE LIMITING
// =============================================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 500 : 1000, // Different limits for prod/dev
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later'
  },
  validate: { 
    trustProxy: true // Required for Vercel
  },
  skip: (req) => {
    // Skip rate limiting for health checks and payment webhooks
    return ['/health', '/api/payment/webhook'].includes(req.path);
  }
});

// =============================================
// 4. LOGGING & MONITORING
// =============================================
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// =============================================
// 5. CORS CONFIGURATION
// =============================================
const allowedOrigins = [
  'https://ecommerce-client-lake.vercel.app',
  'https://ecomm-admin-eta-two.vercel.app',
  'https://ecommerce-5ulb.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001'
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚨 Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Forwarded-For'
  ],
  credentials: true,
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors()); // Enable pre-flight for all routes

// =============================================
// 6. BODY PARSERS
// =============================================
app.use(express.json({ 
  limit: '10mb', // Increased for file uploads
  verify: (req, res, buf) => {
    req.rawBody = buf; // For payment webhook verification
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =============================================
// 7. APPLICATION ROUTES
// =============================================

// Health Check (No rate limiting)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// API Routes
app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/notification', notificationRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'API Online',
    message: 'Welcome to Ecommerce API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    docs: 'https://github.com/your-repo/docs'
  });
});

// =============================================
// 8. ERROR HANDLING
// =============================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Resource not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    ip: req.ip
  });

  // Handle CORS errors
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      status: 'error',
      code: 'CORS_ERROR',
      message: 'Not allowed by CORS policy'
    });
  }

  // Handle rate limit errors
  if (err.statusCode === 429) {
    return res.status(429).json({
      status: 'error',
      code: 'RATE_LIMIT_EXCEEDED',
      message: err.message
    });
  }

  // Default error response
  res.status(err.statusCode || 500).json({
    status: 'error',
    code: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'Something went wrong',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// =============================================
// 9. SERVER INITIALIZATION
// =============================================
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📡 Listening on port ${PORT}`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => process.exit(1));
});

export default app;