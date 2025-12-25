const express = require('express');
const bcrypt = require('bcryptjs');
const { body, param, validationResult } = require('express-validator');

const db = require('../models/db');
const config = require('../utils/config');
const logger = require('../utils/logger');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Tüm user route'ları admin yetkisi gerektirir
router.use(authenticate, requireAdmin);

/**
 * GET /api/users
 * Kullanıcı listesi
 */
router.get('/', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, username, ad_soyad, role, created_at, last_login
      FROM users
      ORDER BY created_at DESC
    `).all();

    res.json({
      count: users.length,
      users
    });

  } catch (error) {
    logger.error('Get users error', { error: error.message });
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Kullanıcı listesi alınamadı'
    });
  }
});

/**
 * GET /api/users/:id
 * Kullanıcı detayı
 */
router.get('/:id',
  param('id').isInt().withMessage('Geçersiz kullanıcı ID'),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }

      const user = db.prepare(`
        SELECT id, username, ad_soyad, role, created_at, last_login
        FROM users
        WHERE id = ?
      `).get(req.params.id);

      if (!user) {
        return res.status(404).json({
          error: 'Kullanıcı bulunamadı'
        });
      }

      res.json(user);

    } catch (error) {
      logger.error('Get user error', { error: error.message, userId: req.params.id });
      res.status(500).json({
        error: 'Sunucu hatası'
      });
    }
  }
);

/**
 * POST /api/users
 * Yeni kullanıcı oluştur
 */
router.post('/',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 }).withMessage('Kullanıcı adı 3-50 karakter olmalı')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir'),
    body('password')
      .isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalı'),
    body('ad_soyad')
      .trim()
      .notEmpty().withMessage('Ad soyad gerekli')
      .isLength({ max: 100 }).withMessage('Ad soyad çok uzun'),
    body('role')
      .isIn(['admin', 'normal']).withMessage('Geçersiz rol (admin veya normal olmalı)')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }

      const { username, password, ad_soyad, role } = req.body;

      // Username unique kontrolü
      const existing = db.prepare(`
        SELECT id FROM users WHERE username = ?
      `).get(username);

      if (existing) {
        return res.status(400).json({
          error: 'Kullanıcı adı kullanımda',
          message: 'Bu kullanıcı adı zaten mevcut'
        });
      }

      // Şifreyi hashle
      const hashedPassword = await bcrypt.hash(password, config.bcrypt.saltRounds);

      // Kullanıcı oluştur
      const result = db.prepare(`
        INSERT INTO users (username, password, ad_soyad, role)
        VALUES (?, ?, ?, ?)
      `).run(username, hashedPassword, ad_soyad, role);

      logger.info('User created', {
        createdBy: req.user.id,
        newUserId: result.lastInsertRowid,
        username
      });

      res.status(201).json({
        message: 'Kullanıcı oluşturuldu',
        user: {
          id: result.lastInsertRowid,
          username,
          ad_soyad,
          role
        }
      });

    } catch (error) {
      logger.error('Create user error', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Kullanıcı oluşturulamadı'
      });
    }
  }
);

/**
 * PUT /api/users/:id
 * Kullanıcı güncelle (şifre hariç)
 */
router.put('/:id',
  [
    param('id').isInt().withMessage('Geçersiz kullanıcı ID'),
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 50 }).withMessage('Kullanıcı adı 3-50 karakter olmalı')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir'),
    body('ad_soyad')
      .optional()
      .trim()
      .notEmpty().withMessage('Ad soyad boş olamaz')
      .isLength({ max: 100 }).withMessage('Ad soyad çok uzun'),
    body('role')
      .optional()
      .isIn(['admin', 'normal']).withMessage('Geçersiz rol')
  ],
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }

      const userId = parseInt(req.params.id);
      const { username, ad_soyad, role } = req.body;

      // Kullanıcı var mı kontrol et
      const user = db.prepare(`SELECT id FROM users WHERE id = ?`).get(userId);

      if (!user) {
        return res.status(404).json({
          error: 'Kullanıcı bulunamadı'
        });
      }

      // Kendini admin'den düşürmeye çalışıyorsa engelle
      if (userId === req.user.id && role && role !== 'admin') {
        return res.status(400).json({
          error: 'İşlem engellendi',
          message: 'Kendi admin yetkinizi kaldıramazsınız'
        });
      }

      // Username değişiyorsa unique kontrolü
      if (username) {
        const existing = db.prepare(`
          SELECT id FROM users WHERE username = ? AND id != ?
        `).get(username, userId);

        if (existing) {
          return res.status(400).json({
            error: 'Kullanıcı adı kullanımda',
            message: 'Bu kullanıcı adı zaten mevcut'
          });
        }
      }

      // Dinamik güncelleme
      const updates = [];
      const params = [];

      if (username) {
        updates.push('username = ?');
        params.push(username);
      }
      if (ad_soyad) {
        updates.push('ad_soyad = ?');
        params.push(ad_soyad);
      }
      if (role) {
        updates.push('role = ?');
        params.push(role);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          error: 'Güncelleme verisi yok',
          message: 'En az bir alan güncellenmelidir'
        });
      }

      params.push(userId);

      db.prepare(`
        UPDATE users SET ${updates.join(', ')} WHERE id = ?
      `).run(...params);

      logger.info('User updated', {
        updatedBy: req.user.id,
        targetUserId: userId,
        changes: { username, ad_soyad, role }
      });

      // Güncel kullanıcı bilgisini dön
      const updatedUser = db.prepare(`
        SELECT id, username, ad_soyad, role, created_at, last_login
        FROM users WHERE id = ?
      `).get(userId);

      res.json({
        message: 'Kullanıcı güncellendi',
        user: updatedUser
      });

    } catch (error) {
      logger.error('Update user error', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası'
      });
    }
  }
);

/**
 * PUT /api/users/:id/password
 * Admin tarafından şifre sıfırlama
 */
router.put('/:id/password',
  [
    param('id').isInt().withMessage('Geçersiz kullanıcı ID'),
    body('newPassword')
      .isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalı')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }

      const userId = parseInt(req.params.id);
      const { newPassword } = req.body;

      // Kullanıcı var mı kontrol et
      const user = db.prepare(`SELECT id, username FROM users WHERE id = ?`).get(userId);

      if (!user) {
        return res.status(404).json({
          error: 'Kullanıcı bulunamadı'
        });
      }

      // Şifreyi hashle
      const hashedPassword = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);

      // Şifreyi güncelle
      db.prepare(`
        UPDATE users SET password = ? WHERE id = ?
      `).run(hashedPassword, userId);

      logger.info('User password reset by admin', {
        adminId: req.user.id,
        targetUserId: userId,
        targetUsername: user.username
      });

      res.json({
        message: 'Şifre sıfırlandı'
      });

    } catch (error) {
      logger.error('Reset password error', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası'
      });
    }
  }
);

/**
 * DELETE /api/users/:id
 * Kullanıcı sil
 */
router.delete('/:id',
  param('id').isInt().withMessage('Geçersiz kullanıcı ID'),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }

      const userId = parseInt(req.params.id);

      // Kendini silmeye çalışıyorsa engelle
      if (userId === req.user.id) {
        return res.status(400).json({
          error: 'İşlem engellendi',
          message: 'Kendinizi silemezsiniz'
        });
      }

      // Kullanıcı var mı kontrol et
      const user = db.prepare(`SELECT id, username FROM users WHERE id = ?`).get(userId);

      if (!user) {
        return res.status(404).json({
          error: 'Kullanıcı bulunamadı'
        });
      }

      // Kullanıcıyı sil
      db.prepare(`DELETE FROM users WHERE id = ?`).run(userId);

      logger.info('User deleted', {
        deletedBy: req.user.id,
        deletedUserId: userId,
        deletedUsername: user.username
      });

      res.json({
        message: 'Kullanıcı silindi'
      });

    } catch (error) {
      logger.error('Delete user error', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası'
      });
    }
  }
);

module.exports = router;
