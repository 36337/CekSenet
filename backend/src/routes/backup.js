/**
 * Backup Routes
 * Veritabanı yedekleme API endpoint'leri (Admin Only)
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');

const Backup = require('../models/backup');
const logger = require('../utils/logger');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Tüm backup route'ları authentication + admin yetkisi gerektirir
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/backup
 * Yedek listesi
 * 
 * Response: { backups: [...], stats: {...} }
 */
router.get('/', (req, res) => {
  try {
    const backups = Backup.list();
    const stats = Backup.getStats();

    res.json({
      backups,
      stats
    });

  } catch (error) {
    logger.error('Backup list error', { error: error.message });
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Yedek listesi alınamadı'
    });
  }
});

/**
 * GET /api/backup/stats
 * Yedekleme istatistikleri
 * 
 * Response: { backup_dir, total_backups, total_size_kb, total_size_mb }
 */
router.get('/stats', (req, res) => {
  try {
    const stats = Backup.getStats();
    res.json(stats);

  } catch (error) {
    logger.error('Backup stats error', { error: error.message });
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Yedekleme istatistikleri alınamadı'
    });
  }
});

/**
 * GET /api/backup/:filename
 * Yedek detayı
 * 
 * Response: { filename, created_at, size_kb, aciklama }
 */
router.get('/:filename',
  param('filename')
    .matches(/^ceksenet_[\d-_]+\.db$/).withMessage('Geçersiz dosya adı formatı'),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }

      const backup = Backup.getByFilename(req.params.filename);

      if (!backup) {
        return res.status(404).json({
          error: 'Yedek bulunamadı'
        });
      }

      res.json(backup);

    } catch (error) {
      logger.error('Backup detail error', { error: error.message, filename: req.params.filename });
      res.status(500).json({
        error: 'Sunucu hatası'
      });
    }
  }
);

/**
 * POST /api/backup
 * Yeni yedek oluştur
 * 
 * Body (opsiyonel):
 * - aciklama: Yedek açıklaması
 * 
 * Response: { success, filename, size, created_at, message }
 */
router.post('/',
  body('aciklama')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Açıklama en fazla 500 karakter olabilir'),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }

      const aciklama = req.body.aciklama || `Manuel yedek - ${req.user.ad_soyad}`;
      const result = Backup.create(aciklama);

      if (!result.success) {
        return res.status(500).json({
          error: result.message
        });
      }

      logger.info('Backup created via API', {
        userId: req.user.id,
        username: req.user.kullanici_adi,
        filename: result.filename
      });

      res.status(201).json(result);

    } catch (error) {
      logger.error('Backup create error', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Yedek oluşturulamadı'
      });
    }
  }
);

/**
 * POST /api/backup/:filename/restore
 * Yedekten geri yükle
 * 
 * ⚠️ DİKKAT: Bu işlem mevcut veritabanını tamamen değiştirir!
 * Uygulama yeniden başlatılmalıdır.
 * 
 * Response: { success, message, safety_backup, requires_restart }
 */
router.post('/:filename/restore',
  param('filename')
    .matches(/^ceksenet_[\d-_]+\.db$/).withMessage('Geçersiz dosya adı formatı'),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }

      const filename = req.params.filename;

      // Yedek var mı kontrol et
      const backup = Backup.getByFilename(filename);
      if (!backup) {
        return res.status(404).json({
          error: 'Yedek bulunamadı'
        });
      }

      logger.warn('Veritabanı geri yükleme başlatıldı', {
        userId: req.user.id,
        username: req.user.kullanici_adi,
        filename
      });

      const result = Backup.restore(filename);

      if (!result.success) {
        return res.status(500).json({
          error: result.message
        });
      }

      logger.info('Veritabanı geri yüklendi', {
        userId: req.user.id,
        username: req.user.kullanici_adi,
        restored_from: filename,
        safety_backup: result.safety_backup
      });

      res.json(result);

    } catch (error) {
      logger.error('Backup restore error', { error: error.message, filename: req.params.filename });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Geri yükleme başarısız'
      });
    }
  }
);

/**
 * DELETE /api/backup/:filename
 * Yedek sil
 * 
 * Response: { success, message }
 */
router.delete('/:filename',
  param('filename')
    .matches(/^ceksenet_[\d-_]+\.db$/).withMessage('Geçersiz dosya adı formatı'),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }

      const filename = req.params.filename;

      // Yedek var mı kontrol et
      const backup = Backup.getByFilename(filename);
      if (!backup) {
        return res.status(404).json({
          error: 'Yedek bulunamadı'
        });
      }

      const result = Backup.delete(filename);

      if (!result.success) {
        return res.status(500).json({
          error: result.message
        });
      }

      logger.info('Backup deleted', {
        userId: req.user.id,
        username: req.user.kullanici_adi,
        filename
      });

      res.json(result);

    } catch (error) {
      logger.error('Backup delete error', { error: error.message, filename: req.params.filename });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Yedek silinemedi'
      });
    }
  }
);

/**
 * POST /api/backup/cleanup
 * Eski yedekleri temizle
 * 
 * Body (opsiyonel):
 * - keep_count: Tutulacak yedek sayısı (default: 10, min: 1, max: 100)
 * 
 * Response: { success, deleted_count, message }
 */
router.post('/cleanup',
  body('keep_count')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Tutulacak yedek sayısı 1-100 arasında olmalı'),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }

      const keepCount = parseInt(req.body.keep_count) || 10;
      const result = Backup.cleanup(keepCount);

      if (!result.success) {
        return res.status(500).json({
          error: result.message
        });
      }

      if (result.deleted_count > 0) {
        logger.info('Backup cleanup completed', {
          userId: req.user.id,
          username: req.user.kullanici_adi,
          deleted_count: result.deleted_count,
          kept_count: keepCount
        });
      }

      res.json(result);

    } catch (error) {
      logger.error('Backup cleanup error', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Temizleme başarısız'
      });
    }
  }
);

module.exports = router;
