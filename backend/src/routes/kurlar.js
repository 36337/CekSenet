/**
 * Kurlar Routes
 * Döviz kuru API endpoint'leri
 */

const express = require('express');
const { query, validationResult } = require('express-validator');

const tcmb = require('../utils/tcmb');
const logger = require('../utils/logger');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Tüm kur route'ları authentication gerektirir
router.use(authenticate);

/**
 * GET /api/kurlar
 * Güncel döviz kurlarını getir
 * 
 * Query params:
 * - refresh: true ise cache'i yoksay ve yeniden çek
 * 
 * Response:
 * {
 *   kurlar: { TRY: 1, USD: 32.50, EUR: 35.20, GBP: 41.30, CHF: 37.80, tarih: "03.01.2026" },
 *   cached: boolean,
 *   updated_at: "2026-01-03T12:00:00.000Z",
 *   cache_expires_at: "2026-01-03T13:00:00.000Z",
 *   error?: string (opsiyonel, hata durumunda)
 * }
 */
router.get('/',
  [
    query('refresh')
      .optional()
      .isBoolean().withMessage('refresh parametresi boolean olmalı')
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

      const forceRefresh = req.query.refresh === 'true';
      
      const result = await tcmb.getKurlar(forceRefresh);
      
      // Kurlar tamamen alınamadıysa uyar
      if (result.unavailable) {
        return res.status(503).json({
          error: 'Döviz kurları şu anda alınamıyor',
          message: result.error,
          kurlar: result.kurlar
        });
      }
      
      res.json(result);

    } catch (error) {
      logger.error('Get kurlar error', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Döviz kurları alınamadı'
      });
    }
  }
);

/**
 * GET /api/kurlar/:paraBirimi
 * Tek bir para birimi için kur getir
 * 
 * Response:
 * {
 *   paraBirimi: "USD",
 *   kur: 32.50,
 *   tarih: "03.01.2026"
 * }
 */
router.get('/:paraBirimi',
  async (req, res) => {
    try {
      const paraBirimi = req.params.paraBirimi.toUpperCase();
      
      // Geçerli para birimi mi kontrol et
      const validCurrencies = ['TRY', ...tcmb.SUPPORTED_CURRENCIES];
      if (!validCurrencies.includes(paraBirimi)) {
        return res.status(400).json({
          error: 'Geçersiz para birimi',
          message: `Desteklenen para birimleri: ${validCurrencies.join(', ')}`
        });
      }
      
      // TRY için her zaman 1 döndür
      if (paraBirimi === 'TRY') {
        return res.json({
          paraBirimi: 'TRY',
          kur: 1,
          tarih: new Date().toLocaleDateString('tr-TR')
        });
      }
      
      const result = await tcmb.getKurlar();
      const kur = result.kurlar[paraBirimi];
      
      if (!kur) {
        return res.status(404).json({
          error: 'Kur bulunamadı',
          message: `${paraBirimi} kuru şu anda mevcut değil`
        });
      }
      
      res.json({
        paraBirimi,
        kur,
        tarih: result.kurlar.tarih,
        cached: result.cached,
        updated_at: result.updated_at
      });

    } catch (error) {
      logger.error('Get kur error', { error: error.message, paraBirimi: req.params.paraBirimi });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Döviz kuru alınamadı'
      });
    }
  }
);

/**
 * GET /api/kurlar/status/cache
 * Cache durumunu getir (debug/admin için)
 */
router.get('/status/cache',
  (req, res) => {
    try {
      const status = tcmb.getCacheStatus();
      res.json(status);
    } catch (error) {
      logger.error('Get cache status error', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası'
      });
    }
  }
);

module.exports = router;
