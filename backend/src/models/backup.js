/**
 * Backup Model
 * Veritabanı yedekleme ve geri yükleme işlemleri
 */

const path = require('path');
const fs = require('fs');
const db = require('./db');
const logger = require('../utils/logger');
const config = require('../utils/config');

// Veritabanı yolu (config'den al - db.js ile aynı mantık)
const DB_PATH = path.isAbsolute(config.database.path)
  ? config.database.path
  : path.join(__dirname, '../../', config.database.path);

// Yedekleme dizini (database dizininin altında backups klasörü)
const DB_DIR = path.dirname(DB_PATH);
const BACKUP_DIR = path.join(DB_DIR, 'backups');

// Yedekleme dizininin varlığını kontrol et
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// ============================================
// YEDEKLEME FONKSİYONLARI
// ============================================

/**
 * Yeni yedek oluştur
 * @param {string} aciklama - Yedek açıklaması (opsiyonel)
 * @returns {Object} { success, filename, path, size, message }
 */
function create(aciklama = '') {
  try {
    // Dosya adı: ceksenet_YYYY-MM-DD_HH-MM-SS.db
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .slice(0, 19);
    
    const filename = `ceksenet_${timestamp}.db`;
    const backupPath = path.join(BACKUP_DIR, filename);

    // WAL checkpoint - tüm değişiklikleri ana dosyaya yaz
    try {
      db.pragma('wal_checkpoint(TRUNCATE)');
    } catch (e) {
      logger.warn('WAL checkpoint uyarısı', { error: e.message });
    }

    // better-sqlite3 backup API kullan
    db.backup(backupPath)
      .then(() => {
        logger.info('Veritabanı yedeklendi (async)', { filename });
      })
      .catch((err) => {
        logger.error('Backup async hatası', { error: err.message });
      });

    // Senkron alternatif: VACUUM INTO (SQLite 3.27+)
    // Bu daha güvenilir çünkü anında tamamlanıyor
    try {
      db.exec(`VACUUM INTO '${backupPath.replace(/\\/g, '/')}'`);
    } catch (vacuumError) {
      // VACUUM INTO desteklenmiyorsa dosya kopyalama yap
      logger.warn('VACUUM INTO başarısız, dosya kopyalanıyor', { error: vacuumError.message });
      fs.copyFileSync(DB_PATH, backupPath);
    }

    // Dosya boyutunu al
    const stats = fs.statSync(backupPath);
    const sizeKB = Math.round(stats.size / 1024);

    // Meta bilgisi kaydet
    const metaPath = backupPath.replace('.db', '.meta.json');
    const meta = {
      filename,
      created_at: now.toISOString(),
      aciklama: aciklama || 'Manuel yedek',
      size_bytes: stats.size,
      size_kb: sizeKB
    };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

    logger.info('Veritabanı yedeklendi', { 
      filename, 
      sizeKB,
      aciklama 
    });

    return {
      success: true,
      filename,
      path: backupPath,
      size: sizeKB,
      created_at: now.toISOString(),
      message: 'Yedekleme başarılı'
    };

  } catch (error) {
    logger.error('Yedekleme hatası', { error: error.message });
    return {
      success: false,
      message: `Yedekleme başarısız: ${error.message}`
    };
  }
}

/**
 * Mevcut yedekleri listele
 * @returns {Array} Yedek listesi [{ filename, created_at, size_kb, aciklama }]
 */
