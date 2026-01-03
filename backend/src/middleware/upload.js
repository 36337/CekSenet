/**
 * Upload Middleware
 * Multer ile dosya yükleme konfigürasyonu
 * Sharp ile thumbnail oluşturma
 */

const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Upload dizini
const UPLOAD_DIR = path.join(__dirname, '../../uploads/evraklar');

// İzin verilen MIME tipleri
const ALLOWED_MIMETYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

// İzin verilen uzantılar
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// Maksimum dosya boyutu (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Thumbnail boyutu
const THUMBNAIL_SIZE = 200;

/**
 * Türkçe karakterleri ve özel karakterleri temizle
 * @param {string} filename - Orijinal dosya adı
 * @returns {string} Temizlenmiş dosya adı
 */
function sanitizeFilename(filename) {
  // Türkçe karakter haritası
  const turkishMap = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'I': 'I',
    'İ': 'I', 'i': 'i',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U'
  };
  
  let sanitized = filename;
  
  // Türkçe karakterleri değiştir
  for (const [turkish, latin] of Object.entries(turkishMap)) {
    sanitized = sanitized.split(turkish).join(latin);
  }
  
  // Boşlukları alt çizgi yap
  sanitized = sanitized.replace(/\s+/g, '_');
  
  // Sadece harf, rakam, alt çizgi, tire ve nokta bırak
  sanitized = sanitized.replace(/[^a-zA-Z0-9_\-\.]/g, '');
  
  // Ardışık alt çizgileri teke indir
  sanitized = sanitized.replace(/_+/g, '_');
  
  // Baş ve sondaki alt çizgileri kaldır
  sanitized = sanitized.replace(/^_+|_+$/g, '');
  
  return sanitized || 'dosya';
}

/**
 * Benzersiz dosya adı oluştur
 * Format: {timestamp}_{randomId}_{sanitized_originalname}
 * @param {string} originalname - Orijinal dosya adı
 * @returns {string} Benzersiz dosya adı
 */
function generateUniqueFilename(originalname) {
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(4).toString('hex');
  const ext = path.extname(originalname).toLowerCase();
  const basename = path.basename(originalname, ext);
  const sanitizedBasename = sanitizeFilename(basename);
  
  return `${timestamp}_${randomId}_${sanitizedBasename}${ext}`;
}

/**
 * Evrak klasörünü oluştur (yoksa)
 * @param {number} evrakId - Evrak ID
 * @returns {string} Klasör yolu
 */
function ensureEvrakDir(evrakId) {
  const evrakDir = path.join(UPLOAD_DIR, String(evrakId));
  
  if (!fs.existsSync(evrakDir)) {
    fs.mkdirSync(evrakDir, { recursive: true });
    logger.info(`Evrak klasörü oluşturuldu: ${evrakDir}`);
  }
  
  return evrakDir;
}

/**
 * Multer storage konfigürasyonu
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      const evrakId = req.params.id;
      
      if (!evrakId) {
        return cb(new Error('Evrak ID bulunamadı'));
      }
      
      const evrakDir = ensureEvrakDir(evrakId);
      cb(null, evrakDir);
    } catch (error) {
      cb(error);
    }
  },
  
  filename: function (req, file, cb) {
    try {
      const uniqueFilename = generateUniqueFilename(file.originalname);
      cb(null, uniqueFilename);
    } catch (error) {
      cb(error);
    }
  }
});

/**
 * Dosya filtresi
 */
function fileFilter(req, file, cb) {
  // MIME type kontrolü
  if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
    const error = new Error(`Desteklenmeyen dosya tipi: ${file.mimetype}. İzin verilen: JPG, PNG, WEBP`);
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }
  
  // Uzantı kontrolü
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    const error = new Error(`Desteklenmeyen dosya uzantısı: ${ext}`);
    error.code = 'INVALID_FILE_EXTENSION';
    return cb(error, false);
  }
  
  cb(null, true);
}

/**
 * Multer instance
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10 // Tek seferde max 10 dosya
  }
});

/**
 * Thumbnail oluştur
 * @param {string} sourcePath - Kaynak dosya yolu
 * @param {string} destPath - Hedef thumbnail yolu
 * @returns {Promise<{width: number, height: number}>} Thumbnail boyutları
 */
async function createThumbnail(sourcePath, destPath) {
  try {
    const metadata = await sharp(sourcePath).metadata();
    
    await sharp(sourcePath)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'inside', // Aspect ratio koru
        withoutEnlargement: true // Küçük resimleri büyütme
      })
      .jpeg({ quality: 80 }) // JPEG olarak kaydet (boyut optimizasyonu)
      .toFile(destPath);
    
    logger.info(`Thumbnail oluşturuldu: ${destPath}`);
    
    return {
      width: metadata.width,
      height: metadata.height
    };
  } catch (error) {
    logger.error('Thumbnail oluşturma hatası', { error: error.message, sourcePath });
    throw error;
  }
}

