/**
 * Evraklar Model
 * Çek/Senet CRUD işlemleri, durum yönetimi ve hareket geçmişi
 */

const db = require('./db');
const { deleteEvrakFolder } = require('../middleware/upload');

// ============================================
// DURUM AKIŞ KURALLARI
// ============================================

/**
 * Geçerli durum geçişleri
 * Her durum için izin verilen hedef durumlar
 */
const DURUM_GECISLERI = {
  'portfoy': ['bankada', 'ciro'],
  'bankada': ['tahsil', 'karsiliksiz'],
  'ciro': [], // Son durum - değiştirilemez
  'tahsil': [], // Son durum - değiştirilemez
  'karsiliksiz': ['tahsil'] // Geri dönüş mümkün
};

/**
 * Geçerli durumlar listesi
 */
const GECERLI_DURUMLAR = ['portfoy', 'bankada', 'ciro', 'tahsil', 'karsiliksiz'];

/**
 * Durum geçişinin geçerli olup olmadığını kontrol et
 * @param {string} eskiDurum - Mevcut durum
 * @param {string} yeniDurum - Hedef durum
 * @returns {Object} { valid: boolean, message?: string }
 */
function validateDurumTransition(eskiDurum, yeniDurum) {
  // Aynı duruma geçiş anlamsız
  if (eskiDurum === yeniDurum) {
    return { valid: false, message: 'Evrak zaten bu durumda' };
  }
  
  // Yeni durum geçerli mi?
  if (!GECERLI_DURUMLAR.includes(yeniDurum)) {
    return { valid: false, message: `Geçersiz durum: ${yeniDurum}` };
  }
  
  // Geçiş izinli mi?
  const izinliGecisler = DURUM_GECISLERI[eskiDurum] || [];
  if (!izinliGecisler.includes(yeniDurum)) {
    // Son durum kontrolü
    if (izinliGecisler.length === 0) {
      return { 
        valid: false, 
        message: `'${eskiDurum}' son durumdur, değiştirilemez` 
      };
    }
    return { 
      valid: false, 
      message: `'${eskiDurum}' durumundan '${yeniDurum}' durumuna geçiş yapılamaz. İzin verilen geçişler: ${izinliGecisler.join(', ')}` 
    };
  }
  
  return { valid: true };
}

// ============================================
// EVRAK CRUD FONKSİYONLARI
// ============================================

/**
 * Tüm evrakları getir (gelişmiş filtreleme ve sayfalama)
 * @param {Object} filters - Filtre parametreleri
 * @returns {Object} { data: [], pagination: {} }
 */
