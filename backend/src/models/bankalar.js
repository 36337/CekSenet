/**
 * Bankalar Model
 * Banka CRUD işlemleri
 */

const db = require('./db');

/**
 * Tüm aktif bankaları getir
 * @param {Object} options - Opsiyonlar
 * @param {boolean} options.includeInactive - Pasif bankaları da dahil et
 * @returns {Array} Banka listesi
 */
function getAll(options = {}) {
  const { includeInactive = false } = options;
  
  let query = `
    SELECT * FROM bankalar
  `;
  
  if (!includeInactive) {
    query += ` WHERE aktif = 1`;
  }
  
  query += ` ORDER BY ad ASC`;
  
  return db.prepare(query).all();
}

/**
 * ID ile banka getir
 * @param {number} id - Banka ID
 * @returns {Object|null} Banka objesi veya null
 */
function getById(id) {
  const query = `SELECT * FROM bankalar WHERE id = ?`;
  return db.prepare(query).get(id) || null;
}

/**
 * Ad ile banka getir
 * @param {string} ad - Banka adı
 * @returns {Object|null} Banka objesi veya null
 */
function getByAd(ad) {
  const query = `SELECT * FROM bankalar WHERE ad = ?`;
  return db.prepare(query).get(ad) || null;
}

/**
 * Yeni banka oluştur
 * @param {Object} data - Banka verileri
 * @param {string} data.ad - Banka adı
 * @returns {Object} Oluşturulan banka
 */
function create(data) {
  const { ad } = data;
  
  // Aynı isimde banka var mı kontrol et
  const existing = getByAd(ad);
  if (existing) {
    // Eğer pasif ise aktif et
    if (existing.aktif === 0) {
      db.prepare(`UPDATE bankalar SET aktif = 1 WHERE id = ?`).run(existing.id);
      return getById(existing.id);
    }
    // Zaten aktif, mevcut bankayı döndür
    return existing;
  }
  
  const query = `
    INSERT INTO bankalar (ad, aktif)
    VALUES (?, 1)
  `;
  
  const result = db.prepare(query).run(ad.trim());
  return getById(result.lastInsertRowid);
}

/**
 * Banka güncelle
 * @param {number} id - Banka ID
 * @param {Object} data - Güncellenecek veriler
 * @param {string} data.ad - Banka adı
 * @returns {Object|null} Güncellenen banka veya null
 */
function update(id, data) {
  const existing = getById(id);
  if (!existing) return null;
  
  const { ad } = data;
  
  // Aynı isimde başka banka var mı kontrol et
  const duplicate = getByAd(ad);
  if (duplicate && duplicate.id !== id) {
    throw new Error('Bu isimde bir banka zaten mevcut');
  }
  
  const query = `
    UPDATE bankalar 
    SET ad = ?
    WHERE id = ?
  `;
  
  db.prepare(query).run(ad.trim(), id);
  return getById(id);
}

/**
 * Banka sil (soft delete - aktif = 0)
 * @param {number} id - Banka ID
 * @returns {Object} { success: boolean, message: string }
 */
function remove(id) {
  const existing = getById(id);
  if (!existing) {
    return { success: false, message: 'Banka bulunamadı' };
  }
  
  // Bankaya bağlı evrak sayısını kontrol et
  const evrakQuery = `SELECT COUNT(*) as count FROM evraklar WHERE banka_id = ?`;
  const evrakResult = db.prepare(evrakQuery).get(id);
  
  if (evrakResult.count > 0) {
    // Soft delete - sadece pasif yap
    db.prepare(`UPDATE bankalar SET aktif = 0 WHERE id = ?`).run(id);
    return { 
      success: true, 
      message: `Banka pasif yapıldı (${evrakResult.count} evrakta kullanılıyor)`,
      softDelete: true
    };
  }
  
  // Hard delete - tamamen sil
  db.prepare(`DELETE FROM bankalar WHERE id = ?`).run(id);
  return { success: true, message: 'Banka silindi' };
}

/**
 * Banka arama (autocomplete için)
 * @param {string} searchTerm - Arama terimi
 * @param {number} limit - Maksimum sonuç sayısı
 * @returns {Array} Banka listesi
 */
function search(searchTerm, limit = 10) {
  const query = `
    SELECT * FROM bankalar
    WHERE aktif = 1 AND ad LIKE ?
    ORDER BY ad ASC
    LIMIT ?
  `;
  
  return db.prepare(query).all(`%${searchTerm}%`, limit);
}

module.exports = {
  getAll,
  getById,
  getByAd,
  create,
  update,
  delete: remove,
  search
};
