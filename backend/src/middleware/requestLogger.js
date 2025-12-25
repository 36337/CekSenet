const logger = require('../utils/logger');

/**
 * HTTP request logging middleware
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  // Response bittiğinde logla
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };
    
    // Kullanıcı varsa ekle
    if (req.user) {
      logData.userId = req.user.id;
      logData.username = req.user.username;
    }
    
    // Status'a göre log level
    if (res.statusCode >= 500) {
      logger.error('HTTP Request', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });
  
  next();
}

module.exports = requestLogger;
