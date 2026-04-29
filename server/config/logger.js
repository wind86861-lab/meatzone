const winston = require('winston');
const path = require('path');

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// Custom format for file output (JSON)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'MeatZone-api' },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      format: fileFormat,
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      format: fileFormat,
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

// Stage 1: Action logging helper
const logAction = (action, details) => {
  logger.info(action, {
    type: 'action',
    timestamp: new Date().toISOString(),
    ...details,
  });
};

// Stage 1: Order logging helpers
const logOrderCreated = (order, userId) => {
  logAction('ORDER_CREATED', {
    orderId: order._id,
    userId,
    totalPrice: order.totalPrice,
    isPremiumOrder: order.isPremiumOrder,
    deepLinkToken: order.deepLinkToken,
  });
};

const logOrderPaid = (order, paymentMethod) => {
  logAction('ORDER_PAID', {
    orderId: order._id,
    paymentMethod,
    amount: order.totalPrice,
    paymentId: order.paymentId,
  });
};

const logOrderConfirmed = (order, adminId) => {
  logAction('ORDER_CONFIRMED', {
    orderId: order._id,
    adminId,
    deliveryTime: order.deliveryTime,
  });
};

const logLocationUpdated = (order, telegramId) => {
  logAction('LOCATION_UPDATED', {
    orderId: order._id,
    telegramId,
    latitude: order.latitude,
    longitude: order.longitude,
    district: order.district,
  });
};

const logPremiumGranted = (user, adminId, durationDays) => {
  logAction('PREMIUM_GRANTED', {
    userId: user._id,
    adminId,
    durationDays,
    expiresAt: user.premiumExpiresAt,
  });
};

module.exports = {
  logger,
  logAction,
  logOrderCreated,
  logOrderPaid,
  logOrderConfirmed,
  logLocationUpdated,
  logPremiumGranted,
};
