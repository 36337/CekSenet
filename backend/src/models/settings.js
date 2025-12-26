/**
 * Settings Model
 * Uygulama ayarları ve ilk kurulum yönetimi
 */

const db = require('./db');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

// ============================================
// AYAR TANIMLARI
// ============================================

/**
 * Varsayılan ayarlar ve açıklamaları
 */
const DEFAULT_SETTINGS = {
  'app_version': { default: '1.0.0', description: 'Uygulama versiyonu', editable: false },
  'db_created_at': { default: null, description: 'Veritabanı oluşturulma tarihi', editable: false },
  'setup_completed': { default: 'false', description: 'İlk kurulum tamamlandı mı', editable: false },
  'company_name': { default: '', description: 'Şirket adı', editable: true },
  'backup_retention_days': { default: '30', description: 'Yedek saklama süresi (gün)', editable: true },
  'auto_backup_enabled': { default: 'true', description: 'Otomatik yedekleme aktif mi', editable: true },
  'session_timeout_hours': { default: '24', description: 'Oturum süresi (saat)', editable: true },
  'vade_uyari_gun': { default: '7', description: 'Vade uyarısı kaç gün önce', editable: true }
};

// ============================================
// TEMEL FONKSİYONLAR
// ============================================

/**
 * Tek bir ayar değeri getir
 * @param {string} key - Ayar anahtarı
 * @returns {string|null} Ayar değeri veya null
 */
function get(key) {
  const row = db.prepare('SELECT value FROM ayarlar WHERE key = ?').get(key);
  
  if (row) {
    return row.value;
  }
  
  // Varsayılan değer varsa döndür
  if (DEFAULT_SETTINGS[key]) {
    return DEFAULT_SETTINGS[key].default;
  }
  
  return null;
}

/**
 * Tek bir ayar değeri kaydet
 * @param {string} key - Ayar anahtarı
 * @param {string} value - Ayar değeri
 * @returns {boolean} Başarılı mı
 */
