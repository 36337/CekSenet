const jwt = require('jsonwebtoken');
const config = require('../utils/config');
const logger = require('../utils/logger');
const db = require('../models/db');

/**
 * JWT Token doğrulama middleware
 * Authorization: Bearer <token> header'ı gerektirir
 */
function authenticate(req, res, next) {
  try {
    // Header'dan token al
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Yetkilendirme gerekli',
        message: 'Authorization header eksik'
      });
    }
    
    // Bearer token formatını kontrol et
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: 'Geçersiz token formatı',
        message: 'Authorization header "Bearer <token>" formatında olmalı'
      });
    }
    
    const token = parts[1];
    
    // Token'ı doğrula
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Kullanıcının hala var olduğunu kontrol et
    const user = db.prepare(`
      SELECT id, username, ad_soyad, role, last_login 
      FROM users 
      WHERE id = ?
    `).get(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        error: 'Geçersiz token',
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    // Kullanıcı bilgisini request'e ekle
    req.user = user;
    
    next();
  } catch (error) {
    // JWT hataları
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token süresi dolmuş',
        message: 'Lütfen tekrar giriş yapın'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Geçersiz token',
        message: error.message
      });
    }
    
    // Beklenmeyen hata
    logger.error('Auth middleware error', { error: error.message });
    return res.status(500).json({
      error: 'Kimlik doğrulama hatası'
    });
  }
}

/**
 * Admin rolü kontrolü middleware
 * authenticate middleware'inden sonra kullanılmalı
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Yetkilendirme gerekli'
    });
  }
  
  if (req.user.role !== 'admin') {
    logger.warn('Unauthorized admin access attempt', {
      userId: req.user.id,
      username: req.user.username,
      path: req.path
    });
    
    return res.status(403).json({
      error: 'Yetkisiz erişim',
      message: 'Bu işlem için admin yetkisi gerekli'
    });
  }
  
  next();
}

/**
 * Opsiyonel authentication
 * Token varsa doğrula, yoksa devam et
 * Bazı endpoint'ler için kullanışlı (örn: public + authenticated içerik)
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return next();
  }
  
  // Token varsa doğrulamayı dene
  authenticate(req, res, next);
}

module.exports = {
  authenticate,
  requireAdmin,
  optionalAuth
};
