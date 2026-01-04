const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Config (loads env vars)
const config = require('./utils/config');

// Utils
const logger = require('./utils/logger');
const scheduler = require('./utils/scheduler');

// Middleware
const requestLogger = require('./middleware/requestLogger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const carilerRoutes = require('./routes/cariler');
const evraklarRoutes = require('./routes/evraklar');
const dashboardRoutes = require('./routes/dashboard');
const raporlarRoutes = require('./routes/raporlar');
const backupRoutes = require('./routes/backup');
const settingsRoutes = require('./routes/settings');
const systemRoutes = require('./routes/system');
const bankalarRoutes = require('./routes/bankalar');
const kurlarRoutes = require('./routes/kurlar');
const importRoutes = require('./routes/import');
const kredilerRoutes = require('./routes/krediler');

// Migration & Seed
const { runMigrations } = require('./migrate');
const { seedAdmin } = require('./seed');

const app = express();

// Frontend build path (production'da kullanılacak)
const frontendBuildPath = path.join(__dirname, '../../frontend/dist');

// Security middleware
// Production'da CSP ayarlarını gevşet (inline script'ler için)
app.use(helmet({
  contentSecurityPolicy: config.isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
    }
  } : false // Development'ta CSP kapalı
}));

// CORS - Production'da sadece kendi origin'e izin ver
app.use(cors({
  origin: config.isProduction ? false : true, // Production'da CORS gerekmez (aynı origin)
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// General API rate limiting
app.use('/api', apiLimiter);

// Health check endpoint (rate limit dışında)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: config.env
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cariler', carilerRoutes);
app.use('/api/evraklar', evraklarRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/raporlar', raporlarRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/bankalar', bankalarRoutes);
app.use('/api/kurlar', kurlarRoutes);
app.use('/api/import', importRoutes);
app.use('/api/krediler', kredilerRoutes);

// ============================================
// UPLOADS: Static File Serving (Fotoğraflar)
// ============================================
// Evrak fotoğrafları için static file serving
// URL: /uploads/evraklar/{evrak_id}/{dosya_adi}
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath, {
  // Güvenlik ayarları
  dotfiles: 'deny',           // .htaccess gibi gizli dosyaları engelle
  index: false,               // Dizin listesini gösterme
  maxAge: '1d',               // Cache süresi (1 gün)
  etag: true,                 // ETag desteği
  lastModified: true,         // Last-Modified header
  // MIME type ayarları
  setHeaders: (res, filePath) => {
    // Sadece resim dosyalarına izin ver
    const ext = path.extname(filePath).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    
    if (!allowedExtensions.includes(ext)) {
      // İzin verilmeyen dosya tipi
      res.status(403);
      return;
    }
    
    // Cache-Control header
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 gün
  }
}));

// ============================================
// PRODUCTION: Static File Serving
// ============================================

if (config.isProduction) {
  // Frontend static dosyalarını serve et
  app.use(express.static(frontendBuildPath));
  
  // SPA Fallback: API olmayan tüm istekleri index.html'e yönlendir
  // Express 5'te '*' wildcard çalışmıyor, middleware kullanıyoruz
  app.use((req, res, next) => {
    // API istekleri için 404 handler'a devam et
    if (req.path.startsWith('/api')) {
      return next();
    }
    // Uploads istekleri için static handler'a bırak
    if (req.path.startsWith('/uploads')) {
      return next();
    }
    // Static dosya istekleri için (zaten serve edildi, bulunamazsa 404)
    if (req.method !== 'GET') {
      return next();
    }
    // Diğer tüm GET istekleri index.html'e yönlendir (React Router için)
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// 404 handler (API routes için)
app.use(notFoundHandler);

// Error handler (en son)
app.use(errorHandler);

// Startup
async function start() {
  try {
    // Migration'ları çalıştır
    runMigrations();
    
    // İlk admin kullanıcıyı oluştur (yoksa)
    await seedAdmin();
    
    // Server'ı başlat - Production'da farklı port kullan
    const port = config.isProduction ? config.server.productionPort : config.server.port;
    
    app.listen(port, '0.0.0.0', () => {
      logger.info(`Server started on port ${port} in ${config.env} mode`);
      
      // Production'da scheduler'ı başlat (otomatik yedekleme)
      if (config.isProduction) {
        scheduler.startScheduler();
      }
      
      if (config.isProduction) {
        console.log(`
╔═══════════════════════════════════════════════╗
║           ÇekSenet - Production               ║
╠═══════════════════════════════════════════════╣
║  Status:  Running                             ║
║  Port:    ${String(port).padEnd(36)}║
║  Mode:    production                          ║
║  URL:     http://localhost:${port}              ║
╚═══════════════════════════════════════════════╝
        `);
      } else {
        console.log(`
╔═══════════════════════════════════════════════╗
║           ÇekSenet Backend API                ║
╠═══════════════════════════════════════════════╣
║  Status:  Running                             ║
║  Port:    ${String(port).padEnd(36)}║
║  Mode:    development                         ║
║  Health:  http://localhost:${port}/api/health   ║
╚═══════════════════════════════════════════════╝
        `);
      }
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received. Shutting down gracefully...');
  scheduler.stopScheduler();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received. Shutting down gracefully...');
  scheduler.stopScheduler();
  process.exit(0);
});

module.exports = app;
