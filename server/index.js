import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import './config/db.js';

// Import routes
import userRouter from './router/user.js';
import productRouter from './router/product.js';
import cartRoutes from './router/cartRout.js';
import orderRoutes from './router/order.js';
import paymentRoutes from './router/paymentRoutes.js';
import notificationRouter from './router/notificationRoutes.js';
import reviewRouter  from './router/review.js';

dotenv.config();
const app = express();

// ==================== MIDDLEWARE SETUP ====================

// 1. Trust proxy (Vercel specific)
app.set('trust proxy', 1);

// 2. Enhanced request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// 3. Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://api.chapa.co"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com']
    }
  },
  crossOriginEmbedderPolicy: false
}));

// 4. CORS configuration
const allowedOrigins = [
  'https://ecommerce-client-lake.vercel.app',
  'https://ecomm-admin-eta-two.vercel.app',
  'https://ecommerce-5ulb.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// 5. Rate limiting (exclude payment callbacks)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 500 : 1000,
  message: { status: 'error', message: 'Too many requests' },
  skip: (req) => ['/health', '/api/payment/callback'].includes(req.path)
});

// 6. Body parsers with payment-specific handling
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => { req.rawBody = buf }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== ROUTES SETUP ====================

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// Payment routes (mounted before others for priority)
app.use('/api/payment', paymentRoutes);

// Other API routes
app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notification', notificationRouter);
app.use('/api/reviews', reviewRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ status: 'API Online', version: '1.0.0' });
});

// ==================== ERROR HANDLING ====================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Resource not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  if (err.message.includes('CORS')) {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error' 
  });
});

// ==================== SERVER START ====================
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  server.close(() => process.exit(1));
});

export default app;