/**
 * Görsel metadata al (boyutlar)
 * @param {string} filePath - Dosya yolu
 * @returns {Promise<{width: number, height: number}>} Boyutlar
 */
async function getImageMetadata(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0
    };
  } catch (error) {
    logger.error('Metadata okuma hatası', { error: error.message, filePath });
    return { width: 0, height: 0 };
  }
}

/**
 * Dosya yükleme sonrası işleme
 * Thumbnail oluştur, metadata al
 * @param {Object} file - Multer file objesi
 * @param {number} evrakId - Evrak ID
 * @returns {Promise<Object>} İşlenmiş dosya bilgileri
 */
async function processUploadedFile(file, evrakId) {
  const evrakDir = path.join(UPLOAD_DIR, String(evrakId));
  const originalPath = file.path;
  
  // Thumbnail dosya adı
  const ext = path.extname(file.filename);
  const basename = path.basename(file.filename, ext);
  const thumbnailFilename = `${basename}_thumb.jpg`;
  const thumbnailPath = path.join(evrakDir, thumbnailFilename);
  
  // Thumbnail oluştur ve metadata al
  let metadata = { width: 0, height: 0 };
  let thumbnailRelativePath = null;
  
  try {
    metadata = await getImageMetadata(originalPath);
    await createThumbnail(originalPath, thumbnailPath);
    thumbnailRelativePath = `uploads/evraklar/${evrakId}/${thumbnailFilename}`;
  } catch (error) {
    logger.warn('Thumbnail oluşturulamadı, orijinal kullanılacak', { 
      error: error.message,
      file: file.filename 
    });
  }
  
  return {
    dosya_adi: file.originalname,
    dosya_yolu: `uploads/evraklar/${evrakId}/${file.filename}`,
    thumbnail_yolu: thumbnailRelativePath,
    boyut: file.size,
    mimetype: file.mimetype,
    genislik: metadata.width,
    yukseklik: metadata.height
  };
}

/**
 * Dosya sil (disk + thumbnail)
 * @param {string} dosyaYolu - Dosya yolu (relative)
 * @param {string} thumbnailYolu - Thumbnail yolu (relative)
 */
function deleteFiles(dosyaYolu, thumbnailYolu) {
  const basePath = path.join(__dirname, '../../');
  
  // Ana dosyayı sil
  if (dosyaYolu) {
    const fullPath = path.join(basePath, dosyaYolu);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      logger.info(`Dosya silindi: ${fullPath}`);
    }
  }
  
  // Thumbnail'i sil
  if (thumbnailYolu) {
    const thumbPath = path.join(basePath, thumbnailYolu);
    if (fs.existsSync(thumbPath)) {
      fs.unlinkSync(thumbPath);
      logger.info(`Thumbnail silindi: ${thumbPath}`);
    }
  }
}

/**
 * Evrak klasörünü sil (tüm dosyalarla birlikte)
 * @param {number} evrakId - Evrak ID
 */
function deleteEvrakFolder(evrakId) {
  const evrakDir = path.join(UPLOAD_DIR, String(evrakId));
  
  if (fs.existsSync(evrakDir)) {
    // Klasör içindeki tüm dosyaları sil
    const files = fs.readdirSync(evrakDir);
    for (const file of files) {
      fs.unlinkSync(path.join(evrakDir, file));
    }
    
    // Klasörü sil
    fs.rmdirSync(evrakDir);
    logger.info(`Evrak klasörü silindi: ${evrakDir}`);
  }
}

/**
 * Upload hata handler middleware
 */
function handleUploadError(error, req, res, next) {
  if (error instanceof multer.MulterError) {
    // Multer hataları
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Dosya boyutu çok büyük',
        message: `Maksimum dosya boyutu: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Çok fazla dosya',
        message: 'Tek seferde en fazla 10 dosya yüklenebilir'
      });
    }
    
    return res.status(400).json({
      error: 'Dosya yükleme hatası',
      message: error.message
    });
  }
  
  // Özel hatalar
  if (error.code === 'INVALID_FILE_TYPE' || error.code === 'INVALID_FILE_EXTENSION') {
    return res.status(400).json({
      error: 'Geçersiz dosya tipi',
      message: error.message
    });
  }
  
  // Diğer hatalar
  next(error);
}

module.exports = {
  upload,
  processUploadedFile,
  deleteFiles,
  deleteEvrakFolder,
  handleUploadError,
  sanitizeFilename,
  ensureEvrakDir,
  UPLOAD_DIR,
  MAX_FILE_SIZE,
  ALLOWED_MIMETYPES
};
