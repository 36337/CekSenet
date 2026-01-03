/**
 * Bankalar Routes
 * Banka API endpoint'leri
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');

const Bankalar = require('../models/bankalar');
const logger = require('../utils/logger');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Tüm banka route'ları authentication gerektirir
router.use(authenticate);

/**
 * GET /api/bankalar
 * Banka listesi
 * 
 * Query params:
 * - includeInactive: true ise pasif bankaları da dahil et (admin only)
 * - search: Banka adı araması (opsiyonel)
 */
router.get('/',
  [
    query('search')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Arama terimi çok uzun')
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

      const { search, includeInactive } = req.query;
      
      // Arama varsa search fonksiyonunu kullan
      if (search) {
        const bankalar = Bankalar.search(search);
        return res.json({ data: bankalar });
      }
      
      // includeInactive sadece admin için
      const showInactive = includeInactive === 'true' && req.user.role === 'admin';
      
      const bankalar = Bankalar.getAll({ includeInactive: showInactive });
      res.json({ data: bankalar });

    } catch (error) {
      logger.error('Get bankalar error', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Banka listesi alınamadı'
      });
    }
  }
);

/**
 * GET /api/bankalar/:id
 * Banka detayı
 */
router.get('/:id',
  param('id').isInt({ min: 1 }).withMessage('Geçersiz banka ID'),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }

      const banka = Bankalar.getById(parseInt(req.params.id));

      if (!banka) {
        return res.status(404).json({
          error: 'Banka bulunamadı'
        });
      }

      res.json(banka);

    } catch (error) {
      logger.error('Get banka error', { error: error.message, bankaId: req.params.id });
      res.status(500).json({
        error: 'Sunucu hatası'
      });
    }
  }
);

/**
 * POST /api/bankalar
 * Yeni banka oluştur (herkes ekleyebilir)
 */
router.post('/',
  [
    body('ad')
      .trim()
      .notEmpty().withMessage('Banka adı gerekli')
      .isLength({ min: 2, max: 100 }).withMessage('Banka adı 2-100 karakter olmalı')
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

      const { ad } = req.body;

      const banka = Bankalar.create({ ad });

      logger.info('Banka created', {
        createdBy: req.user.id,
        bankaId: banka.id,
        bankaAd: banka.ad
      });

      res.status(201).json({
        message: 'Banka oluşturuldu',
        banka
      });

    } catch (error) {
      logger.error('Create banka error', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Banka oluşturulamadı'
      });
    }
  }
);

/**
 * PUT /api/bankalar/:id
 * Banka güncelle (admin only)
 */
router.put('/:id',
  requireAdmin,
  [
    param('id').isInt({ min: 1 }).withMessage('Geçersiz banka ID'),
    body('ad')
      .trim()
      .notEmpty().withMessage('Banka adı gerekli')
      .isLength({ min: 2, max: 100 }).withMessage('Banka adı 2-100 karakter olmalı')
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

      const bankaId = parseInt(req.params.id);
      const { ad } = req.body;

      const banka = Bankalar.update(bankaId, { ad });

      if (!banka) {
        return res.status(404).json({
          error: 'Banka bulunamadı'
        });
      }

      logger.info('Banka updated', {
        updatedBy: req.user.id,
        bankaId: banka.id,
        bankaAd: banka.ad
      });

      res.json({
        message: 'Banka güncellendi',
        banka
      });

    } catch (error) {
      // Duplicate name error
      if (error.message.includes('zaten mevcut')) {
        return res.status(400).json({
          error: error.message
        });
      }
      
      logger.error('Update banka error', { error: error.message, bankaId: req.params.id });
      res.status(500).json({
        error: 'Sunucu hatası'
      });
    }
  }
);

/**
 * DELETE /api/bankalar/:id
 * Banka sil (admin only, soft delete if has evraklar)
 */
router.delete('/:id',
  requireAdmin,
  param('id').isInt({ min: 1 }).withMessage('Geçersiz banka ID'),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }

      const bankaId = parseInt(req.params.id);
      
      // Silmeden önce banka bilgisini al (log için)
      const existingBanka = Bankalar.getById(bankaId);
      
      const result = Bankalar.delete(bankaId);

      if (!result.success) {
        return res.status(404).json({
          error: result.message
        });
      }

      logger.info('Banka deleted', {
        deletedBy: req.user.id,
        bankaId: bankaId,
        bankaAd: existingBanka?.ad,
        softDelete: result.softDelete || false
      });

      res.json({
        message: result.message,
        softDelete: result.softDelete || false
      });

    } catch (error) {
      logger.error('Delete banka error', { error: error.message, bankaId: req.params.id });
      res.status(500).json({
        error: 'Sunucu hatası'
      });
    }
  }
);

module.exports = router;
