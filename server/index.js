const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config({ path: path.join(__dirname, '.env') });

const isProd = process.env.NODE_ENV === 'production';

const app = express();

// CRITICAL: trust nginx reverse proxy so express-rate-limit reads real IPs
app.set('trust proxy', 1);

// Global process-level guards — prevent Node.js crash on unhandled errors
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception — keeping process alive:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Promise Rejection — keeping process alive:', reason);
});

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "blob:", "https:"],
      "frame-src": ["'self'", "https://www.google.com", "https://maps.google.com", "https://maps.googleapis.com"],
      "script-src": ["'self'", "'unsafe-inline'", "https://maps.googleapis.com", "https://maps.gstatic.com"],
      "script-src-elem": ["'self'", "'unsafe-inline'", "https://maps.googleapis.com", "https://maps.gstatic.com"],
      "connect-src": ["'self'", "https://maps.googleapis.com", "https://maps.gstatic.com", "https://*.googleapis.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://maps.googleapis.com"],
      "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
      "worker-src": ["'self'", "blob:"],
    },
  },
}));

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
app.use('/api/users', apiLimiter, require('./routes/users'));
app.use('/api/notifications', apiLimiter, require('./routes/notifications'));
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'PneuMax API is running' });
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

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    message: 'Something went wrong!',
    error: isProd ? undefined : err.message
  });
});

const PORT = process.env.PORT || 5000;
const { initBot } = require('./bot/index');
const mongoose = require('mongoose');

connectDB();

// Start bot after MongoDB connects
if (mongoose.connection.readyState === 1) {
  initBot();
} else {
  mongoose.connection.once('connected', () => {
    initBot();
  });
}

// Fallback: if bot hasn't started within 10s, try anyway
setTimeout(() => {
  if (mongoose.connection.readyState === 1) {
    initBot();
  }
}, 10000);

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${isProd ? 'production' : 'development'}]`);
});

// Graceful shutdown — let PM2 restart cleanly without dropping in-flight requests
process.on('SIGTERM', () => {
  console.log('SIGTERM received — graceful shutdown');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
