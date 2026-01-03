/**
 * Import Routes
 * Excel'den toplu evrak import endpoint'leri
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const { authenticate } = require('../middleware/auth');
const { 
  importUpload, 
  deleteTempFile, 
  handleImportUploadError 
} = require('../middleware/importUpload');
const { parseExcelFile } = require('../utils/excelParser');
const Evraklar = require('../models/evraklar');
const db = require('../models/db');
const logger = require('../utils/logger');

const router = express.Router();

// Tüm import route'ları authentication gerektirir
router.use(authenticate);

// Template dosyası yolu
const TEMPLATE_PATH = path.join(__dirname, '../../templates/evrak-import-template.xlsx');

// ============================================
// ENDPOINT'LER
// ============================================

/**
 * GET /api/import/evraklar/template
 * Import template dosyasını indir
 */
router.get('/evraklar/template', (req, res) => {
  try {
    // Template dosyası var mı kontrol et
    if (!fs.existsSync(TEMPLATE_PATH)) {
      logger.error('Template dosyası bulunamadı', { path: TEMPLATE_PATH });
      return res.status(404).json({
        success: false,
        error: 'Template dosyası bulunamadı'
      });
    }
    
    // Dosya istatistikleri
    const stats = fs.statSync(TEMPLATE_PATH);
    
    // Response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="evrak-import-template.xlsx"');
    res.setHeader('Content-Length', stats.size);
    
    // Dosyayı stream et
    const fileStream = fs.createReadStream(TEMPLATE_PATH);
    fileStream.pipe(res);
    
    logger.info('Template indirildi', { 
      user_id: req.user.id,
      username: req.user.username 
    });
    
  } catch (error) {
    logger.error('Template indirme hatası', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Template indirilemedi'
    });
  }
});

/**
 * POST /api/import/evraklar/parse
 * Excel dosyasını yükle ve parse et
 * 
 * Request: multipart/form-data
 * - file: Excel dosyası (.xlsx, .xls)
 * 
 * Response:
 * - success: boolean
 * - data: Array of parsed rows
 * - ozet: { toplam, gecerli, hatali, uyarili }
 */
router.post(
  '/evraklar/parse',
  importUpload.single('file'),
  handleImportUploadError,
  async (req, res) => {
    let tempFilePath = null;
    
    try {
      // Dosya yüklendi mi?
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Dosya yüklenmedi. Lütfen bir Excel dosyası seçin.'
        });
      }
      
      tempFilePath = req.file.path;
      
      logger.info('Import dosyası yüklendi', {
        user_id: req.user.id,
        filename: req.file.originalname,
        size: req.file.size,
        path: tempFilePath
      });
      
      // Excel dosyasını parse et
      const result = await parseExcelFile(tempFilePath);
      
      logger.info('Import dosyası parse edildi', {
        user_id: req.user.id,
        toplam: result.ozet.toplam,
        gecerli: result.ozet.gecerli,
        hatali: result.ozet.hatali
      });
      
      // Geçici dosyayı sil
      deleteTempFile(tempFilePath);
      
      res.json(result);
      
    } catch (error) {
      // Geçici dosyayı sil
      if (tempFilePath) {
        deleteTempFile(tempFilePath);
      }
      
      logger.error('Import parse hatası', { 
        error: error.message,
        user_id: req.user.id 
      });
      
      res.status(400).json({
        success: false,
        error: error.message || 'Dosya işlenirken bir hata oluştu'
      });
    }
  }
);

/**
 * POST /api/import/evraklar/import
 * Parse edilmiş ve onaylanmış satırları veritabanına kaydet
 * 
 * Request Body:
 * - satirlar: Array of row objects (parse'dan dönen, seçilmiş olanlar)
 * 
 * Response:
 * - success: boolean
 * - sonuc: { basarili, basarisiz, hatalar: [] }
 */
