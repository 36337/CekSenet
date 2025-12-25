const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Login endpoint için rate limiter
 * 15 dakikada maksimum 5 başarısız deneme
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 5, // Maksimum deneme sayısı
  message: {
    error: 'Çok fazla giriş denemesi',
    message: 'Lütfen 15 dakika sonra tekrar deneyin'
  },
  standardHeaders: true, // RateLimit-* headers
  legacyHeaders: false, // X-RateLimit-* headers (eski)
  
  // Başarısız denemeleri logla
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      username: req.body?.username || 'unknown'
    });
    res.status(options.statusCode).json(options.message);
  }
});

/**
 * Genel API rate limiter
 * Dakikada maksimum 100 istek
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 100, // Maksimum istek sayısı
  message: {
    error: 'Çok fazla istek',
    message: 'Lütfen biraz bekleyin'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  loginLimiter,
  apiLimiter
};
