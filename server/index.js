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

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "frame-src": ["'self'", "https://www.google.com"],
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
app.use(morgan(isProd ? 'combined' : 'dev'));

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'PneuMax API is running' });
});

// Serve built React client in production
if (isProd) {
  const clientBuild = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: isProd ? undefined : err.message
  });
});

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${isProd ? 'production' : 'development'}]`);
});