function set(key, value) {
  try {
    db.prepare(`
      INSERT INTO ayarlar (key, value) 
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, value);
    
    return true;
  } catch (error) {
    logger.error('Setting save error', { key, error: error.message });
    return false;
  }
}

/**
 * Tüm ayarları getir
 * @param {boolean} includeSystem - Sistem ayarlarını dahil et (app_version vb.)
 * @returns {Object} { key: { value, description, editable }, ... }
 */
function getAll(includeSystem = false) {
  // Veritabanındaki ayarlar
  const rows = db.prepare('SELECT key, value FROM ayarlar').all();
  const dbSettings = {};
  rows.forEach(row => {
    dbSettings[row.key] = row.value;
  });

  // Sonuç objesi
  const result = {};

  Object.entries(DEFAULT_SETTINGS).forEach(([key, meta]) => {
    // Sistem ayarlarını filtrele
    if (!includeSystem && !meta.editable) {
      return;
    }

    result[key] = {
      value: dbSettings[key] !== undefined ? dbSettings[key] : meta.default,
      description: meta.description,
      editable: meta.editable
    };
  });

  // Veritabanında olan ama DEFAULT_SETTINGS'te olmayan ayarlar
  Object.entries(dbSettings).forEach(([key, value]) => {
    if (!result[key] && (includeSystem || !DEFAULT_SETTINGS[key]?.editable === false)) {
      result[key] = {
        value,
        description: '',
        editable: true
      };
    }
  });

  return result;
}

/**
 * Birden fazla ayarı toplu güncelle
 * @param {Object} settings - { key: value, ... }
 * @returns {Object} { success: boolean, updated: string[], errors: string[] }
 */
function updateMultiple(settings) {
  const updated = [];
  const errors = [];

  Object.entries(settings).forEach(([key, value]) => {
    // Düzenlenemez ayarları atla
    if (DEFAULT_SETTINGS[key] && !DEFAULT_SETTINGS[key].editable) {
      errors.push(`'${key}' ayarı düzenlenemez`);
      return;
    }

    if (set(key, String(value))) {
      updated.push(key);
    } else {
      errors.push(`'${key}' ayarı kaydedilemedi`);
    }
  });

  return {
    success: errors.length === 0,
    updated,
    errors
  };
}

// ============================================
// İLK KURULUM FONKSİYONLARI
// ============================================

/**
 * İlk kurulum durumunu kontrol et
 * @returns {Object} { setup_completed, has_admin, app_version, db_created_at }
 */
function getSetupStatus() {
  // Admin kullanıcı var mı?
  const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get();
  const hasAdmin = adminCount.count > 0;

  // Kurulum tamamlandı mı?
  const setupCompleted = get('setup_completed') === 'true';

  // Uygulama bilgileri
  const appVersion = get('app_version') || '1.0.0';
  const dbCreatedAt = get('db_created_at');

  // Toplam kullanıcı sayısı
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();

  return {
    setup_completed: setupCompleted && hasAdmin,
    has_admin: hasAdmin,
    user_count: userCount.count,
    app_version: appVersion,
    db_created_at: dbCreatedAt
  };
}

/**
 * İlk kurulumu gerçekleştir (admin kullanıcı oluştur)
 * @param {Object} data - { username, password, ad_soyad, company_name? }
 * @returns {Object} { success, message, user? }
 */
function performSetup(data) {
  const { username, password, ad_soyad, company_name } = data;

  // Zaten kurulum yapılmış mı?
  const status = getSetupStatus();
  if (status.setup_completed) {
    return {
      success: false,
      message: 'Kurulum zaten tamamlanmış'
    };
  }

  try {
    // Transaction ile işlem yap
    const setupTransaction = db.transaction(() => {
      // Şifreyi hashle
      const hashedPassword = bcrypt.hashSync(password, 12);

      // Admin kullanıcı oluştur
      const userResult = db.prepare(`
        INSERT INTO users (username, password, ad_soyad, role, created_at)
        VALUES (?, ?, ?, 'admin', CURRENT_TIMESTAMP)
      `).run(username, hashedPassword, ad_soyad);

      const userId = userResult.lastInsertRowid;

      // Şirket adı varsa kaydet
      if (company_name) {
        set('company_name', company_name);
      }

      // Kurulum tamamlandı olarak işaretle
      set('setup_completed', 'true');
      set('setup_completed_at', new Date().toISOString());
      set('setup_completed_by', String(userId));

      return userId;
    });

    const userId = setupTransaction();

    // Oluşturulan kullanıcıyı getir
    const user = db.prepare(`
      SELECT id, username, ad_soyad, role, created_at 
      FROM users WHERE id = ?
    `).get(userId);

    logger.info('Initial setup completed', {
      userId,
      username,
      ad_soyad
    });

    return {
      success: true,
      message: 'Kurulum başarıyla tamamlandı',
      user: {
        id: user.id,
        username: user.username,
        ad_soyad: user.ad_soyad,
        role: user.role
      }
    };

  } catch (error) {
    logger.error('Setup error', { error: error.message });

    // Duplicate username hatası
    if (error.message.includes('UNIQUE constraint failed')) {
      return {
        success: false,
        message: 'Bu kullanıcı adı zaten kullanılıyor'
      };
    }

    return {
      success: false,
      message: `Kurulum başarısız: ${error.message}`
    };
  }
}

// ============================================
// YARDIMCI FONKSİYONLAR
// ============================================

/**
 * Ayar değerini boolean olarak al
 * @param {string} key - Ayar anahtarı
 * @returns {boolean}
 */
function getBoolean(key) {
  const value = get(key);
  return value === 'true' || value === '1';
}

/**
 * Ayar değerini integer olarak al
 * @param {string} key - Ayar anahtarı
 * @param {number} defaultValue - Varsayılan değer
 * @returns {number}
 */
function getInt(key, defaultValue = 0) {
  const value = get(key);
  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Uygulama bilgilerini getir
 * @returns {Object}
 */
function getAppInfo() {
  return {
    version: get('app_version') || '1.0.0',
    db_created_at: get('db_created_at'),
    setup_completed_at: get('setup_completed_at'),
    company_name: get('company_name') || ''
  };
}

module.exports = {
  // Temel CRUD
  get,
  set,
  getAll,
  updateMultiple,
  
  // İlk kurulum
  getSetupStatus,
  performSetup,
  
  // Yardımcılar
  getBoolean,
  getInt,
  getAppInfo,
  
  // Sabitler
  DEFAULT_SETTINGS
};
