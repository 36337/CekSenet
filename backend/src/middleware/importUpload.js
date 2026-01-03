/**
 * Import Upload Middleware
 * Excel dosya yükleme için Multer konfigürasyonu
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Geçici upload dizini
const TEMP_DIR = path.join(__dirname, '../../uploads/temp');

// İzin verilen MIME tipleri
const ALLOWED_MIMETYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'application/octet-stream'  // Bazı tarayıcılar bu MIME tipini gönderir
];

// İzin verilen uzantılar
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];

// Maksimum dosya boyutu (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Temp dizinini oluştur (yoksa)
 */
function ensureTempDir() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    logger.info('Temp dizini oluşturuldu', { path: TEMP_DIR });
  }
}

// Başlangıçta dizini oluştur
ensureTempDir();

/**
 * Multer storage konfigürasyonu
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureTempDir();
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    // Benzersiz dosya adı: timestamp_randomId_originalname
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `import_${timestamp}_${randomId}${ext}`;
    cb(null, filename);
  }
});

/**
 * Dosya filtresi
 * Sadece Excel dosyalarına izin ver
 */
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Uzantı kontrolü
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    const error = new Error(`Geçersiz dosya uzantısı: ${ext}. İzin verilen uzantılar: ${ALLOWED_EXTENSIONS.join(', ')}`);
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }
  
  // MIME tipi kontrolü (bazı tarayıcılar yanlış MIME tipi gönderebilir, uzantı öncelikli)
  // Bu nedenle MIME kontrolünü gevşek tutuyoruz
  if (!ALLOWED_MIMETYPES.includes(file.mimetype) && file.mimetype !== 'application/octet-stream') {
    logger.warn('Beklenmeyen MIME tipi, uzantı kabul edildi', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      extension: ext
    });
  }
  
  cb(null, true);
};

/**
 * Multer instance
 */
const importUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1 // Tek dosya
  }
});

/**
 * Geçici dosyayı sil
 * @param {string} filePath - Silinecek dosya yolu
 */
function deleteTempFile(filePath) {
  if (!filePath) return;
  
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.debug('Geçici dosya silindi', { path: filePath });
    }
  } catch (error) {
    logger.error('Geçici dosya silinemedi', { 
      path: filePath, 
      error: error.message 
    });
  }
}

/**
 * Temp klasöründeki eski dosyaları temizle
 * 1 saatten eski dosyaları siler
 */
function cleanupTempFiles() {
  try {
    if (!fs.existsSync(TEMP_DIR)) return;
    
    const files = fs.readdirSync(TEMP_DIR);
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    let deletedCount = 0;
    
    files.forEach(file => {
      // .gitkeep dosyasını atla
      if (file === '.gitkeep') return;
      
      const filePath = path.join(TEMP_DIR, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtimeMs < oneHourAgo) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });
    
    if (deletedCount > 0) {
      logger.info('Eski temp dosyaları temizlendi', { count: deletedCount });
    }
  } catch (error) {
    logger.error('Temp temizleme hatası', { error: error.message });
  }
}

/**
 * Upload hata handler middleware
 * Multer hatalarını yakalar ve anlaşılır mesajlar döner
 */
function handleImportUploadError(err, req, res, next) {
  // Geçici dosyayı temizle (varsa)
  if (req.file) {
    deleteTempFile(req.file.path);
  }
  
  // Multer hataları
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          error: `Dosya boyutu çok büyük. Maksimum: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: 'Sadece tek dosya yüklenebilir'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: 'Beklenmeyen dosya alanı'
        });
      default:
        return res.status(400).json({
          success: false,
          error: `Dosya yükleme hatası: ${err.message}`
        });
    }
  }
  
  // Custom file filter hatası
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  
  // Diğer hatalar
  logger.error('Import upload hatası', { error: err.message });
  return res.status(500).json({
    success: false,
    error: 'Dosya yükleme sırasında bir hata oluştu'
  });
}

// Her saat başı temp klasörünü temizle
setInterval(cleanupTempFiles, 60 * 60 * 1000);

// Başlangıçta da bir temizlik yap
cleanupTempFiles();

module.exports = {
  importUpload,
  deleteTempFile,
  cleanupTempFiles,
  handleImportUploadError,
  TEMP_DIR,
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS
};
