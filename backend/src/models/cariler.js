/**
 * Cariler Model
 * Cari hesap (müşteri/tedarikçi) CRUD işlemleri
 */

const db = require('./db');

/**
 * Tüm carileri getir (filtreleme ve sayfalama ile)
 * @param {Object} filters - Filtre parametreleri
 * @param {string} filters.tip - 'musteri' | 'tedarikci' | null (hepsi)
 * @param {string} filters.search - Ad/soyad veya telefon araması
 * @param {number} filters.page - Sayfa numarası (default: 1)
 * @param {number} filters.limit - Sayfa başına kayıt (default: 20)
 * @returns {Object} { data: [], pagination: {} }
 */
function getAll(filters = {}) {
  const { tip, search, page = 1, limit = 20 } = filters;
  
  // Base query
  let whereClause = '1=1';
  const params = [];
  
  // Tip filtresi
  if (tip) {
    whereClause += ' AND c.tip = ?';
    params.push(tip);
  }
  
  // Arama filtresi (ad_soyad veya telefon)
  if (search) {
    whereClause += ' AND (c.ad_soyad LIKE ? OR c.telefon LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern);
  }
  
  // Toplam kayıt sayısı
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM cariler c 
    WHERE ${whereClause}
  `;
  const countResult = db.prepare(countQuery).get(...params);
  const total = countResult.total;
  
  // Sayfalama hesaplaması
  const offset = (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);
  
  // Ana sorgu (evrak sayısı ve toplam tutar ile)
  const dataQuery = `
    SELECT 
      c.*,
      COUNT(e.id) as evrak_sayisi,
      COALESCE(SUM(e.tutar), 0) as toplam_tutar
    FROM cariler c
    LEFT JOIN evraklar e ON c.id = e.cari_id
    WHERE ${whereClause}
    GROUP BY c.id
    ORDER BY c.ad_soyad ASC
    LIMIT ? OFFSET ?
  `;
  
  const data = db.prepare(dataQuery).all(...params, limit, offset);
  
  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages
    }
  };
}

/**
 * ID ile cari getir
 * @param {number} id - Cari ID
 * @returns {Object|null} Cari objesi veya null
 */
function getById(id) {
  const query = `
    SELECT * FROM cariler WHERE id = ?
  `;
  return db.prepare(query).get(id) || null;
}

/**
 * Cari detayı ile birlikte evrak istatistiklerini getir
 * @param {number} id - Cari ID
 * @returns {Object|null} Cari + istatistikler veya null
 */
function getWithStats(id) {
  // Cari bilgisi
  const cari = getById(id);
  if (!cari) return null;
  
  // Evrak istatistikleri
  const statsQuery = `
    SELECT 
      COUNT(*) as toplam_evrak,
      COALESCE(SUM(tutar), 0) as toplam_tutar,
      COUNT(CASE WHEN durum = 'portfoy' THEN 1 END) as portfoy_adet,
      COALESCE(SUM(CASE WHEN durum = 'portfoy' THEN tutar END), 0) as portfoy_tutar,
      COUNT(CASE WHEN durum = 'bankada' THEN 1 END) as bankada_adet,
      COALESCE(SUM(CASE WHEN durum = 'bankada' THEN tutar END), 0) as bankada_tutar,
      COUNT(CASE WHEN durum = 'ciro' THEN 1 END) as ciro_adet,
      COALESCE(SUM(CASE WHEN durum = 'ciro' THEN tutar END), 0) as ciro_tutar,
      COUNT(CASE WHEN durum = 'tahsil' THEN 1 END) as tahsil_adet,
      COALESCE(SUM(CASE WHEN durum = 'tahsil' THEN tutar END), 0) as tahsil_tutar,
      COUNT(CASE WHEN durum = 'karsiliksiz' THEN 1 END) as karsiliksiz_adet,
      COALESCE(SUM(CASE WHEN durum = 'karsiliksiz' THEN tutar END), 0) as karsiliksiz_tutar
    FROM evraklar
    WHERE cari_id = ?
  `;
  const stats = db.prepare(statsQuery).get(id);
  
  return {
    ...cari,
    istatistikler: stats
  };
}

/**
 * Yeni cari oluştur
 * @param {Object} data - Cari verileri
 * @returns {Object} Oluşturulan cari
 */
function create(data) {
  const { ad_soyad, tip, telefon, email, adres, vergi_no, notlar } = data;
  
  const query = `
    INSERT INTO cariler (ad_soyad, tip, telefon, email, adres, vergi_no, notlar, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `;
  
  const result = db.prepare(query).run(
    ad_soyad,
    tip,
    telefon || null,
    email || null,
    adres || null,
    vergi_no || null,
    notlar || null
  );
  
  // Oluşturulan cariyi döndür
  return getById(result.lastInsertRowid);
}

/**
 * Cari güncelle
 * @param {number} id - Cari ID
 * @param {Object} data - Güncellenecek veriler
 * @returns {Object|null} Güncellenen cari veya null
 */
function update(id, data) {
  // Önce cari var mı kontrol et
  const existing = getById(id);
  if (!existing) return null;
  
  const { ad_soyad, tip, telefon, email, adres, vergi_no, notlar } = data;
  
  const query = `
    UPDATE cariler 
    SET 
      ad_soyad = ?,
      tip = ?,
      telefon = ?,
      email = ?,
      adres = ?,
      vergi_no = ?,
      notlar = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.prepare(query).run(
    ad_soyad,
    tip,
    telefon || null,
    email || null,
    adres || null,
    vergi_no || null,
    notlar || null,
    id
  );
  
  // Güncellenen cariyi döndür
  return getById(id);
}

/**
 * Cari sil
 * @param {number} id - Cari ID
 * @returns {Object} { success: boolean, message: string, evrakSayisi?: number }
 */
function remove(id) {
  // Önce cari var mı kontrol et
  const existing = getById(id);
  if (!existing) {
    return { success: false, message: 'Cari bulunamadı' };
  }
  
  // Cariye bağlı evrak sayısını kontrol et
  const evrakQuery = `SELECT COUNT(*) as count FROM evraklar WHERE cari_id = ?`;
  const evrakResult = db.prepare(evrakQuery).get(id);
  
  if (evrakResult.count > 0) {
    return { 
      success: false, 
      message: `Bu cariye bağlı ${evrakResult.count} adet evrak bulunmaktadır. Önce evrakları silmeniz veya başka bir cariye atamanız gerekir.`,
      evrakSayisi: evrakResult.count
    };
  }
  
  // Cariyi sil
  const deleteQuery = `DELETE FROM cariler WHERE id = ?`;
  db.prepare(deleteQuery).run(id);
  
  return { success: true, message: 'Cari başarıyla silindi' };
}

/**
 * Cariye ait evrakları getir
 * @param {number} cariId - Cari ID
 * @param {Object} filters - Filtre parametreleri
 * @param {number} filters.page - Sayfa numarası
 * @param {number} filters.limit - Sayfa başına kayıt
 * @returns {Object} { data: [], pagination: {} }
 */
function getEvraklar(cariId, filters = {}) {
  const { page = 1, limit = 20 } = filters;
  
  // Cari var mı kontrol et
  const cari = getById(cariId);
  if (!cari) return null;
  
  // Toplam kayıt sayısı
  const countQuery = `SELECT COUNT(*) as total FROM evraklar WHERE cari_id = ?`;
  const countResult = db.prepare(countQuery).get(cariId);
  const total = countResult.total;
  
  // Sayfalama
  const offset = (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);
  
  // Evrakları getir
  const dataQuery = `
    SELECT * FROM evraklar 
    WHERE cari_id = ?
    ORDER BY vade_tarihi ASC
    LIMIT ? OFFSET ?
  `;
  const data = db.prepare(dataQuery).all(cariId, limit, offset);
  
  return {
    cari,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages
    }
  };
}

module.exports = {
  getAll,
  getById,
  getWithStats,
  create,
  update,
  delete: remove, // 'delete' reserved keyword olduğu için 'remove' kullandık
  getEvraklar
};
