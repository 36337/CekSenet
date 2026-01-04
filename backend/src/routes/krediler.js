/**
 * Krediler Routes
 * Kredi takip API endpoint'leri
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');

const Krediler = require('../models/krediler');
const KrediTaksitler = require('../models/krediTaksitler');
const logger = require('../utils/logger');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Tüm kredi route'ları authentication gerektirir
router.use(authenticate);

// ============================================
// VALIDATION KURALLARI
// ============================================

const krediValidationRules = [
  body('banka_id')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('Geçersiz banka ID'),
  body('kredi_turu')
    .notEmpty().withMessage('Kredi türü gerekli')
    .isIn(Krediler.KREDI_TURLERI).withMessage(`Kredi türü ${Krediler.KREDI_TURLERI.join(', ')} olmalı`),
  body('anapara')
    .notEmpty().withMessage('Anapara gerekli')
    .isFloat({ min: 0.01 }).withMessage('Anapara 0\'dan büyük olmalı'),
  body('faiz_orani')
    .notEmpty().withMessage('Faiz oranı gerekli')
    .isFloat({ min: 0, max: 200 }).withMessage('Faiz oranı 0-200 arasında olmalı'),
  body('vade_ay')
    .notEmpty().withMessage('Vade süresi gerekli')
    .isInt({ min: 1, max: 360 }).withMessage('Vade süresi 1-360 ay arasında olmalı'),
  body('baslangic_tarihi')
    .notEmpty().withMessage('Başlangıç tarihi gerekli')
    .isISO8601().withMessage('Geçersiz tarih formatı (YYYY-MM-DD)'),
  body('para_birimi')
    .optional({ checkFalsy: true })
    .isIn(Krediler.PARA_BIRIMLERI).withMessage(`Para birimi ${Krediler.PARA_BIRIMLERI.join(', ')} olmalı`),
  body('notlar')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Notlar çok uzun')
];

const krediUpdateValidationRules = [
  body('banka_id')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('Geçersiz banka ID'),
  body('notlar')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Notlar çok uzun')
];

// ============================================
// KREDİ ENDPOINT'LERİ
// ============================================

/**
 * GET /api/krediler
 * Kredi listesi (filtreleme ve sayfalama)
 * 
 * Query params:
 * - durum: 'aktif' | 'kapandi' | 'erken_kapandi'
 * - kredi_turu: kredi türü
 * - banka_id: banka filtresi
 * - sort: baslangic_tarihi | anapara | created_at | aylik_taksit
 * - order: asc | desc
 * - page: sayfa numarası (default: 1)
 * - limit: sayfa başına kayıt (default: 20, max: 100)
 */
router.get('/',
  [
    query('durum')
      .optional()
      .isIn(Krediler.KREDI_DURUMLARI).withMessage('Geçersiz durum'),
    query('kredi_turu')
      .optional()
      .isIn(Krediler.KREDI_TURLERI).withMessage('Geçersiz kredi türü'),
    query('banka_id')
      .optional()
      .isInt({ min: 1 }).withMessage('Geçersiz banka ID'),
    query('sort')
      .optional()
      .isIn(['baslangic_tarihi', 'anapara', 'created_at', 'aylik_taksit']).withMessage('Geçersiz sıralama alanı'),
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
        kredi_turu,
        banka_id,
        sort = 'baslangic_tarihi',
        order = 'desc',
        page = 1,
        limit = 20
      } = req.query;

      const result = Krediler.getAll({
        durum,
        kredi_turu,
        banka_id,
        sort,
        order,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json(result);

    } catch (error) {
      logger.error('Get krediler error', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Kredi listesi alınamadı'
      });
    }
  }
);

/**
 * GET /api/krediler/ozet
 * Kredi genel özeti (Dashboard için)
 */
router.get('/ozet', (req, res) => {
  try {
    const ozet = Krediler.getGenelOzet();
    const gecikmeOzeti = KrediTaksitler.getGecikmeOzeti();

    res.json({
      ...ozet,
      gecikme: gecikmeOzeti
    });

  } catch (error) {
    logger.error('Get kredi ozet error', { error: error.message });
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Kredi özeti alınamadı'
    });
  }
});

