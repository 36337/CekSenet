const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Utils
const logger = require('./utils/logger');

// Config
const config = require('../config/default.json');

// Middleware
const requestLogger = require('./middleware/requestLogger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Migration
const { runMigrations } = require('./migrate');

const app = express();
const PORT = process.env.PORT || config.server.port;

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Startup
async function start() {
  try {
    // Migration'ları çalıştır
    runMigrations();
    
    // Server'ı başlat
    app.listen(PORT, () => {
      logger.info(`Server started on port ${PORT}`);
      console.log(`
╔═══════════════════════════════════════════╗
║         ÇekSenet Backend API              ║
╠═══════════════════════════════════════════╣
║  Status:  Running                         ║
║  Port:    ${PORT}                            ║
║  Mode:    ${process.env.NODE_ENV || 'development'}                     ║
║  Health:  http://localhost:${PORT}/api/health ║
╚═══════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

start();

module.exports = app;
