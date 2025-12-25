const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

// Config yükle
const config = require('../config/default.json');

const app = express();
const PORT = process.env.PORT || config.server.port;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Server başlat
app.listen(PORT, () => {
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

module.exports = app;
