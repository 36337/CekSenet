/**
 * Evraklar Routes
 * Çek/Senet API endpoint'leri
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');

const Evraklar = require('../models/evraklar');
const logger = require('../utils/logger');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Tüm evrak route'ları authentication gerektirir
router.use(authenticate);

// ============================================
// VALIDATION KURALLARI (Reusable)
// ============================================

const evrakValidationRules = [
  body('evrak_tipi')
    .notEmpty().withMessage('Evrak tipi gerekli')
    .isIn(['cek', 'senet']).withMessage('Evrak tipi cek veya senet olmalı'),
  body('evrak_no')
    .trim()
    .notEmpty().withMessage('Evrak no gerekli')
    .isLength({ min: 1, max: 50 }).withMessage('Evrak no 1-50 karakter olmalı'),
  body('tutar')
    .notEmpty().withMessage('Tutar gerekli')
    .isFloat({ min: 0.01 }).withMessage('Tutar 0\'dan büyük olmalı'),
  body('vade_tarihi')
    .notEmpty().withMessage('Vade tarihi gerekli')
    .isISO8601().withMessage('Geçersiz tarih formatı (YYYY-MM-DD)'),
  body('banka_adi')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Banka adı çok uzun'),
  body('kesideci')
    .trim()
    .notEmpty().withMessage('Keşideci gerekli')
    .isLength({ min: 2, max: 200 }).withMessage('Keşideci 2-200 karakter olmalı'),
  body('cari_id')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('Geçersiz cari ID'),
  body('notlar')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Notlar çok uzun')
];

// ============================================
// ENDPOINT'LER
// ============================================

/**
 * GET /api/evraklar
 * Evrak listesi (gelişmiş filtreleme ve sayfalama)
 * 
 * Query params:
 * - durum: virgülle ayrılmış durumlar (portfoy,bankada,...)
 * - evrak_tipi: 'cek' | 'senet'
 * - vade_baslangic: YYYY-MM-DD
 * - vade_bitis: YYYY-MM-DD
 * - tutar_min: minimum tutar
 * - tutar_max: maximum tutar
 * - search: evrak_no veya kesideci araması
 * - cari_id: belirli cariye ait evraklar
 * - sort: vade_tarihi | tutar | created_at | evrak_no
 * - order: asc | desc
 * - page: sayfa numarası (default: 1)
 * - limit: sayfa başına kayıt (default: 20, max: 100)
 */
router.get('/',
  [
    query('durum')
      .optional()
      .trim(),
    query('evrak_tipi')
      .optional()
      .isIn(['cek', 'senet']).withMessage('Evrak tipi cek veya senet olmalı'),
    query('vade_baslangic')
      .optional()
      .isISO8601().withMessage('Geçersiz başlangıç tarihi formatı'),
    query('vade_bitis')
      .optional()
      .isISO8601().withMessage('Geçersiz bitiş tarihi formatı'),
    query('tutar_min')
      .optional()
      .isFloat({ min: 0 }).withMessage('Minimum tutar 0 veya üzeri olmalı'),
    query('tutar_max')
      .optional()
      .isFloat({ min: 0 }).withMessage('Maximum tutar 0 veya üzeri olmalı'),
    query('cari_id')
      .optional()
      .isInt({ min: 1 }).withMessage('Geçersiz cari ID'),
    query('sort')
      .optional()
      .isIn(['vade_tarihi', 'tutar', 'created_at', 'evrak_no']).withMessage('Geçersiz sıralama alanı'),
    query('order')
      .optional()
      .isIn(['asc', 'desc']).withMessage('Sıralama yönü asc veya desc olmalı'),
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Sayfa numarası pozitif tam sayı olmalı'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit 1-100 arasında olmalı')
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

      const {
        durum,
        evrak_tipi,
        vade_baslangic,
        vade_bitis,
        tutar_min,
        tutar_max,
        search,
        cari_id,
        sort = 'vade_tarihi',
        order = 'asc',
        page = 1,
        limit = 20
      } = req.query;

      const result = Evraklar.getAll({
        durum,
        evrak_tipi,
        vade_baslangic,
        vade_bitis,
        tutar_min,
        tutar_max,
        search,
        cari_id,
        sort,
        order,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json(result);

    } catch (error) {
      logger.error('Get evraklar error', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Evrak listesi alınamadı'
      });
    }
  }
);