function list() {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    
    const backups = files
      .filter(f => f.endsWith('.db') && f.startsWith('ceksenet_'))
      .map(filename => {
        const filePath = path.join(BACKUP_DIR, filename);
        const metaPath = filePath.replace('.db', '.meta.json');
        
        // Dosya bilgisi
        const stats = fs.statSync(filePath);
        
        // Meta bilgisi varsa oku
        let meta = {};
        if (fs.existsSync(metaPath)) {
          try {
            meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          } catch (e) {
            // Meta okunamazsa devam et
          }
        }

        return {
          filename,
          created_at: meta.created_at || stats.mtime.toISOString(),
          size_bytes: stats.size,
          size_kb: Math.round(stats.size / 1024),
          aciklama: meta.aciklama || ''
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // En yeniden eskiye

    return backups;

  } catch (error) {
    logger.error('Yedek listeleme hatası', { error: error.message });
    return [];
  }
}

/**
 * Yedek detayını getir
 * @param {string} filename - Yedek dosya adı
 * @returns {Object|null} Yedek bilgisi veya null
 */
function getByFilename(filename) {
  try {
    // Güvenlik kontrolü: sadece beklenen format
    if (!filename.match(/^ceksenet_[\d-_]+\.db$/)) {
      return null;
    }

    const filePath = path.join(BACKUP_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const stats = fs.statSync(filePath);
    const metaPath = filePath.replace('.db', '.meta.json');

    let meta = {};
    if (fs.existsSync(metaPath)) {
      try {
        meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      } catch (e) {}
    }

    return {
      filename,
      path: filePath,
      created_at: meta.created_at || stats.mtime.toISOString(),
      size_bytes: stats.size,
      size_kb: Math.round(stats.size / 1024),
      aciklama: meta.aciklama || ''
    };

  } catch (error) {
    logger.error('Yedek detay hatası', { error: error.message, filename });
    return null;
  }
}

/**
 * Yedekten geri yükle
 * ÖNEMLİ: Bu işlem mevcut veritabanını tamamen değiştirir!
 * @param {string} filename - Geri yüklenecek yedek dosya adı
 * @returns {Object} { success, message }
 */
function restore(filename) {
  try {
    // Güvenlik kontrolü
    if (!filename.match(/^ceksenet_[\d-_]+\.db$/)) {
      return { success: false, message: 'Geçersiz dosya adı formatı' };
    }

    const backupPath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(backupPath)) {
      return { success: false, message: 'Yedek dosyası bulunamadı' };
    }

    // Mevcut veritabanının yedeğini al (güvenlik için)
    const safetyBackup = `ceksenet_pre-restore_${Date.now()}.db`;
    const safetyPath = path.join(BACKUP_DIR, safetyBackup);
    
    try {
      // WAL checkpoint
      db.pragma('wal_checkpoint(TRUNCATE)');
    } catch (e) {}

    // Mevcut DB'yi yedekle
    fs.copyFileSync(DB_PATH, safetyPath);
    logger.info('Geri yükleme öncesi güvenlik yedeği alındı', { safetyBackup });

    // WAL dosyalarını temizle
    const walPath = DB_PATH + '-wal';
    const shmPath = DB_PATH + '-shm';
    
    // Veritabanı bağlantısını kapat
    db.close();

    // WAL dosyalarını sil
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

    // Yedekten geri yükle
    fs.copyFileSync(backupPath, DB_PATH);

    logger.info('Veritabanı geri yüklendi', { 
      restored_from: filename,
      safety_backup: safetyBackup
    });

    return {
      success: true,
      message: 'Geri yükleme başarılı. Uygulama yeniden başlatılmalıdır.',
      safety_backup: safetyBackup,
      requires_restart: true
    };

  } catch (error) {
    logger.error('Geri yükleme hatası', { error: error.message, filename });
    return {
      success: false,
      message: `Geri yükleme başarısız: ${error.message}`
    };
  }
}

/**
 * Yedek sil
 * @param {string} filename - Silinecek yedek dosya adı
 * @returns {Object} { success, message }
 */
function remove(filename) {
  try {
    // Güvenlik kontrolü
    if (!filename.match(/^ceksenet_[\d-_]+\.db$/)) {
      return { success: false, message: 'Geçersiz dosya adı formatı' };
    }

    const filePath = path.join(BACKUP_DIR, filename);
    const metaPath = filePath.replace('.db', '.meta.json');

    if (!fs.existsSync(filePath)) {
      return { success: false, message: 'Yedek dosyası bulunamadı' };
    }

    // Dosyayı sil
    fs.unlinkSync(filePath);

    // Meta dosyasını da sil
    if (fs.existsSync(metaPath)) {
      fs.unlinkSync(metaPath);
    }

    logger.info('Yedek silindi', { filename });

    return {
      success: true,
      message: 'Yedek başarıyla silindi'
    };

  } catch (error) {
    logger.error('Yedek silme hatası', { error: error.message, filename });
    return {
      success: false,
      message: `Yedek silinemedi: ${error.message}`
    };
  }
}

/**
 * Eski yedekleri temizle (belirli sayıdan fazlasını sil)
 * @param {number} keepCount - Tutulacak yedek sayısı (varsayılan: 10)
 * @returns {Object} { success, deleted_count, message }
 */
function cleanup(keepCount = 10) {
  try {
    const backups = list();
    
    if (backups.length <= keepCount) {
      return {
        success: true,
        deleted_count: 0,
        message: 'Temizlenecek yedek yok'
      };
    }

    // En eski yedekleri sil
    const toDelete = backups.slice(keepCount);
    let deletedCount = 0;

    toDelete.forEach(backup => {
      const result = remove(backup.filename);
      if (result.success) {
        deletedCount++;
      }
    });

    logger.info('Eski yedekler temizlendi', { 
      deleted_count: deletedCount,
      kept_count: keepCount
    });

    return {
      success: true,
      deleted_count: deletedCount,
      message: `${deletedCount} eski yedek silindi`
    };

  } catch (error) {
    logger.error('Yedek temizleme hatası', { error: error.message });
    return {
      success: false,
      deleted_count: 0,
      message: `Temizleme başarısız: ${error.message}`
    };
  }
}

/**
 * Yedekleme dizini bilgisi
 * @returns {Object} { path, total_backups, total_size_kb }
 */
function getStats() {
  const backups = list();
  const totalSize = backups.reduce((sum, b) => sum + b.size_bytes, 0);

  return {
    backup_dir: BACKUP_DIR,
    total_backups: backups.length,
    total_size_bytes: totalSize,
    total_size_kb: Math.round(totalSize / 1024),
    total_size_mb: Math.round(totalSize / (1024 * 1024) * 100) / 100
  };
}

module.exports = {
  create,
  list,
  getByFilename,
  restore,
  delete: remove,
  cleanup,
  getStats,
  BACKUP_DIR
};
