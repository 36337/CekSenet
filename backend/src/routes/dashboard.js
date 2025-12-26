/**
 * Dashboard Routes
 * Dashboard istatistikleri ve özet bilgiler API endpoint'leri
 */

const express = require('express');
const { query, validationResult } = require('express-validator');

const Dashboard = require('../models/dashboard');
const logger = require('../utils/logger');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Tüm dashboard route'ları authentication gerektirir
router.use(authenticate);

/**
 * GET /api/dashboard
 * Ana dashboard istatistikleri
 * 
 * Response:
 * - portfoy, bankada, ciro, tahsil, karsiliksiz: { adet, tutar }
 * - toplam: { adet, tutar }
 * - vade: { bugun, buHafta, gecikmis, buAy }
 * - tipDagilimi: [{ evrak_tipi, adet, tutar }]
 */
router.get('/', (req, res) => {
  try {
    const ozet = Dashboard.getOzet();
    
    res.json(ozet);
    
  } catch (error) {
    logger.error('Dashboard ozet error', { error: error.message });
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Dashboard istatistikleri alınamadı'
    });
  }
});

/**
 * GET /api/dashboard/kartlar
 * Dashboard özet kartları (önceden formatlanmış)
 * 
 * Response: [{ id, baslik, adet, tutar, renk, ikon }]
 */
router.get('/kartlar', (req, res) => {
  try {
    const kartlar = Dashboard.getKartlar();
    
    res.json(kartlar);
    
  } catch (error) {
    logger.error('Dashboard kartlar error', { error: error.message });
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Dashboard kartları alınamadı'
    });
  }
});

/**
 * GET /api/dashboard/durum-dagilimi
 * Durum bazlı dağılım (pie chart için)
 * 
 * Response: [{ durum, label, adet, tutar, renk }]
 */
router.get('/durum-dagilimi', (req, res) => {
  try {
    const dagilim = Dashboard.getDurumDagilimi();
    
    res.json(dagilim);
    
  } catch (error) {
    logger.error('Dashboard durum dagilimi error', { error: error.message });
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Durum dağılımı alınamadı'
    });
  }
});

/**
 * GET /api/dashboard/aylik-dagilim
 * Aylık vade dağılımı (bar chart için)
 * 
 * Query params:
 * - ay_sayisi: Kaç ay gösterilsin (default: 12, max: 24)
 * 
 * Response: [{ ay, ayLabel, adet, tutar }]
 */
router.get('/aylik-dagilim',
  query('ay_sayisi')
    .optional()
    .isInt({ min: 1, max: 24 }).withMessage('Ay sayısı 1-24 arasında olmalı'),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }
      
      const aySayisi = parseInt(req.query.ay_sayisi) || 12;
      const dagilim = Dashboard.getAylikVadeDagilimi(aySayisi);
      
      res.json(dagilim);
      
    } catch (error) {
      logger.error('Dashboard aylik dagilim error', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Aylık dağılım alınamadı'
      });
    }
  }
);

/**
 * GET /api/dashboard/son-hareketler
 * Son evrak hareketleri
 * 
 * Query params:
 * - limit: Kaç hareket getirilsin (default: 10, max: 50)
 * 
 * Response: [{ id, evrak_id, evrak_no, evrak_tipi, tutar, eski_durum, yeni_durum, ... }]
 */
router.get('/son-hareketler',
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit 1-50 arasında olmalı'),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }
      
      const limit = parseInt(req.query.limit) || 10;
      const hareketler = Dashboard.getSonHareketler(limit);
      
      res.json(hareketler);
      
    } catch (error) {
      logger.error('Dashboard son hareketler error', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Son hareketler alınamadı'
      });
    }
  }
);

/**
 * GET /api/dashboard/vade-uyarilari
 * Detaylı vade uyarıları
 * 
 * Response: {
 *   bugun: [evrak listesi],
 *   buHafta: [evrak listesi],
 *   gecikmis: [evrak listesi],
 *   ozet: { bugun: {adet, tutar}, buHafta: {adet, tutar}, gecikmis: {adet, tutar} }
 * }
 */
router.get('/vade-uyarilari', (req, res) => {
  try {
    const uyarilar = Dashboard.getVadeUyarilari();
    
    res.json(uyarilar);
    
  } catch (error) {
    logger.error('Dashboard vade uyarilari error', { error: error.message });
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'Vade uyarıları alınamadı'
    });
  }
});

/**
 * GET /api/dashboard/top-cariler
 * En çok evrakı olan cariler
 * 
 * Query params:
 * - limit: Kaç cari getirilsin (default: 10, max: 50)
 * 
 * Response: [{ id, ad_soyad, tip, evrak_adet, toplam_tutar, aktif_evrak_adet, aktif_tutar, karsiliksiz_adet }]
 */
router.get('/top-cariler',
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit 1-50 arasında olmalı'),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation hatası',
          details: errors.array()
        });
      }
      
      const limit = parseInt(req.query.limit) || 10;
      const cariler = Dashboard.getTopCariler(limit);
      
      res.json(cariler);
      
    } catch (error) {
      logger.error('Dashboard top cariler error', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Top cariler alınamadı'
      });
    }
  }
);

module.exports = router;
