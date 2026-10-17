import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import tourRoutes from './routes/tours.js';
import bookingRoutes from './routes/bookings.js';
import staffRoutes from './routes/staff.js';
import { authenticate, requireRole } from './middleware/auth.js';

const app = express();
const clientUrl = process.env.CLIENT_URL || 'http://127.0.0.1:5174';

app.disable('x-powered-by');
app.use(helmet());
app.use((request, response, next) => {
  if (
    !['GET', 'HEAD', 'OPTIONS'].includes(request.method) &&
    request.headers.origin &&
    request.headers.origin !== clientUrl
  ) {
    return response.status(403).json({ message: 'Request origin is not allowed' });
  }
  next();
});
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  }),
);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
    message: { message: 'Too many requests. Please try again later' },
  }),
);

app.get('/', (_request, response) => {
  response.status(200).json({
    success: true,
    message: 'Welcome to the WanderWays API',
    health: '/api/health',
  });
});

app.get('/api/health', (_request, response) => {
  response.status(200).json({
    success: true,
    message: 'WanderWays API is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/staff', staffRoutes);
app.get('/api/staff/session', authenticate, requireRole('staff'), (request, response) => {
  response.json({
    message: 'Staff access verified',
    user: { name: request.user.name, role: request.user.role },
  });
});

app.use((request, response) => {
  response.status(404).json({
    success: false,
    message: `Route ${request.method} ${request.originalUrl} was not found`,
  });
});

app.use((error, request, response, next) => {
  if (response.headersSent) {
    return next(error);
  }

  if (error.code === 11000)
    return response.status(409).json({ message: 'An account with this email already exists' });
  if (error.name === 'ValidationError' || error.name === 'CastError')
    return response.status(400).json({ message: 'Invalid request data' });
  const status = error.status || 500;
  if (status >= 500) console.error(`[${request.method} ${request.originalUrl}]`, error.message);
  return response.status(status).json({
    success: false,
    message: status >= 500 ? 'Something went wrong. Please try again later' : error.message,
  });
});

export default app;