/**
 * GET /api/krediler/taksitler/bu-ay
 * Bu ay ödenecek taksitler
 */
router.get('/taksitler/bu-ay', (req, res) => {
  try {
    const taksitler = KrediTaksitler.getBuAyOdenecek();

    res.json({
      ay: new Date().toISOString().slice(0, 7), // YYYY-MM
      toplam_adet: taksitler.length,
      toplam_tutar: taksitler.reduce((sum, t) => sum + t.tutar, 0),
      taksitler
    });

  } catch (error) {
    logger.error('Get bu ay taksitler error', { error: error.message });
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Taksitler alınamadı'
    });
  }
});

/**
 * GET /api/krediler/taksitler/geciken
 * Geciken taksitler listesi
 */
router.get('/taksitler/geciken', (req, res) => {
  try {
    const taksitler = KrediTaksitler.getGeciken();
    const ozet = KrediTaksitler.getGecikmeOzeti();

    res.json({
      ozet,
      taksitler
    });

  } catch (error) {
    logger.error('Get geciken taksitler error', { error: error.message });
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Geciken taksitler alınamadı'
    });
  }
});

/**
 * GET /api/krediler/taksitler/yaklasan
 * Yaklaşan taksitler (opsiyonel: ?gun=7)
 */
router.get('/taksitler/yaklasan',
  query('gun').optional().isInt({ min: 1, max: 90 }).withMessage('Gün sayısı 1-90 arası olmalı'),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }

      const gunSayisi = parseInt(req.query.gun) || 7;
      const taksitler = KrediTaksitler.getYaklasan(gunSayisi);

      res.json({
        gun_sayisi: gunSayisi,
        toplam_adet: taksitler.length,
        toplam_tutar: taksitler.reduce((sum, t) => sum + t.tutar, 0),
        taksitler
      });

    } catch (error) {
      logger.error('Get yaklasan taksitler error', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Yaklaşan taksitler alınamadı'
      });
    }
  }
);

/**
 * GET /api/krediler/:id
 * Kredi detayı (taksitlerle birlikte)
 */
router.get('/:id',
  param('id').isInt({ min: 1 }).withMessage('Geçersiz kredi ID'),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }

      const kredi = Krediler.getById(parseInt(req.params.id));

      if (!kredi) {
        return res.status(404).json({
          error: 'Kredi bulunamadı'
        });
      }

      res.json(kredi);

    } catch (error) {
      logger.error('Get kredi error', { error: error.message, krediId: req.params.id });
      res.status(500).json({
        error: 'Sunucu hatası'
      });
    }
  }
);

/**
 * POST /api/krediler
 * Yeni kredi oluştur (taksitler otomatik oluşturulur)
 */
router.post('/',
  krediValidationRules,
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
        banka_id,
        kredi_turu,
        anapara,
        faiz_orani,
        vade_ay,
        baslangic_tarihi,
        para_birimi,
        notlar
      } = req.body;

      const kredi = Krediler.create({
        banka_id,
        kredi_turu,
        anapara,
        faiz_orani,
        vade_ay,
        baslangic_tarihi,
        para_birimi,
        notlar
      }, req.user.id);

      logger.info('Kredi created', {
        createdBy: req.user.id,
        krediId: kredi.id,
        krediTuru: kredi.kredi_turu,
        anapara: kredi.anapara,
        vadeAy: kredi.vade_ay,
        taksitSayisi: kredi.taksitler.length
      });

      res.status(201).json({
        message: 'Kredi oluşturuldu',
        kredi
      });

    } catch (error) {
      logger.error('Create kredi error', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Kredi oluşturulamadı'
      });
    }
  }
);

/**
 * PUT /api/krediler/:id
 * Kredi güncelle (sadece notlar ve banka)
 */
