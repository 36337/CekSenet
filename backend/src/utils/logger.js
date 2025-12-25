const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Config
const config = require('../../config/default.json');

// Log dizini
const logDir = path.resolve(__dirname, '../../logs');

// Log formatı
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}] ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

// Console formatı (renkli)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} ${level}: ${message}`;
  })
);

// Daily rotate transport - Genel loglar
const dailyRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: `${config.logging.maxFiles}d`, // 30 gün
  level: config.logging.level
});

// Daily rotate transport - Sadece hatalar
const errorRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: `${config.logging.maxFiles}d`,
  level: 'error'
});

// Logger oluştur
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports: [
    dailyRotateTransport,
    errorRotateTransport
  ],
  // Uncaught exception ve rejection handling
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: `${config.logging.maxFiles}d`
    })
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: `${config.logging.maxFiles}d`
    })
  ]
});

// Development'ta console'a da yaz
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Log rotasyonu event'leri
dailyRotateTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info(`Log rotated: ${oldFilename} -> ${newFilename}`);
});

module.exports = logger;
