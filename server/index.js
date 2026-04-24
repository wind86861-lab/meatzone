// ── Sentry must be initialised FIRST ──────────────────────────────────────────
const Sentry = require('@sentry/node');
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
    ],
  });
}
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const { logger } = require('./config/logger');
const { redis } = require('./config/redis');

dotenv.config({ path: path.join(__dirname, '.env') });

const isProd = process.env.NODE_ENV === 'production';

const app = express();

// CRITICAL: trust nginx reverse proxy so express-rate-limit reads real IPs
app.set('trust proxy', 1);

// Global process-level guards — prevent Node.js crash on unhandled errors
process.on('uncaughtException', (err) => {
  logger.error('[FATAL] Uncaught Exception — keeping process alive:', err);
});
process.on('unhandledRejection', (reason) => {
  logger.error('[FATAL] Unhandled Promise Rejection — keeping process alive:', reason);
});

// Security headers
const isHttps = process.env.HTTPS === 'true' || process.env.SITE_URL?.startsWith('https');
app.use(helmet({
  crossOriginResourcePolicy: false,
  // COOP requires HTTPS to be useful — disable on HTTP to avoid browser warnings
  crossOriginOpenerPolicy: isHttps ? { policy: 'same-origin' } : false,
  // HSTS only makes sense over HTTPS
  hsts: isHttps ? { maxAge: 15552000, includeSubDomains: true } : false,
  // Origin-Agent-Cluster requires consistent HTTPS context — disable on HTTP
  originAgentCluster: isHttps,
  contentSecurityPolicy: false, // We set it manually below
}));

// Set Content-Security-Policy manually — never include upgrade-insecure-requests on HTTP
app.use((req, res, next) => {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com",
    "script-src-elem 'self' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://maps.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https://maps.googleapis.com https://maps.gstatic.com https://*.googleapis.com",
    "frame-src 'self' https://www.google.com https://maps.google.com https://maps.googleapis.com",
    "worker-src 'self' blob:",
    "base-uri 'self'",
    "form-action 'self'",
    ...(isHttps ? ["upgrade-insecure-requests"] : []),
  ].join('; ');
  res.setHeader('Content-Security-Policy', csp);
  next();
});

// CORS – restrict to known origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || !isProd) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Increase timeout for large uploads
app.use((req, res, next) => {
  res.setTimeout(120000); // 2 minutes
  next();
});
app.use(morgan(isProd ? 'combined' : 'dev'));

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/customers', apiLimiter, require('./routes/customers'));
app.use('/api/appointments', apiLimiter, require('./routes/appointments'));
app.use('/api/services', apiLimiter, require('./routes/services'));
app.use('/api/inventory', apiLimiter, require('./routes/inventory'));
app.use('/api/analytics', apiLimiter, require('./routes/analytics'));
app.use('/api/products', apiLimiter, require('./routes/products'));
app.use('/api/categories', apiLimiter, require('./routes/categories'));
app.use('/api/blogs', apiLimiter, require('./routes/blogs'));
app.use('/api/branches', apiLimiter, require('./routes/branches'));
app.use('/api/faqs', apiLimiter, require('./routes/faqs'));
app.use('/api/requests', apiLimiter, require('./routes/requests'));
app.use('/api/settings', apiLimiter, require('./routes/settings'));
app.use('/api/page-content', apiLimiter, require('./routes/pageContent'));
app.use('/api/upload', apiLimiter, require('./routes/upload'));
app.use('/api/team', apiLimiter, require('./routes/team'));
app.use('/api/orders', apiLimiter, require('./routes/orders'));

// Stage 4: Payment provider webhooks (NO rate limiting — providers need unrestricted access)
app.use('/api/payme', require('./routes/payme'));
app.use('/api/click', require('./routes/click'));

// Stage 1: Health check with Redis status
app.get('/api/health', async (req, res) => {
  try {
    // Check Redis connection
    const redisStatus = redis.status === 'ready' ? 'connected' : 'disconnected';

    res.json({
      status: 'OK',
      message: 'PneuMax API is running',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: redisStatus,
      },
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message,
    });
  }
});

// Serve built React client in production
if (isProd) {
  const clientBuild = path.join(__dirname, '..', 'client', 'dist');

  // Serve hashed assets (/assets/*) with long-term immutable cache
  // These files have content hashes in their names, so they never go stale
  app.use('/assets', express.static(path.join(clientBuild, 'assets'), {
    maxAge: '1y',
    immutable: true,
    etag: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));

  // Serve other static files (images etc) with moderate cache
  app.use(express.static(clientBuild, {
    maxAge: '1d',
    etag: true,
    index: false,
  }));

  // SPA fallback - serve index.html for all page routes
  app.get('*', (req, res) => {
    // API and upload routes should have been handled already — 404 if not
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return res.status(404).json({ message: 'Not found' });
    }

    // Never serve index.html for asset/file requests
    if (req.path.startsWith('/assets/') ||
      req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map|json)$/)) {
      return res.status(404).send('Not found');
    }

    // Serve index.html — MUST be no-store so browsers never cache it.
    // index.html references hashed JS/CSS filenames that change every build.
    // If index.html is cached and we rebuild, users load dead asset references.
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(clientBuild, 'index.html'), (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        res.status(500).send('Error loading page');
      }
    });
  });
}

// Sentry error handler (captures exceptions before our own handler)
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Stage 1: Error handling with logging
app.use((err, req, res, next) => {
  logger.error('[ERROR]', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    message: 'Something went wrong!',
    error: isProd ? undefined : err.message
  });
});

const PORT = process.env.PORT || 5000;

connectDB();

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} [${isProd ? 'production' : 'development'}]`);
  console.log(`Server running on port ${PORT} [${isProd ? 'production' : 'development'}]`);

  // Launch Telegram bot
  const { createBot } = require('./bot/bot');
  const bot = createBot();
  if (bot) {
    bot.launch()
      .then(() => {
        console.log('Telegram bot launched');
        logger.info('Telegram bot launched');
      })
      .catch((err) => {
        console.error('Telegram bot launch failed:', err.message);
        logger.error('Telegram bot launch failed', { error: err.message });
      });

    // Graceful stop on shutdown
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  }
});

// Stage 1: Graceful shutdown with logging and Redis cleanup
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — graceful shutdown');
  console.log('SIGTERM received — graceful shutdown');

  // Close Redis connection
  try {
    await redis.quit();
    logger.info('Redis connection closed');
  } catch (err) {
    logger.error('Error closing Redis:', err);
  }

  server.close(() => {
    logger.info('HTTP server closed');
    console.log('HTTP server closed');
    process.exit(0);
  });
});
