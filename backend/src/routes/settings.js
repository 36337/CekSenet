/**
 * Settings Routes
 * Uygulama ayarları ve ilk kurulum API endpoint'leri
 */

const express = require('express');
const { body, validationResult } = require('express-validator');

const Settings = require('../models/settings');
const logger = require('../utils/logger');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ============================================
// PUBLIC ENDPOINTS (Auth gerektirmez)
// ============================================

/**
 * GET /api/settings/setup-status
 * İlk kurulum durumunu kontrol et
 * Bu endpoint authentication gerektirmez (kurulum öncesi erişim için)
 * 
 * Response: { setup_completed, has_admin, user_count, app_version, db_created_at }
 */
router.get('/setup-status', (req, res) => {
  try {
    const status = Settings.getSetupStatus();
    res.json(status);

  } catch (error) {
    logger.error('Setup status error', { error: error.message });
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Kurulum durumu alınamadı'
    });
  }
});

/**
 * POST /api/settings/setup
 * İlk kurulumu gerçekleştir (admin kullanıcı oluştur)
 * Bu endpoint authentication gerektirmez (kurulum için)
 * Sadece kurulum tamamlanmamışsa çalışır
 * 
 * Body:
 * - username: Kullanıcı adı (zorunlu)
 * - password: Şifre (zorunlu, min 6 karakter)
 * - ad_soyad: Ad Soyad (zorunlu)
 * - company_name: Şirket adı (opsiyonel)
 * 
 * Response: { success, message, user? }
 */
router.post('/setup',
  [
    body('username')
      .trim()
      .notEmpty().withMessage('Kullanıcı adı gerekli')
      .isLength({ min: 3, max: 50 }).withMessage('Kullanıcı adı 3-50 karakter olmalı')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir'),
    body('password')
      .notEmpty().withMessage('Şifre gerekli')
      .isLength({ min: 6, max: 100 }).withMessage('Şifre en az 6 karakter olmalı'),
    body('ad_soyad')
      .trim()
      .notEmpty().withMessage('Ad soyad gerekli')
      .isLength({ min: 2, max: 100 }).withMessage('Ad soyad 2-100 karakter olmalı'),
    body('company_name')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Şirket adı en fazla 200 karakter olabilir')
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

      // Kurulum zaten yapılmış mı kontrol et
      const status = Settings.getSetupStatus();
      if (status.setup_completed) {
        return res.status(400).json({
          error: 'Kurulum zaten tamamlanmış',
          message: 'Yeni kullanıcı eklemek için admin panelini kullanın'
        });
      }

      const { username, password, ad_soyad, company_name } = req.body;

      const result = Settings.performSetup({
        username,
        password,
        ad_soyad,
        company_name
      });

      if (!result.success) {
        return res.status(400).json({
          error: result.message
        });
      }

      logger.info('Initial setup completed via API', {
        username,
        ad_soyad
      });

      res.status(201).json(result);

    } catch (error) {
      logger.error('Setup error', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Kurulum başarısız'
      });
    }
  }
);

/**
 * GET /api/settings/app-info
 * Uygulama bilgileri (public)
 * 
 * Response: { version, db_created_at, company_name }
 */
router.get('/app-info', (req, res) => {
  try {
    const info = Settings.getAppInfo();
    res.json(info);

  } catch (error) {
    logger.error('App info error', { error: error.message });
    res.status(500).json({
      error: 'Sunucu hatası'
    });
  }
});

// ============================================
// AUTHENTICATED ENDPOINTS
// ============================================

/**
 * GET /api/settings
 * Tüm ayarları getir
 * Normal kullanıcılar sadece düzenlenebilir ayarları görür
 * Admin kullanıcılar tüm ayarları görür
 * 
 * Query params:
 * - include_system: Sistem ayarlarını dahil et (sadece admin)
 * 
 * Response: { key: { value, description, editable }, ... }
 */
router.get('/', authenticate, (req, res) => {
  try {
    // Admin ise sistem ayarlarını da göster
    const includeSystem = req.user.role === 'admin' && req.query.include_system === 'true';
    const settings = Settings.getAll(includeSystem);

    res.json(settings);

  } catch (error) {
    logger.error('Get settings error', { error: error.message });
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Ayarlar alınamadı'
    });
  }
});

/**
 * PUT /api/settings
 * Ayarları güncelle (Admin only)
 * 
 * Body: { key: value, ... }
 * 
 * Response: { success, updated, errors }
 */
router.put('/', authenticate, requireAdmin,
  body()
    .isObject().withMessage('Body bir obje olmalı'),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }

      const settings = req.body;

      // Boş obje kontrolü
      if (Object.keys(settings).length === 0) {
        return res.status(400).json({
          error: 'Güncellenecek ayar yok'
        });
      }

      const result = Settings.updateMultiple(settings);

      if (result.updated.length > 0) {
        logger.info('Settings updated', {
          userId: req.user.id,
          username: req.user.username,
          updated: result.updated
        });
      }

      if (!result.success) {
        return res.status(400).json({
          error: 'Bazı ayarlar güncellenemedi',
          updated: result.updated,
          errors: result.errors
        });
      }

      res.json({
        message: 'Ayarlar güncellendi',
        updated: result.updated
      });

    } catch (error) {
      logger.error('Update settings error', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Ayarlar güncellenemedi'
      });
    }
  }
);

/**
 * GET /api/settings/:key
 * Tek bir ayar değeri getir
 * 
 * Response: { key, value, description, editable }
 */
router.get('/:key', authenticate, (req, res) => {
  try {
    const key = req.params.key;
    const value = Settings.get(key);

    if (value === null) {
      return res.status(404).json({
        error: 'Ayar bulunamadı'
      });
    }

    // Meta bilgisi
    const meta = Settings.DEFAULT_SETTINGS[key] || { description: '', editable: true };

    // Sistem ayarlarına sadece admin erişebilir
    if (!meta.editable && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Bu ayara erişim yetkiniz yok'
      });
    }

    res.json({
      key,
      value,
      description: meta.description,
      editable: meta.editable
    });

  } catch (error) {
    logger.error('Get setting error', { error: error.message, key: req.params.key });
    res.status(500).json({
      error: 'Sunucu hatası'
    });
  }
});

/**
 * PUT /api/settings/:key
 * Tek bir ayar değeri güncelle (Admin only)
 * 
 * Body: { value: "..." }
 * 
 * Response: { success, key, value }
 */
router.put('/:key', authenticate, requireAdmin,
  body('value')
    .exists().withMessage('Value gerekli'),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }

      const key = req.params.key;
      const { value } = req.body;

      // Düzenlenemez ayar kontrolü
      const meta = Settings.DEFAULT_SETTINGS[key];
      if (meta && !meta.editable) {
        return res.status(403).json({
          error: 'Bu ayar düzenlenemez'
        });
      }

      const success = Settings.set(key, String(value));

      if (!success) {
        return res.status(500).json({
          error: 'Ayar kaydedilemedi'
        });
      }

      logger.info('Setting updated', {
        userId: req.user.id,
        username: req.user.username,
        key
      });

      res.json({
        success: true,
        key,
        value: String(value)
      });

    } catch (error) {
      logger.error('Update setting error', { error: error.message, key: req.params.key });
      res.status(500).json({
        error: 'Sunucu hatası'
      });
    }
  }
);

module.exports = router;
