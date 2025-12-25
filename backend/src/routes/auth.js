const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const db = require('../models/db');
const config = require('../utils/config');
const logger = require('../utils/logger');
const { authenticate } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * POST /api/auth/login
 * Kullanıcı girişi
 */
router.post('/login',
  loginLimiter,
  [
    body('username')
      .trim()
      .notEmpty().withMessage('Kullanıcı adı gerekli'),
    body('password')
      .notEmpty().withMessage('Şifre gerekli')
  ],
  async (req, res) => {
    try {
      // Validation kontrolü
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }

      const { username, password } = req.body;

      // Kullanıcıyı bul
      const user = db.prepare(`
        SELECT id, username, password, ad_soyad, role 
        FROM users 
        WHERE username = ?
      `).get(username);

      if (!user) {
        logger.warn('Login failed - user not found', { username });
        return res.status(401).json({
          error: 'Giriş başarısız',
          message: 'Hatalı kullanıcı adı veya şifre'
        });
      }

      // Şifre kontrolü
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        logger.warn('Login failed - wrong password', { username });
        return res.status(401).json({
          error: 'Giriş başarısız',
          message: 'Hatalı kullanıcı adı veya şifre'
        });
      }

      // JWT token oluştur
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // last_login güncelle
      const now = new Date().toISOString();
      db.prepare(`
        UPDATE users SET last_login = ? WHERE id = ?
      `).run(now, user.id);

      logger.info('User logged in', { userId: user.id, username: user.username });

      // Response
      res.json({
        message: 'Giriş başarılı',
        token,
        user: {
          id: user.id,
          username: user.username,
          ad_soyad: user.ad_soyad,
          role: user.role
        }
      });

    } catch (error) {
      logger.error('Login error', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Giriş işlemi sırasında bir hata oluştu'
      });
    }
  }
);

/**
 * POST /api/auth/logout
 * Kullanıcı çıkışı (client-side token silme)
 * Bu endpoint sadece loglama için kullanılır
 */
router.post('/logout', authenticate, (req, res) => {
  logger.info('User logged out', { 
    userId: req.user.id, 
    username: req.user.username 
  });

  res.json({
    message: 'Çıkış başarılı'
  });
});

/**
 * GET /api/auth/me
 * Mevcut kullanıcı bilgisi
 */
router.get('/me', authenticate, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    ad_soyad: req.user.ad_soyad,
    role: req.user.role,
    last_login: req.user.last_login
  });
});

/**
 * PUT /api/auth/password
 * Kendi şifresini değiştirme
 */
router.put('/password',
  authenticate,
  [
    body('currentPassword')
      .notEmpty().withMessage('Mevcut şifre gerekli'),
    body('newPassword')
      .isLength({ min: 6 }).withMessage('Yeni şifre en az 6 karakter olmalı'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Şifreler eşleşmiyor');
        }
        return true;
      })
  ],
  async (req, res) => {
    try {
      // Validation kontrolü
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;

      // Mevcut kullanıcının şifresini al
      const user = db.prepare(`
        SELECT password FROM users WHERE id = ?
      `).get(req.user.id);

      // Mevcut şifre kontrolü
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);

      if (!isValidPassword) {
        return res.status(400).json({
          error: 'Şifre değiştirilemedi',
          message: 'Mevcut şifre hatalı'
        });
      }

      // Yeni şifreyi hashle
      const hashedPassword = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);

      // Şifreyi güncelle
      db.prepare(`
        UPDATE users SET password = ? WHERE id = ?
      `).run(hashedPassword, req.user.id);

      logger.info('User changed password', { 
        userId: req.user.id, 
        username: req.user.username 
      });

      res.json({
        message: 'Şifre başarıyla değiştirildi'
      });

    } catch (error) {
      logger.error('Password change error', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Şifre değiştirme işlemi sırasında bir hata oluştu'
      });
    }
  }
);

module.exports = router;