router.put('/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('Geçersiz kredi ID'),
    ...krediUpdateValidationRules
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

      const krediId = parseInt(req.params.id);
      const { banka_id, notlar } = req.body;

      const kredi = Krediler.update(krediId, { banka_id, notlar }, req.user.id);

      if (!kredi) {
        return res.status(404).json({
          error: 'Kredi bulunamadı'
        });
      }

      logger.info('Kredi updated', {
        updatedBy: req.user.id,
        krediId: kredi.id
      });

      res.json({
        message: 'Kredi güncellendi',
        kredi
      });

    } catch (error) {
      logger.error('Update kredi error', { error: error.message, krediId: req.params.id });
      res.status(500).json({
        error: 'Sunucu hatası'
      });
    }
  }
);

/**
 * DELETE /api/krediler/:id
 * Kredi sil (admin only, sadece ödemesiz krediler)
 */
router.delete('/:id',
  requireAdmin,
  param('id').isInt({ min: 1 }).withMessage('Geçersiz kredi ID'),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }

      const krediId = parseInt(req.params.id);

      // Silmeden önce kredi bilgisini al (log için)
      const existingKredi = Krediler.getById(krediId);

      const result = Krediler.delete(krediId);

      if (!result.success) {
        return res.status(400).json({
          error: result.message
        });
      }

      logger.info('Kredi deleted', {
        deletedBy: req.user.id,
        krediId: krediId,
        krediTuru: existingKredi?.kredi_turu,
        anapara: existingKredi?.anapara
      });

      res.json({
        message: result.message
      });

    } catch (error) {
      logger.error('Delete kredi error', { error: error.message, krediId: req.params.id });
      res.status(500).json({
        error: 'Sunucu hatası'
      });
    }
  }
);

// ============================================
// TAKSİT ENDPOINT'LERİ
// ============================================

/**
 * GET /api/krediler/:id/taksitler
 * Krediye ait taksit listesi
 */
router.get('/:id/taksitler',
  param('id').isInt({ min: 1 }).withMessage('Geçersiz kredi ID'),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }

      const krediId = parseInt(req.params.id);

      // Kredi var mı kontrol et
      const kredi = Krediler.getById(krediId);
      if (!kredi) {
        return res.status(404).json({
          error: 'Kredi bulunamadı'
        });
      }

      const taksitler = KrediTaksitler.getByKrediId(krediId);

      res.json({
        kredi_id: krediId,
        toplam: taksitler.length,
        ozet: kredi.ozet,
        taksitler
      });

    } catch (error) {
      logger.error('Get kredi taksitler error', { error: error.message, krediId: req.params.id });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Taksitler alınamadı'
      });
    }
  }
);

/**
 * PATCH /api/krediler/:id/taksitler/:taksitId/ode
 * Tek taksit öde
 */
router.patch('/:id/taksitler/:taksitId/ode',
  [
    param('id').isInt({ min: 1 }).withMessage('Geçersiz kredi ID'),
    param('taksitId').isInt({ min: 1 }).withMessage('Geçersiz taksit ID'),
    body('odeme_tarihi')
      .optional()
      .isISO8601().withMessage('Geçersiz tarih formatı (YYYY-MM-DD)'),
    body('odenen_tutar')
      .optional()
      .isFloat({ min: 0.01 }).withMessage('Ödenen tutar 0\'dan büyük olmalı'),
    body('notlar')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 500 }).withMessage('Notlar çok uzun')
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

      const krediId = parseInt(req.params.id);
      const taksitId = parseInt(req.params.taksitId);

      // Taksit bu krediye ait mi kontrol et
      const taksit = KrediTaksitler.getById(taksitId);
      if (!taksit) {
        return res.status(404).json({
          error: 'Taksit bulunamadı'
        });
      }

      if (taksit.kredi_id !== krediId) {
        return res.status(400).json({
          error: 'Bu taksit belirtilen krediye ait değil'
        });
      }

      const { odeme_tarihi, odenen_tutar, notlar } = req.body;

      const result = KrediTaksitler.odemeYap(taksitId, {
        odeme_tarihi,
        odenen_tutar,
        notlar
      });

      if (!result.success) {
        return res.status(400).json({
          error: result.message
        });
      }

      logger.info('Taksit odendi', {
        paidBy: req.user.id,
        krediId,
        taksitId,
        taksitNo: result.taksit.taksit_no,
        odenenTutar: result.taksit.odenen_tutar
      });

      // Güncel kredi bilgisini de döndür
      const guncelKredi = Krediler.getById(krediId);

      res.json({
        message: result.message,
        taksit: result.taksit,
        kredi_durumu: guncelKredi.durum,
        ozet: guncelKredi.ozet
      });

    } catch (error) {
      logger.error('Taksit odeme error', { 
        error: error.message, 
        krediId: req.params.id,
        taksitId: req.params.taksitId 
      });
      res.status(500).json({
        error: 'Sunucu hatası'
      });
    }
  }
);