router.post('/evraklar/import', async (req, res) => {
  try {
    const { satirlar } = req.body;
    
    // Validation
    if (!satirlar || !Array.isArray(satirlar) || satirlar.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Import edilecek satır bulunamadı'
      });
    }
    
    // Sadece geçerli satırları filtrele
    const gecerliSatirlar = satirlar.filter(s => s.gecerli === true);
    
    if (gecerliSatirlar.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Geçerli satır bulunamadı. Lütfen hatalı satırları düzeltin.'
      });
    }
    
    logger.info('Import işlemi başlatıldı', {
      user_id: req.user.id,
      toplam_satir: satirlar.length,
      gecerli_satir: gecerliSatirlar.length
    });
    
    // Sonuç takibi
    const sonuc = {
      basarili: 0,
      basarisiz: 0,
      hatalar: []
    };
    
    // Her satırı işle (transaction dışında, hata olsa da diğerleri kaydedilsin)
    for (const satir of gecerliSatirlar) {
      try {
        // Evrak verilerini hazırla
        const evrakData = {
          evrak_tipi: satir.evrak_tipi,
          evrak_no: satir.evrak_no,
          tutar: satir.tutar,
          para_birimi: satir.para_birimi || 'TRY',
          doviz_kuru: satir.doviz_kuru || null,
          evrak_tarihi: satir.evrak_tarihi || null,
          vade_tarihi: satir.vade_tarihi,
          banka_adi: satir.banka_adi || null,
          kesideci: satir.kesideci || null,
          cari_id: satir.cari_id || null,
          durum: satir.durum || 'portfoy',
          notlar: satir.notlar || null
        };
        
        // Evrak oluştur
        const yeniEvrak = Evraklar.create(evrakData, req.user.id);
        
        if (yeniEvrak) {
          sonuc.basarili++;
        } else {
          sonuc.basarisiz++;
          sonuc.hatalar.push({
            satir: satir.satir,
            evrak_no: satir.evrak_no,
            hata: 'Evrak oluşturulamadı'
          });
        }
        
      } catch (error) {
        sonuc.basarisiz++;
        sonuc.hatalar.push({
          satir: satir.satir,
          evrak_no: satir.evrak_no,
          hata: error.message || 'Bilinmeyen hata'
        });
        
        logger.warn('Import satır hatası', {
          satir: satir.satir,
          evrak_no: satir.evrak_no,
          error: error.message
        });
      }
    }
    
    logger.info('Import işlemi tamamlandı', {
      user_id: req.user.id,
      basarili: sonuc.basarili,
      basarisiz: sonuc.basarisiz
    });
    
    // Sonucu döndür
    res.json({
      success: sonuc.basarili > 0,
      sonuc
    });
    
  } catch (error) {
    logger.error('Import hatası', { 
      error: error.message,
      user_id: req.user.id 
    });
    
    res.status(500).json({
      success: false,
      error: error.message || 'Import sırasında bir hata oluştu'
    });
  }
});

/**
 * GET /api/import/evraklar/info
 * Import hakkında bilgi döndür (template kolon yapısı, limitler vs.)
 */
router.get('/evraklar/info', (req, res) => {
  res.json({
    success: true,
    info: {
      maxFileSize: '5MB',
      allowedFormats: ['.xlsx', '.xls'],
      maxRows: 1000,
      requiredColumns: [
        { name: 'Evrak Tipi', description: 'cek veya senet' },
        { name: 'Evrak No', description: 'Benzersiz evrak numarası' },
        { name: 'Tutar', description: 'Sayısal değer' },
        { name: 'Vade Tarihi', description: 'GG.AA.YYYY veya YYYY-MM-DD' }
      ],
      optionalColumns: [
        { name: 'Para Birimi', description: 'TRY, USD, EUR, GBP, CHF (varsayılan: TRY)' },
        { name: 'Döviz Kuru', description: 'TRY dışı para birimlerinde zorunlu' },
        { name: 'Evrak Tarihi', description: 'GG.AA.YYYY veya YYYY-MM-DD' },
        { name: 'Banka Adı', description: 'Çekin bankası' },
        { name: 'Keşideci', description: 'Evrakı düzenleyen' },
        { name: 'Cari Adı', description: 'Sistemde varsa eşleştirilir' },
        { name: 'Durum', description: 'portfoy, bankada, tahsilde, odendi, protestolu, iade' },
        { name: 'Notlar', description: 'Ek açıklamalar' }
      ],
      supportedDateFormats: [
        'GG.AA.YYYY (01.01.2025)',
        'GG/AA/YYYY (01/01/2025)',
        'YYYY-MM-DD (2025-01-01)',
        'Excel tarih formatı'
      ]
    }
  });
});

module.exports = router;