function getAll(filters = {}) {
  const { 
    durum,           // virgülle ayrılmış durumlar: 'portfoy,bankada'
    evrak_tipi,      // 'cek' | 'senet'
    vade_baslangic,  // '2025-01-01'
    vade_bitis,      // '2025-12-31'
    tutar_min,       // minimum tutar
    tutar_max,       // maximum tutar
    search,          // evrak_no veya kesideci araması
    cari_id,         // belirli cariye ait evraklar
    sort = 'vade_tarihi', // sıralama alanı
    order = 'asc',   // sıralama yönü
    page = 1, 
    limit = 20 
  } = filters;
  
  // Base query
  let whereClause = '1=1';
  const params = [];
  
  // Durum filtresi (virgülle ayrılmış)
  if (durum) {
    const durumlar = durum.split(',').map(d => d.trim()).filter(d => GECERLI_DURUMLAR.includes(d));
    if (durumlar.length > 0) {
      whereClause += ` AND e.durum IN (${durumlar.map(() => '?').join(',')})`;
      params.push(...durumlar);
    }
  }
  
  // Evrak tipi filtresi
  if (evrak_tipi && ['cek', 'senet'].includes(evrak_tipi)) {
    whereClause += ' AND e.evrak_tipi = ?';
    params.push(evrak_tipi);
  }
  
  // Vade tarihi başlangıç
  if (vade_baslangic) {
    whereClause += ' AND e.vade_tarihi >= ?';
    params.push(vade_baslangic);
  }
  
  // Vade tarihi bitiş
  if (vade_bitis) {
    whereClause += ' AND e.vade_tarihi <= ?';
    params.push(vade_bitis);
  }
  
  // Tutar minimum
  if (tutar_min !== undefined && tutar_min !== null && tutar_min !== '') {
    whereClause += ' AND e.tutar >= ?';
    params.push(parseFloat(tutar_min));
  }
  
  // Tutar maximum
  if (tutar_max !== undefined && tutar_max !== null && tutar_max !== '') {
    whereClause += ' AND e.tutar <= ?';
    params.push(parseFloat(tutar_max));
  }
  
  // Arama filtresi (evrak_no veya kesideci)
  if (search) {
    whereClause += ' AND (e.evrak_no LIKE ? OR e.kesideci LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern);
  }
  
  // Cari filtresi
  if (cari_id) {
    whereClause += ' AND e.cari_id = ?';
    params.push(parseInt(cari_id));
  }
  
  // Toplam kayıt sayısı
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM evraklar e 
    WHERE ${whereClause}
  `;
  const countResult = db.prepare(countQuery).get(...params);
  const total = countResult.total;
  
  // Sayfalama hesaplaması
  const offset = (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);
  
  // Sıralama validasyonu
  const allowedSortFields = ['vade_tarihi', 'tutar', 'created_at', 'evrak_no'];
  const sortField = allowedSortFields.includes(sort) ? sort : 'vade_tarihi';
  const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  
  // Ana sorgu (cari ve banka bilgisi ile)
  const dataQuery = `
    SELECT 
      e.*,
      c.ad_soyad as cari_adi,
      c.tip as cari_tipi,
      b.ad as banka_adi_joined
    FROM evraklar e
    LEFT JOIN cariler c ON e.cari_id = c.id
    LEFT JOIN bankalar b ON e.banka_id = b.id
    WHERE ${whereClause}
    ORDER BY e.${sortField} ${sortOrder}
    LIMIT ? OFFSET ?
  `;
  
  const data = db.prepare(dataQuery).all(...params, limit, offset);
  
  // Her evrak için banka_adi_display hesapla
  data.forEach(evrak => {
    if (evrak.banka_id && evrak.banka_adi_joined) {
      evrak.banka_adi_display = evrak.banka_adi_joined;
    } else {
      evrak.banka_adi_display = evrak.banka_adi || null;
    }
  });
  
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
 * ID ile evrak getir (cari ve banka bilgisi dahil)
 * @param {number} id - Evrak ID
 * @returns {Object|null} Evrak objesi veya null
 */
function getById(id) {
  const query = `
    SELECT 
      e.*,
      c.ad_soyad as cari_adi,
      c.tip as cari_tipi,
      c.telefon as cari_telefon,
      u.ad_soyad as olusturan_adi,
      b.ad as banka_adi_joined
    FROM evraklar e
    LEFT JOIN cariler c ON e.cari_id = c.id
    LEFT JOIN users u ON e.created_by = u.id
    LEFT JOIN bankalar b ON e.banka_id = b.id
    WHERE e.id = ?
  `;
  const result = db.prepare(query).get(id);
  
  if (!result) return null;
  
  // Banka adı: önce banka_id'den gelen, yoksa eski banka_adi alanı
  if (result.banka_id && result.banka_adi_joined) {
    result.banka_adi_display = result.banka_adi_joined;
  } else {
    result.banka_adi_display = result.banka_adi || null;
  }
  
  return result;
}

/**
 * Yeni evrak oluştur (ilk hareket kaydı ile)
 * @param {Object} data - Evrak verileri
 * @param {number} userId - Oluşturan kullanıcı ID
 * @returns {Object} Oluşturulan evrak
 */
function create(data, userId) {
  const { 
    evrak_tipi, 
    evrak_no, 
    tutar, 
    vade_tarihi,
    evrak_tarihi,  // Evrak tarihi (opsiyonel)
    banka_adi,     // Geriye uyumluluk için korunuyor
    banka_id,      // YENİ: Banka ID (opsiyonel)
    kesideci,      // Artık opsiyonel (boş string kabul edilir)
    cari_id, 
    durum = 'portfoy',
    notlar,
    para_birimi = 'TRY',  // YENİ: Para birimi (default TRY)
    doviz_kuru            // YENİ: Döviz kuru (TRY dışında zorunlu)
  } = data;
  
  // Transaction başlat
  const insertEvrak = db.transaction(() => {
    // Evrak ekle (updated_at de set edilmeli)
    const evrakQuery = `
      INSERT INTO evraklar (evrak_tipi, evrak_no, tutar, vade_tarihi, evrak_tarihi, banka_adi, banka_id, kesideci, cari_id, durum, notlar, para_birimi, doviz_kuru, created_by, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    
    const evrakResult = db.prepare(evrakQuery).run(
      evrak_tipi,
      evrak_no,
      parseFloat(tutar),
      vade_tarihi,
      evrak_tarihi || null,
      banka_adi || null,
      banka_id || null,               // YENİ: banka_id
      kesideci || '',                 // Boş string kabul (DB NOT NULL)
      cari_id || null,
      durum,
      notlar || null,
      para_birimi || 'TRY',           // YENİ: para_birimi
      doviz_kuru || null,             // YENİ: doviz_kuru
      userId
    );
    
    const evrakId = evrakResult.lastInsertRowid;
    
    // İlk hareket kaydı (oluşturma)
    const hareketQuery = `
      INSERT INTO evrak_hareketleri (evrak_id, eski_durum, yeni_durum, aciklama, created_by)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    db.prepare(hareketQuery).run(
      evrakId,
      null, // İlk kayıt, eski durum yok
      durum,
      'Evrak oluşturuldu',
      userId
    );
    
    return evrakId;
  });
  
  const evrakId = insertEvrak();
  return getById(evrakId);
}

/**
 * Evrak güncelle (durum hariç)
 * @param {number} id - Evrak ID
 * @param {Object} data - Güncellenecek veriler
 * @param {number} userId - Güncelleyen kullanıcı ID
 * @returns {Object|null} Güncellenen evrak veya null
 */
function update(id, data, userId) {
  // Önce evrak var mı kontrol et
  const existing = getById(id);
  if (!existing) return null;
  
  const { 
    evrak_tipi, 
    evrak_no, 
    tutar, 
    vade_tarihi,
    evrak_tarihi,  // Evrak tarihi (opsiyonel)
    banka_adi,     // Geriye uyumluluk için korunuyor
    banka_id,      // YENİ: Banka ID (opsiyonel)
    kesideci,      // Artık opsiyonel
    cari_id, 
    notlar,
    para_birimi,   // YENİ: Para birimi
    doviz_kuru     // YENİ: Döviz kuru
  } = data;
  
  // NOT: Durum bu fonksiyonla güncellenemez, updateDurum kullanılmalı
  const query = `
    UPDATE evraklar 
    SET 
      evrak_tipi = ?,
      evrak_no = ?,
      tutar = ?,
      vade_tarihi = ?,
      evrak_tarihi = ?,
      banka_adi = ?,
      banka_id = ?,
      kesideci = ?,
      cari_id = ?,
      notlar = ?,
      para_birimi = ?,
      doviz_kuru = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.prepare(query).run(
    evrak_tipi,
    evrak_no,
    parseFloat(tutar),
    vade_tarihi,
    evrak_tarihi || null,
    banka_adi || null,
    banka_id || null,               // YENİ: banka_id
    kesideci || '',                 // Boş string kabul (DB NOT NULL)
    cari_id || null,
    notlar || null,
    para_birimi || 'TRY',           // YENİ: para_birimi
    doviz_kuru || null,             // YENİ: doviz_kuru
    id
  );
  
  return getById(id);
}

/**
 * Evrak durumunu güncelle (hareket kaydı ile)
 * @param {number} id - Evrak ID
 * @param {string} yeniDurum - Yeni durum
 * @param {string} aciklama - Değişiklik açıklaması
 * @param {number} userId - İşlemi yapan kullanıcı ID
 * @returns {Object} { success: boolean, message?: string, evrak?: Object, hareket?: Object }
 */
function updateDurum(id, yeniDurum, aciklama, userId) {
  // Evrak var mı kontrol et
  const existing = getById(id);
  if (!existing) {
    return { success: false, message: 'Evrak bulunamadı' };
  }
  
  const eskiDurum = existing.durum;
  
  // Durum geçişi geçerli mi?
  const validation = validateDurumTransition(eskiDurum, yeniDurum);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }
  
  // Transaction ile güncelle
  const updateDurumTx = db.transaction(() => {
    // Evrak durumunu güncelle
    const evrakQuery = `
      UPDATE evraklar 
      SET durum = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    db.prepare(evrakQuery).run(yeniDurum, id);
    
    // Hareket kaydı ekle
    const hareketQuery = `
      INSERT INTO evrak_hareketleri (evrak_id, eski_durum, yeni_durum, aciklama, created_by)
      VALUES (?, ?, ?, ?, ?)
    `;
    const hareketResult = db.prepare(hareketQuery).run(
      id,
      eskiDurum,
      yeniDurum,
      aciklama || null,
      userId
    );
    
    return hareketResult.lastInsertRowid;
  });
  
  const hareketId = updateDurumTx();
  
  // Güncel evrak ve hareket bilgisini döndür
  const evrak = getById(id);
  const hareket = db.prepare('SELECT * FROM evrak_hareketleri WHERE id = ?').get(hareketId);
  
  return { 
    success: true, 
    evrak,
    hareket
  };
}

/**
 * Toplu durum güncelleme
 * @param {number[]} ids - Evrak ID listesi
 * @param {string} yeniDurum - Yeni durum
 * @param {string} aciklama - Değişiklik açıklaması
 * @param {number} userId - İşlemi yapan kullanıcı ID
 * @returns {Object} { success: number, failed: Array<{id, message}> }
 */
function bulkUpdateDurum(ids, yeniDurum, aciklama, userId) {
  const results = {
    success: 0,
    failed: []
  };
  
  for (const id of ids) {
    const result = updateDurum(id, yeniDurum, aciklama, userId);
    if (result.success) {
      results.success++;
    } else {
      results.failed.push({ id, message: result.message });
    }
  }
  
  return results;
}

/**
 * Evrak sil (fotoğraf dosyaları dahil)
 * @param {number} id - Evrak ID
 * @returns {Object} { success: boolean, message: string }
 */
function remove(id) {
  // Önce evrak var mı kontrol et
  const existing = getById(id);
  if (!existing) {
    return { success: false, message: 'Evrak bulunamadı' };
  }
  
  // Fotoğraf dosyalarını diskten sil
  // (DB kayıtları CASCADE ile otomatik silinecek)
  try {
    deleteEvrakFolder(id);
  } catch (error) {
    // Fotoğraf silme hatası evrak silmeyi engellemesin
    // Sadece log'a yaz
    console.error(`Evrak fotoğrafları silinemedi (evrak_id: ${id}):`, error.message);
  }
  
  // Evrakı sil (CASCADE ile hareketler ve fotoğraf kayıtları da silinir)
  const deleteQuery = `DELETE FROM evraklar WHERE id = ?`;
  db.prepare(deleteQuery).run(id);
  
  return { success: true, message: 'Evrak başarıyla silindi' };
}

/**
 * Evrak hareket geçmişini getir
 * @param {number} evrakId - Evrak ID
 * @returns {Object|null} { evrak: {}, hareketler: [] } veya null
 */
function getHareketler(evrakId) {
  // Evrak var mı kontrol et
  const evrak = getById(evrakId);
  if (!evrak) return null;
  
  // Hareketleri getir (en yeniden eskiye)
  const query = `
    SELECT 
      h.*,
      u.ad_soyad as islem_yapan
    FROM evrak_hareketleri h
    LEFT JOIN users u ON h.created_by = u.id
    WHERE h.evrak_id = ?
    ORDER BY h.created_at DESC
  `;
  
  const hareketler = db.prepare(query).all(evrakId);
  
  return {
    evrak,
    hareketler
  };
}

// ============================================
// YARDIMCI FONKSİYONLAR
// ============================================

/**
 * Vade durumuna göre evrak sayılarını getir (Dashboard için)
 * @returns {Object} { bugun, buHafta, gecikmis }
 */
function getVadeOzeti() {
  const query = `
    SELECT 
      COUNT(CASE WHEN vade_tarihi = date('now') AND durum NOT IN ('tahsil', 'ciro') THEN 1 END) as bugun_adet,
      COALESCE(SUM(CASE WHEN vade_tarihi = date('now') AND durum NOT IN ('tahsil', 'ciro') THEN tutar END), 0) as bugun_tutar,
      COUNT(CASE WHEN vade_tarihi > date('now') AND vade_tarihi <= date('now', '+7 days') AND durum NOT IN ('tahsil', 'ciro') THEN 1 END) as bu_hafta_adet,
      COALESCE(SUM(CASE WHEN vade_tarihi > date('now') AND vade_tarihi <= date('now', '+7 days') AND durum NOT IN ('tahsil', 'ciro') THEN tutar END), 0) as bu_hafta_tutar,
      COUNT(CASE WHEN vade_tarihi < date('now') AND durum NOT IN ('tahsil', 'ciro') THEN 1 END) as gecikmis_adet,
      COALESCE(SUM(CASE WHEN vade_tarihi < date('now') AND durum NOT IN ('tahsil', 'ciro') THEN tutar END), 0) as gecikmis_tutar
    FROM evraklar
  `;
  
  return db.prepare(query).get();
}

/**
 * Durum bazlı özet (Dashboard için)
 * @returns {Array} [{ durum, adet, tutar }, ...]
 */
function getDurumOzeti() {
  const query = `
    SELECT 
      durum,
      COUNT(*) as adet,
      COALESCE(SUM(tutar), 0) as tutar
    FROM evraklar
    GROUP BY durum
    ORDER BY 
      CASE durum
        WHEN 'portfoy' THEN 1
        WHEN 'bankada' THEN 2
        WHEN 'ciro' THEN 3
        WHEN 'tahsil' THEN 4
        WHEN 'karsiliksiz' THEN 5
      END
  `;
  
  return db.prepare(query).all();
}

module.exports = {
  // CRUD
  getAll,
  getById,
  create,
  update,
  delete: remove,
  
  // Durum yönetimi
  updateDurum,
  bulkUpdateDurum,
  validateDurumTransition,
  
  // Hareket geçmişi
  getHareketler,
  
  // Dashboard yardımcıları
  getVadeOzeti,
  getDurumOzeti,
  
  // Sabitler
  GECERLI_DURUMLAR,
  DURUM_GECISLERI
};
