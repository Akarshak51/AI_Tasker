import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { connectDB } from './config/db.js';
import { getRedis } from './config/redis.js';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

// API-wide rate limiting to blunt brute-force / abuse.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Stricter limiter on auth endpoints (login/register brute force).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/ready', async (req, res) => {
  try {
    const redis = getRedis();
    const pingResult = await redis.ping();
    res.json({ status: 'ready', redis: pingResult });
  } catch (err) {
    res.status(503).json({ status: 'not-ready', error: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  getRedis();
  app.listen(PORT, () => console.log(`[server] listening on port ${PORT}`));
}

start().catch((err) => {
  console.error('[server] failed to start', err);
  process.exit(1);
});
