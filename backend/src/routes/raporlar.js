/**
 * Raporlar Routes
 * Rapor API endpoint'leri ve Excel export
 */

const express = require('express');
const { query, param, validationResult } = require('express-validator');

const Raporlar = require('../models/raporlar');
const logger = require('../utils/logger');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Tüm rapor route'ları authentication gerektirir
router.use(authenticate);

/**
 * GET /api/raporlar/tarih-araligi
 * Tarih aralığı bazlı evrak raporu
 * 
 * Query params:
 * - baslangic: Başlangıç tarihi (YYYY-MM-DD, zorunlu)
 * - bitis: Bitiş tarihi (YYYY-MM-DD, zorunlu)
 * - tarih_tipi: 'vade' | 'kayit' (opsiyonel, default: vade)
 * - durum: Virgülle ayrılmış durumlar (opsiyonel)
 * - evrak_tipi: 'cek' | 'senet' (opsiyonel)
 * 
 * Response: { filtreler, ozet, detay }
 */
router.get('/tarih-araligi',
  [
    query('baslangic')
      .notEmpty().withMessage('Başlangıç tarihi gerekli')
      .isISO8601().withMessage('Geçersiz başlangıç tarihi formatı (YYYY-MM-DD)'),
    query('bitis')
      .notEmpty().withMessage('Bitiş tarihi gerekli')
      .isISO8601().withMessage('Geçersiz bitiş tarihi formatı (YYYY-MM-DD)'),
    query('tarih_tipi')
      .optional()
      .isIn(['vade', 'kayit']).withMessage('Tarih tipi "vade" veya "kayit" olmalı'),
    query('evrak_tipi')
      .optional()
      .isIn(['cek', 'senet']).withMessage('Evrak tipi "cek" veya "senet" olmalı')
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

      const { baslangic, bitis, tarih_tipi, durum, evrak_tipi } = req.query;

      // Tarih kontrolü: başlangıç <= bitiş
      if (new Date(baslangic) > new Date(bitis)) {
        return res.status(400).json({
          error: 'Başlangıç tarihi bitiş tarihinden büyük olamaz'
        });
      }

      const rapor = Raporlar.tarihAraligiRaporu({
        baslangic,
        bitis,
        tarih_tipi,
        durum,
        evrak_tipi
      });

      logger.info('Tarih aralığı raporu oluşturuldu', {
        userId: req.user.id,
        baslangic,
        bitis,
        kayitSayisi: rapor.detay.length
      });

      res.json(rapor);

    } catch (error) {
      logger.error('Tarih aralığı raporu hatası', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Rapor oluşturulamadı'
      });
    }
  }
);

/**
 * GET /api/raporlar/vade
 * Vade raporu (önümüzdeki X gün)
 * 
 * Query params:
 * - gun: Kaç gün sonrasına kadar (default: 30, max: 365)
 * - gecikmis_dahil: Gecikmiş evrakları dahil et (default: true)
 * 
 * Response: { filtreler, ozet, gunluk, detay }
 */
router.get('/vade',
  [
    query('gun')
      .optional()
      .isInt({ min: 1, max: 365 }).withMessage('Gün 1-365 arasında olmalı'),
    query('gecikmis_dahil')
      .optional()
      .isBoolean().withMessage('gecikmis_dahil boolean olmalı')
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

      const gun = parseInt(req.query.gun) || 30;
      const gecikmisDahil = req.query.gecikmis_dahil !== 'false';

      const rapor = Raporlar.vadeRaporu(gun, gecikmisDahil);

      res.json(rapor);

    } catch (error) {
      logger.error('Vade raporu hatası', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Vade raporu oluşturulamadı'
      });
    }
  }
);

/**
 * GET /api/raporlar/cari/:id
 * Cari bazlı rapor
 * 
 * Response: { cari, ozet, detay }
 */
router.get('/cari/:id',
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
      const rapor = Raporlar.cariRaporu(cariId);

      if (!rapor) {
        return res.status(404).json({
          error: 'Cari bulunamadı'
        });
      }

      res.json(rapor);

    } catch (error) {
      logger.error('Cari raporu hatası', { error: error.message, cariId: req.params.id });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Cari raporu oluşturulamadı'
      });
    }
  }
);

/**
 * GET /api/raporlar/cariler
 * Tüm cariler özet raporu
 * 
 * Query params:
 * - tip: 'musteri' | 'tedarikci' (opsiyonel)
 * - siralama: 'tutar' | 'adet' | 'ad' (default: tutar)
 * 
 * Response: { filtreler, ozet, cariler }
 */
router.get('/cariler',
  [
    query('tip')
      .optional()
      .isIn(['musteri', 'tedarikci']).withMessage('Tip "musteri" veya "tedarikci" olmalı'),
    query('siralama')
      .optional()
      .isIn(['tutar', 'adet', 'ad']).withMessage('Sıralama "tutar", "adet" veya "ad" olmalı')
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

      const { tip, siralama } = req.query;
      const rapor = Raporlar.tumCarilerRaporu({ tip, siralama });

      res.json(rapor);

    } catch (error) {
      logger.error('Cariler raporu hatası', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Cariler raporu oluşturulamadı'
      });
    }
  }
);

