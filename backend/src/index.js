const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Config (loads env vars)
const config = require('./utils/config');

// Utils
const logger = require('./utils/logger');

// Middleware
const requestLogger = require('./middleware/requestLogger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Migration
const { runMigrations } = require('./migrate');

const app = express();

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
    version: '1.0.0',
    environment: config.env
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
    app.listen(config.server.port, () => {
      logger.info(`Server started on port ${config.server.port}`);
      console.log(`
╔═══════════════════════════════════════════╗
║         ÇekSenet Backend API              ║
╠═══════════════════════════════════════════╣
║  Status:  Running                         ║
║  Port:    ${config.server.port}                            ║
║  Mode:    ${config.env.padEnd(25)}║
║  Health:  http://localhost:${config.server.port}/api/health ║
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
