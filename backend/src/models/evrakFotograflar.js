/**
 * Evrak Fotoğrafları Model
 * Evrak fotoğraf CRUD işlemleri
 */

const db = require('./db');

/**
 * Evraka ait tüm fotoğrafları getir
 * @param {number} evrakId - Evrak ID
 * @returns {Array} Fotoğraf listesi
 */
function getByEvrakId(evrakId) {
  const query = `
    SELECT 
      ef.*,
      u.ad_soyad as yukleyen_adi
    FROM evrak_fotograflar ef
    LEFT JOIN users u ON ef.created_by = u.id
    WHERE ef.evrak_id = ?
    ORDER BY ef.created_at DESC
  `;
  
  return db.prepare(query).all(evrakId);
}

/**
 * ID ile fotoğraf getir
 * @param {number} id - Fotoğraf ID
 * @returns {Object|null} Fotoğraf objesi veya null
 */
function getById(id) {
  const query = `
    SELECT 
      ef.*,
      u.ad_soyad as yukleyen_adi
    FROM evrak_fotograflar ef
    LEFT JOIN users u ON ef.created_by = u.id
    WHERE ef.id = ?
  `;
  
  return db.prepare(query).get(id) || null;
}

/**
 * Yeni fotoğraf kaydı oluştur
 * @param {Object} data - Fotoğraf verileri
 * @param {number} data.evrak_id - Evrak ID
 * @param {string} data.dosya_adi - Orijinal dosya adı
 * @param {string} data.dosya_yolu - Tam dosya yolu
 * @param {string} data.thumbnail_yolu - Thumbnail dosya yolu
 * @param {number} data.boyut - Dosya boyutu (bytes)
 * @param {string} data.mimetype - MIME type
 * @param {number} data.genislik - Genişlik (px)
 * @param {number} data.yukseklik - Yükseklik (px)
 * @param {number} data.created_by - Yükleyen kullanıcı ID
 * @returns {Object} Oluşturulan fotoğraf kaydı
 */
function create(data) {
  const {
    evrak_id,
    dosya_adi,
    dosya_yolu,
    thumbnail_yolu,
    boyut,
    mimetype,
    genislik,
    yukseklik,
    created_by
  } = data;
  
  const query = `
    INSERT INTO evrak_fotograflar (
      evrak_id, dosya_adi, dosya_yolu, thumbnail_yolu,
      boyut, mimetype, genislik, yukseklik, created_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const result = db.prepare(query).run(
    evrak_id,
    dosya_adi,
    dosya_yolu,
    thumbnail_yolu || null,
    boyut || null,
    mimetype || null,
    genislik || null,
    yukseklik || null,
    created_by || null
  );
  
  return getById(result.lastInsertRowid);
}

/**
 * Fotoğraf kaydını sil (sadece DB kaydı, dosya silme ayrı yapılmalı)
 * @param {number} id - Fotoğraf ID
 * @returns {Object} { success: boolean, deletedPhoto: Object }
 */
function remove(id) {
  const photo = getById(id);
  if (!photo) {
    return { success: false, message: 'Fotoğraf bulunamadı' };
  }
  
  const query = `DELETE FROM evrak_fotograflar WHERE id = ?`;
  db.prepare(query).run(id);
  
  return { 
    success: true, 
    deletedPhoto: photo,
    message: 'Fotoğraf kaydı silindi' 
  };
}

/**
 * Evraka ait tüm fotoğraf kayıtlarını sil (evrak silme öncesi çağrılır)
 * @param {number} evrakId - Evrak ID
 * @returns {Object} { success: boolean, deletedPhotos: Array }
 */
function deleteByEvrakId(evrakId) {
  // Önce silinecek fotoğrafları al (dosya silme için)
  const photos = getByEvrakId(evrakId);
  
  if (photos.length === 0) {
    return { success: true, deletedPhotos: [], message: 'Silinecek fotoğraf yok' };
  }
  
  // DB kayıtlarını sil
  const query = `DELETE FROM evrak_fotograflar WHERE evrak_id = ?`;
  db.prepare(query).run(evrakId);
  
  return {
    success: true,
    deletedPhotos: photos,
    message: `${photos.length} fotoğraf kaydı silindi`
  };
}

/**
 * Evraka ait fotoğraf dosya yollarını getir (dosya silme için)
 * @param {number} evrakId - Evrak ID
 * @returns {Array<{dosya_yolu: string, thumbnail_yolu: string}>} Dosya yolları
 */
function getFilePaths(evrakId) {
  const query = `
    SELECT dosya_yolu, thumbnail_yolu 
    FROM evrak_fotograflar 
    WHERE evrak_id = ?
  `;
  
  return db.prepare(query).all(evrakId);
}

/**
 * Evraka ait fotoğraf sayısını getir
 * @param {number} evrakId - Evrak ID
 * @returns {number} Fotoğraf sayısı
 */
function getCountByEvrakId(evrakId) {
  const query = `SELECT COUNT(*) as count FROM evrak_fotograflar WHERE evrak_id = ?`;
  const result = db.prepare(query).get(evrakId);
  return result.count;
}

/**
 * Evrakın fotoğrafı var mı kontrol et
 * @param {number} evrakId - Evrak ID
 * @returns {boolean} Fotoğraf var mı
 */
function hasPhotos(evrakId) {
  return getCountByEvrakId(evrakId) > 0;
}

module.exports = {
  getByEvrakId,
  getById,
  create,
  delete: remove,
  deleteByEvrakId,
  getFilePaths,
  getCountByEvrakId,
  hasPhotos
};