/**
 * GET /api/evraklar/:id
 * Evrak detayı (cari bilgisi dahil)
 */
router.get('/:id',
  param('id').isInt({ min: 1 }).withMessage('Geçersiz evrak ID'),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }

      const evrak = Evraklar.getById(parseInt(req.params.id));

      if (!evrak) {
        return res.status(404).json({
          error: 'Evrak bulunamadı'
        });
      }

      res.json(evrak);

    } catch (error) {
      logger.error('Get evrak error', { error: error.message, evrakId: req.params.id });
      res.status(500).json({
        error: 'Sunucu hatası'
      });
    }
  }
);

/**
 * POST /api/evraklar
 * Yeni evrak oluştur
 */
router.post('/',
  [
    ...evrakValidationRules,
    body('durum')
      .optional()
      .isIn(Evraklar.GECERLI_DURUMLAR).withMessage('Geçersiz durum değeri')
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

      const {
        evrak_tipi,
        evrak_no,
        tutar,
        vade_tarihi,
        banka_adi,
        kesideci,
        cari_id,
        durum,
        notlar
      } = req.body;

      const evrak = Evraklar.create({
        evrak_tipi,
        evrak_no,
        tutar,
        vade_tarihi,
        banka_adi,
        kesideci,
        cari_id,
        durum,
        notlar
      }, req.user.id);

      logger.info('Evrak created', {
        createdBy: req.user.id,
        evrakId: evrak.id,
        evrakNo: evrak.evrak_no,
        evrakTipi: evrak.evrak_tipi,
        tutar: evrak.tutar
      });

      res.status(201).json({
        message: 'Evrak oluşturuldu',
        evrak
      });

    } catch (error) {
      logger.error('Create evrak error', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Evrak oluşturulamadı'
      });
    }
  }
);

/**
 * PUT /api/evraklar/:id
 * Evrak güncelle (durum hariç)
 */
router.put('/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('Geçersiz evrak ID'),
    ...evrakValidationRules
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

      const evrakId = parseInt(req.params.id);
      const {
        evrak_tipi,
        evrak_no,
        tutar,
        vade_tarihi,
        banka_adi,
        kesideci,
        cari_id,
        notlar
      } = req.body;

      const evrak = Evraklar.update(evrakId, {
        evrak_tipi,
        evrak_no,
        tutar,
        vade_tarihi,
        banka_adi,
        kesideci,
        cari_id,
        notlar
      }, req.user.id);

      if (!evrak) {
        return res.status(404).json({
          error: 'Evrak bulunamadı'
        });
      }

      logger.info('Evrak updated', {
        updatedBy: req.user.id,
        evrakId: evrak.id,
        evrakNo: evrak.evrak_no
      });

      res.json({
        message: 'Evrak güncellendi',
        evrak
      });

    } catch (error) {
      logger.error('Update evrak error', { error: error.message, evrakId: req.params.id });
      res.status(500).json({
        error: 'Sunucu hatası'
      });
    }
  }
);

/**
 * DELETE /api/evraklar/:id
 * Evrak sil (admin only)
 */