/**
 * PATCH /api/krediler/:id/taksitler/:taksitId/iptal
 * Taksit ödemesini iptal et
 */
router.patch('/:id/taksitler/:taksitId/iptal',
  [
    param('id').isInt({ min: 1 }).withMessage('Geçersiz kredi ID'),
    param('taksitId').isInt({ min: 1 }).withMessage('Geçersiz taksit ID')
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

      const krediId = parseInt(req.params.id);
      const taksitId = parseInt(req.params.taksitId);

      // Taksit bu krediye ait mi kontrol et
      const taksit = KrediTaksitler.getById(taksitId);
      if (!taksit) {
        return res.status(404).json({
          error: 'Taksit bulunamadı'
        });
      }

      if (taksit.kredi_id !== krediId) {
        return res.status(400).json({
          error: 'Bu taksit belirtilen krediye ait değil'
        });
      }

      const result = KrediTaksitler.odemeIptal(taksitId);

      if (!result.success) {
        return res.status(400).json({
          error: result.message
        });
      }

      logger.info('Taksit odeme iptal edildi', {
        cancelledBy: req.user.id,
        krediId,
        taksitId,
        taksitNo: result.taksit.taksit_no
      });

      // Güncel kredi bilgisini de döndür
      const guncelKredi = Krediler.getById(krediId);

      res.json({
        message: result.message,
        taksit: result.taksit,
        kredi_durumu: guncelKredi.durum,
        ozet: guncelKredi.ozet
      });

    } catch (error) {
      logger.error('Taksit iptal error', { 
        error: error.message, 
        krediId: req.params.id,
        taksitId: req.params.taksitId 
      });
      res.status(500).json({
        error: 'Sunucu hatası'
      });
    }
  }
);

/**
 * POST /api/krediler/:id/erken-odeme
 * Erken ödeme (kalan tüm taksitleri öde ve krediyi kapat)
 */
router.post('/:id/erken-odeme',
  [
    param('id').isInt({ min: 1 }).withMessage('Geçersiz kredi ID'),
    body('odeme_tarihi')
      .optional()
      .isISO8601().withMessage('Geçersiz tarih formatı (YYYY-MM-DD)'),
    body('notlar')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 500 }).withMessage('Notlar çok uzun')
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

      const krediId = parseInt(req.params.id);
      const { odeme_tarihi, notlar } = req.body;

      const result = KrediTaksitler.erkenOdeme(krediId, {
        odeme_tarihi,
        notlar: notlar || 'Erken ödeme'
      });

      if (!result.success) {
        return res.status(400).json({
          error: result.message
        });
      }

      logger.info('Erken odeme yapildi', {
        paidBy: req.user.id,
        krediId,
        odenenTaksitSayisi: result.odenen_taksit_sayisi,
        odenenTutar: result.odenen_tutar
      });

      // Güncel kredi bilgisini de döndür
      const guncelKredi = Krediler.getById(krediId);

      res.json({
        message: result.message,
        odenen_taksit_sayisi: result.odenen_taksit_sayisi,
        odenen_tutar: result.odenen_tutar,
        kredi: guncelKredi
      });

    } catch (error) {
      logger.error('Erken odeme error', { error: error.message, krediId: req.params.id });
      res.status(500).json({
        error: 'Sunucu hatası'
      });
    }
  }
);

module.exports = router;
