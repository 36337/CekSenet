/**
 * Cariler Routes
 * Cari hesap (müşteri/tedarikçi) API endpoint'leri
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');

const Cariler = require('../models/cariler');
const logger = require('../utils/logger');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Tüm cari route'ları authentication gerektirir
router.use(authenticate);

/**
 * GET /api/cariler
 * Cari listesi (filtreleme ve sayfalama ile)
 * 
 * Query params:
 * - tip: 'musteri' | 'tedarikci' (opsiyonel)
 * - search: ad_soyad veya telefon araması (opsiyonel)
 * - page: sayfa numarası (default: 1)
 * - limit: sayfa başına kayıt (default: 20, max: 100)
 */
router.get('/',
  [
    query('tip')
      .optional()
      .isIn(['musteri', 'tedarikci']).withMessage('Geçersiz tip (musteri veya tedarikci olmalı)'),
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

      const { tip, search, page = 1, limit = 20 } = req.query;

      const result = Cariler.getAll({
        tip,
        search,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json(result);

    } catch (error) {
      logger.error('Get cariler error', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Cari listesi alınamadı'
      });
    }
  }
);

/**
 * GET /api/cariler/:id
 * Cari detayı (evrak istatistikleri ile)
 */
router.get('/:id',
  param('id').isInt({ min: 1 }).withMessage('Geçersiz cari ID'),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }

      const cari = Cariler.getWithStats(parseInt(req.params.id));

      if (!cari) {
        return res.status(404).json({
          error: 'Cari bulunamadı'
        });
      }

      res.json(cari);

    } catch (error) {
      logger.error('Get cari error', { error: error.message, cariId: req.params.id });
      res.status(500).json({
        error: 'Sunucu hatası'
      });
    }
  }
);

/**
 * POST /api/cariler
 * Yeni cari oluştur
 */
router.post('/',
  [
    body('ad_soyad')
      .trim()
      .notEmpty().withMessage('Ad soyad gerekli')
      .isLength({ min: 2, max: 200 }).withMessage('Ad soyad 2-200 karakter olmalı'),
    body('tip')
      .notEmpty().withMessage('Tip gerekli')
      .isIn(['musteri', 'tedarikci']).withMessage('Geçersiz tip (musteri veya tedarikci olmalı)'),
    body('telefon')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 50 }).withMessage('Telefon çok uzun'),
    body('email')
      .optional({ checkFalsy: true })
      .trim()
      .isEmail().withMessage('Geçersiz email formatı')
      .isLength({ max: 100 }).withMessage('Email çok uzun'),
    body('adres')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 500 }).withMessage('Adres çok uzun'),
    body('vergi_no')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 20 }).withMessage('Vergi no çok uzun'),
    body('notlar')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 1000 }).withMessage('Notlar çok uzun')
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

      const { ad_soyad, tip, telefon, email, adres, vergi_no, notlar } = req.body;

      const cari = Cariler.create({
        ad_soyad,
        tip,
        telefon,
        email,
        adres,
        vergi_no,
        notlar
      });

      logger.info('Cari created', {
        createdBy: req.user.id,
        cariId: cari.id,
        adSoyad: cari.ad_soyad,
        tip: cari.tip
      });

      res.status(201).json({
        message: 'Cari oluşturuldu',
        cari
      });

    } catch (error) {
      logger.error('Create cari error', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Cari oluşturulamadı'
      });
    }
  }
);

/**
 * PUT /api/cariler/:id
 * Cari güncelle
 */
router.put('/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('Geçersiz cari ID'),
    body('ad_soyad')
      .trim()
      .notEmpty().withMessage('Ad soyad gerekli')
      .isLength({ min: 2, max: 200 }).withMessage('Ad soyad 2-200 karakter olmalı'),
    body('tip')
      .notEmpty().withMessage('Tip gerekli')
      .isIn(['musteri', 'tedarikci']).withMessage('Geçersiz tip (musteri veya tedarikci olmalı)'),
    body('telefon')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 50 }).withMessage('Telefon çok uzun'),
    body('email')
      .optional({ checkFalsy: true })
      .trim()
      .isEmail().withMessage('Geçersiz email formatı')
      .isLength({ max: 100 }).withMessage('Email çok uzun'),
    body('adres')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 500 }).withMessage('Adres çok uzun'),
    body('vergi_no')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 20 }).withMessage('Vergi no çok uzun'),
    body('notlar')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 1000 }).withMessage('Notlar çok uzun')
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

      const cariId = parseInt(req.params.id);
      const { ad_soyad, tip, telefon, email, adres, vergi_no, notlar } = req.body;

      const cari = Cariler.update(cariId, {
        ad_soyad,
        tip,
        telefon,
        email,
        adres,
        vergi_no,
        notlar
      });

      if (!cari) {
        return res.status(404).json({
          error: 'Cari bulunamadı'
        });
      }

      logger.info('Cari updated', {
        updatedBy: req.user.id,
        cariId: cari.id,
        adSoyad: cari.ad_soyad
      });

      res.json({
        message: 'Cari güncellendi',
        cari
      });

    } catch (error) {
      logger.error('Update cari error', { error: error.message, cariId: req.params.id });
      res.status(500).json({
        error: 'Sunucu hatası'
      });
    }
  }
);

/**
 * DELETE /api/cariler/:id
 * Cari sil
 */
router.delete('/:id',
  param('id').isInt({ min: 1 }).withMessage('Geçersiz cari ID'),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }

      const cariId = parseInt(req.params.id);
      
      // Silmeden önce cari bilgisini al (log için)
      const existingCari = Cariler.getById(cariId);
      
      const result = Cariler.delete(cariId);

      if (!result.success) {
        // Cari bulunamadı veya bağlı evrak var
        const statusCode = result.evrakSayisi ? 400 : 404;
        return res.status(statusCode).json({
          error: result.message,
          evrakSayisi: result.evrakSayisi
        });
      }

      logger.info('Cari deleted', {
        deletedBy: req.user.id,
        cariId: cariId,
        adSoyad: existingCari?.ad_soyad
      });

      res.json({
        message: result.message
      });

    } catch (error) {
      logger.error('Delete cari error', { error: error.message, cariId: req.params.id });
      res.status(500).json({
        error: 'Sunucu hatası'
      });
    }
  }
);

/**
 * GET /api/cariler/:id/evraklar
 * Cariye ait evrakları listele
 * 
 * Query params:
 * - page: sayfa numarası (default: 1)
 * - limit: sayfa başına kayıt (default: 20, max: 100)
 */
router.get('/:id/evraklar',
  [
    param('id').isInt({ min: 1 }).withMessage('Geçersiz cari ID'),
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

      const cariId = parseInt(req.params.id);
      const { page = 1, limit = 20 } = req.query;

      const result = Cariler.getEvraklar(cariId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      if (!result) {
        return res.status(404).json({
          error: 'Cari bulunamadı'
        });
      }

      res.json(result);

    } catch (error) {
      logger.error('Get cari evraklar error', { error: error.message, cariId: req.params.id });
      res.status(500).json({
        error: 'Sunucu hatası'
      });
    }
  }
);

module.exports = router;