router.delete('/:id',
  requireAdmin,
  param('id').isInt({ min: 1 }).withMessage('Geçersiz evrak ID'),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }

      const evrakId = parseInt(req.params.id);

      // Silmeden önce evrak bilgisini al (log için)
      const existingEvrak = Evraklar.getById(evrakId);

      const result = Evraklar.delete(evrakId);

      if (!result.success) {
        return res.status(404).json({
          error: result.message
        });
      }

      logger.info('Evrak deleted', {
        deletedBy: req.user.id,
        evrakId: evrakId,
        evrakNo: existingEvrak?.evrak_no,
        tutar: existingEvrak?.tutar
      });

      res.json({
        message: result.message
      });

    } catch (error) {
      logger.error('Delete evrak error', { error: error.message, evrakId: req.params.id });
      res.status(500).json({
        error: 'Sunucu hatası'
      });
    }
  }
);

/**
 * PATCH /api/evraklar/:id/durum
 * Evrak durumunu güncelle (hareket kaydı ile)
 */
router.patch('/:id/durum',
  [
    param('id').isInt({ min: 1 }).withMessage('Geçersiz evrak ID'),
    body('durum')
      .notEmpty().withMessage('Durum gerekli')
      .isIn(Evraklar.GECERLI_DURUMLAR).withMessage('Geçersiz durum değeri'),
    body('aciklama')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 500 }).withMessage('Açıklama çok uzun')
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

      const evrakId = parseInt(req.params.id);
      const { durum, aciklama } = req.body;

      const result = Evraklar.updateDurum(evrakId, durum, aciklama, req.user.id);

      if (!result.success) {
        return res.status(400).json({
          error: result.message
        });
      }

      logger.info('Evrak durum updated', {
        updatedBy: req.user.id,
        evrakId: evrakId,
        eskiDurum: result.hareket.eski_durum,
        yeniDurum: result.hareket.yeni_durum,
        aciklama: aciklama
      });

      res.json({
        message: 'Evrak durumu güncellendi',
        evrak: result.evrak,
        hareket: result.hareket
      });

    } catch (error) {
      logger.error('Update evrak durum error', { error: error.message, evrakId: req.params.id });
      res.status(500).json({
        error: 'Sunucu hatası'
      });
    }
  }
);

/**
 * GET /api/evraklar/:id/hareketler
 * Evrak hareket geçmişi
 */
router.get('/:id/hareketler',
  param('id').isInt({ min: 1 }).withMessage('Geçersiz evrak ID'),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }

      const evrakId = parseInt(req.params.id);
      const result = Evraklar.getHareketler(evrakId);

      if (!result) {
        return res.status(404).json({
          error: 'Evrak bulunamadı'
        });
      }

      res.json(result);

    } catch (error) {
      logger.error('Get evrak hareketler error', { error: error.message, evrakId: req.params.id });
      res.status(500).json({
        error: 'Sunucu hatası'
      });
    }
  }
);

/**
 * POST /api/evraklar/toplu-durum
 * Toplu durum güncelleme
 */
router.post('/toplu-durum',
  [
    body('ids')
      .isArray({ min: 1 }).withMessage('En az bir evrak ID gerekli')
      .custom((ids) => ids.every(id => Number.isInteger(id) && id > 0))
      .withMessage('Geçersiz evrak ID listesi'),
    body('durum')
      .notEmpty().withMessage('Durum gerekli')
      .isIn(Evraklar.GECERLI_DURUMLAR).withMessage('Geçersiz durum değeri'),
    body('aciklama')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 500 }).withMessage('Açıklama çok uzun')
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

      const { ids, durum, aciklama } = req.body;

      const result = Evraklar.bulkUpdateDurum(ids, durum, aciklama, req.user.id);

      logger.info('Evraklar toplu durum updated', {
        updatedBy: req.user.id,
        requestedCount: ids.length,
        successCount: result.success,
        failedCount: result.failed.length,
        yeniDurum: durum
      });

      res.json({
        message: `${result.success} evrak güncellendi`,
        success: result.success,
        failed: result.failed
      });

    } catch (error) {
      logger.error('Toplu durum update error', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası'
      });
    }
  }
);

module.exports = router;