/**
 * GET /api/raporlar/excel
 * Excel dosyası olarak export
 * 
 * Query params:
 * - baslangic: Başlangıç tarihi (YYYY-MM-DD, zorunlu)
 * - bitis: Bitiş tarihi (YYYY-MM-DD, zorunlu)
 * - tarih_tipi: 'vade' | 'kayit' (opsiyonel, default: vade)
 * - durum: Virgülle ayrılmış durumlar (opsiyonel)
 * - evrak_tipi: 'cek' | 'senet' (opsiyonel)
 * 
 * Response: Excel dosyası (.xlsx)
 */
router.get('/excel',
  [
    query('baslangic')
      .notEmpty().withMessage('Başlangıç tarihi gerekli')
      .isISO8601().withMessage('Geçersiz başlangıç tarihi formatı (YYYY-MM-DD)'),
    query('bitis')
      .notEmpty().withMessage('Bitiş tarihi gerekli')
      .isISO8601().withMessage('Geçersiz bitiş tarihi formatı (YYYY-MM-DD)')
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

      const { baslangic, bitis, tarih_tipi, durum, evrak_tipi } = req.query;

      // Tarih kontrolü
      if (new Date(baslangic) > new Date(bitis)) {
        return res.status(400).json({
          error: 'Başlangıç tarihi bitiş tarihinden büyük olamaz'
        });
      }

      // ExcelJS kütüphanesi
      let ExcelJS;
      try {
        ExcelJS = require('exceljs');
      } catch (e) {
        logger.error('ExcelJS kütüphanesi bulunamadı');
        return res.status(500).json({
          error: 'Excel export özelliği kullanılamıyor',
          message: 'ExcelJS kütüphanesi kurulu değil'
        });
      }

      // Veri hazırla
      const veri = Raporlar.excelVerisiHazirla({
        baslangic,
        bitis,
        tarih_tipi,
        durum,
        evrak_tipi
      });

      if (veri.length === 0) {
        return res.status(404).json({
          error: 'Veri bulunamadı',
          message: 'Seçilen kriterlere uygun evrak yok'
        });
      }

      // Excel workbook oluştur
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'ÇekSenet Takip Sistemi';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Evraklar', {
        properties: { tabColor: { argb: '3B82F6' } }
      });

      // Sütunlar
      worksheet.columns = [
        { header: 'Evrak No', key: 'Evrak No', width: 15 },
        { header: 'Evrak Tipi', key: 'Evrak Tipi', width: 12 },
        { header: 'Tutar', key: 'Tutar', width: 15, style: { numFmt: '#,##0.00 ₺' } },
        { header: 'Vade Tarihi', key: 'Vade Tarihi', width: 12 },
        { header: 'Durum', key: 'Durum', width: 15 },
        { header: 'Cari', key: 'Cari', width: 25 },
        { header: 'Cari Tipi', key: 'Cari Tipi', width: 12 },
        { header: 'Keşideci', key: 'Keşideci', width: 20 },
        { header: 'Banka', key: 'Banka', width: 15 },
        { header: 'Kayıt Tarihi', key: 'Kayıt Tarihi', width: 12 },
        { header: 'Notlar', key: 'Notlar', width: 30 }
      ];

      // Header stili
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '3B82F6' }
      };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      // Veri ekle
      veri.forEach(row => {
        worksheet.addRow(row);
      });

      // Tablo kenarlıkları
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      // Özet satırı
      const sonSatir = worksheet.rowCount + 2;
      worksheet.getCell(`A${sonSatir}`).value = 'TOPLAM:';
      worksheet.getCell(`A${sonSatir}`).font = { bold: true };
      worksheet.getCell(`B${sonSatir}`).value = `${veri.length} Evrak`;
      worksheet.getCell(`C${sonSatir}`).value = { formula: `SUM(C2:C${worksheet.rowCount - 1})` };
      worksheet.getCell(`C${sonSatir}`).font = { bold: true };
      worksheet.getCell(`C${sonSatir}`).numFmt = '#,##0.00 ₺';

      // Dosya adı
      const tarih = new Date().toISOString().split('T')[0];
      const dosyaAdi = `evraklar_${baslangic}_${bitis}_${tarih}.xlsx`;

      // Response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${dosyaAdi}"`);

      // Excel dosyasını stream olarak gönder
      await workbook.xlsx.write(res);

      logger.info('Excel export tamamlandı', {
        userId: req.user.id,
        baslangic,
        bitis,
        kayitSayisi: veri.length,
        dosyaAdi
      });

      res.end();

    } catch (error) {
      logger.error('Excel export hatası', { error: error.message });
      res.status(500).json({
        error: 'Sunucu hatası',
        message: 'Excel dosyası oluşturulamadı'
      });
    }
  }
);

module.exports = router;
