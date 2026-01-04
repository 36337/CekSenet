/**
 * Krediler Model
 * Kredi CRUD işlemleri, taksit hesaplama ve özet fonksiyonlar
 */

const db = require('./db');

// ============================================
// SABİTLER
// ============================================

/**
 * Geçerli kredi türleri
 */
const KREDI_TURLERI = ['tuketici', 'konut', 'tasit', 'ticari', 'isletme', 'diger'];

/**
 * Kredi türü etiketleri (görüntüleme için)
 */
const KREDI_TURU_ETIKETLER = {
  'tuketici': 'Tüketici Kredisi',
  'konut': 'Konut Kredisi',
  'tasit': 'Taşıt Kredisi',
  'ticari': 'Ticari Kredi',
  'isletme': 'İşletme Kredisi',
  'diger': 'Diğer'
};

/**
 * Geçerli kredi durumları
 */
const KREDI_DURUMLARI = ['aktif', 'kapandi', 'erken_kapandi'];

/**
 * Geçerli para birimleri
 */
const PARA_BIRIMLERI = ['TRY', 'USD', 'EUR', 'GBP', 'CHF'];

// ============================================
// TAKSİT HESAPLAMA
// ============================================

/**
 * Aylık taksit tutarını hesapla (eşit taksitli / anuity)
 * @param {number} anapara - Anapara tutarı
 * @param {number} yillikFaiz - Yıllık faiz oranı (%)
 * @param {number} vadeAy - Vade süresi (ay)
 * @returns {number} Aylık taksit tutarı
 */
function taksitHesapla(anapara, yillikFaiz, vadeAy) {
  const aylikFaiz = yillikFaiz / 100 / 12;
  
  // Faizsiz kredi durumu
  if (aylikFaiz === 0) {
    return Math.round((anapara / vadeAy) * 100) / 100;
  }
  
  // Anuity formülü: P * [r(1+r)^n] / [(1+r)^n - 1]
  const taksit = anapara * 
    (aylikFaiz * Math.pow(1 + aylikFaiz, vadeAy)) / 
    (Math.pow(1 + aylikFaiz, vadeAy) - 1);
  
  return Math.round(taksit * 100) / 100;
}

/**
 * Taksit listesi oluştur (tarihler ve tutarlar)
 * @param {number} krediId - Kredi ID
 * @param {number} aylikTaksit - Aylık taksit tutarı
 * @param {number} vadeAy - Vade süresi (ay)
 * @param {string} baslangicTarihi - Başlangıç tarihi (ISO format)
 * @returns {Array} Taksit listesi
 */
function taksitListesiOlustur(krediId, aylikTaksit, vadeAy, baslangicTarihi) {
  const taksitler = [];
  const baslangic = new Date(baslangicTarihi);
  
  for (let i = 1; i <= vadeAy; i++) {
    // Her taksit bir ay sonra
    const vadeTarihi = new Date(baslangic);
    vadeTarihi.setMonth(vadeTarihi.getMonth() + i);
    
    taksitler.push({
      kredi_id: krediId,
      taksit_no: i,
      vade_tarihi: vadeTarihi.toISOString().split('T')[0], // YYYY-MM-DD
      tutar: aylikTaksit,
      durum: 'bekliyor'
    });
  }
  
  return taksitler;
}

// ============================================
// KREDİ CRUD FONKSİYONLARI
// ============================================

/**
 * Tüm kredileri getir (filtreleme ve sayfalama)
 * @param {Object} filters - Filtre parametreleri
 * @returns {Object} { data: [], pagination: {} }
 */
function getAll(filters = {}) {
  const {
    durum,           // 'aktif', 'kapandi', 'erken_kapandi'
    kredi_turu,      // kredi türü filtresi
    banka_id,        // banka filtresi
    sort = 'baslangic_tarihi',
    order = 'desc',
    page = 1,
    limit = 20
  } = filters;
  
  // Base query
  let whereClause = '1=1';
  const params = [];
  
  // Durum filtresi
  if (durum && KREDI_DURUMLARI.includes(durum)) {
    whereClause += ' AND k.durum = ?';
    params.push(durum);
  }
  
  // Kredi türü filtresi
  if (kredi_turu && KREDI_TURLERI.includes(kredi_turu)) {
    whereClause += ' AND k.kredi_turu = ?';
    params.push(kredi_turu);
  }
  
  // Banka filtresi
  if (banka_id) {
    whereClause += ' AND k.banka_id = ?';
    params.push(parseInt(banka_id));
  }
  
  // Toplam kayıt sayısı
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM krediler k 
    WHERE ${whereClause}
  `;
  const countResult = db.prepare(countQuery).get(...params);
  const total = countResult.total;
  
  // Sayfalama hesaplaması
  const offset = (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);
  
  // Sıralama validasyonu
  const allowedSortFields = ['baslangic_tarihi', 'anapara', 'created_at', 'aylik_taksit'];
  const sortField = allowedSortFields.includes(sort) ? sort : 'baslangic_tarihi';
  const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  
  // Ana sorgu (banka bilgisi ile)
  const dataQuery = `
    SELECT 
      k.*,
      b.ad as banka_adi,
      (SELECT COUNT(*) FROM kredi_taksitler WHERE kredi_id = k.id AND durum = 'odendi') as odenen_taksit_sayisi,
      (SELECT COUNT(*) FROM kredi_taksitler WHERE kredi_id = k.id AND durum = 'bekliyor') as kalan_taksit_sayisi,
      (SELECT COUNT(*) FROM kredi_taksitler WHERE kredi_id = k.id AND durum = 'gecikti') as geciken_taksit_sayisi,
      (SELECT COALESCE(SUM(odenen_tutar), 0) FROM kredi_taksitler WHERE kredi_id = k.id AND durum = 'odendi') as odenen_toplam,
      (SELECT COALESCE(SUM(tutar), 0) FROM kredi_taksitler WHERE kredi_id = k.id AND durum IN ('bekliyor', 'gecikti')) as kalan_borc
    FROM krediler k
    LEFT JOIN bankalar b ON k.banka_id = b.id
    WHERE ${whereClause}
    ORDER BY k.${sortField} ${sortOrder}
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
 * ID ile kredi getir (taksitlerle birlikte)
 * @param {number} id - Kredi ID
 * @returns {Object|null} Kredi objesi (taksitlerle) veya null
 */
function getById(id) {
  const krediQuery = `
    SELECT 
      k.*,
      b.ad as banka_adi,
      u.ad_soyad as olusturan_adi
    FROM krediler k
    LEFT JOIN bankalar b ON k.banka_id = b.id
    LEFT JOIN users u ON k.created_by = u.id
    WHERE k.id = ?
  `;
  
  const kredi = db.prepare(krediQuery).get(id);
  if (!kredi) return null;
  
  // Taksitleri getir
  const taksitlerQuery = `
    SELECT * FROM kredi_taksitler 
    WHERE kredi_id = ? 
    ORDER BY taksit_no ASC
  `;
  const taksitler = db.prepare(taksitlerQuery).all(id);
  
  // Özet hesapla
  const ozet = hesaplaOzet(taksitler);
  
  return {
    ...kredi,
    taksitler,
    ozet
  };
}

/**
 * Yeni kredi oluştur (taksitler otomatik oluşturulur)
 * @param {Object} data - Kredi verileri
 * @param {number} userId - Oluşturan kullanıcı ID
 * @returns {Object} Oluşturulan kredi (taksitlerle)
 */
function create(data, userId) {
  const {
    banka_id,
    kredi_turu,
    anapara,
    faiz_orani,
    vade_ay,
    baslangic_tarihi,
    para_birimi = 'TRY',
    notlar
  } = data;
  
  // Taksit hesapla
  const aylikTaksit = taksitHesapla(anapara, faiz_orani, vade_ay);
  const toplamOdeme = aylikTaksit * vade_ay;
  
  // Transaction başlat
  const insertKredi = db.transaction(() => {
    // Kredi ekle
    const krediQuery = `
      INSERT INTO krediler (
        banka_id, kredi_turu, anapara, faiz_orani, vade_ay,
        baslangic_tarihi, aylik_taksit, toplam_odeme, para_birimi,
        notlar, durum, created_by, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aktif', ?, CURRENT_TIMESTAMP)
    `;
    
    const krediResult = db.prepare(krediQuery).run(
      banka_id || null,
      kredi_turu,
      parseFloat(anapara),
      parseFloat(faiz_orani),
      parseInt(vade_ay),
      baslangic_tarihi,
      aylikTaksit,
      toplamOdeme,
      para_birimi,
      notlar || null,
      userId
    );
    
    const krediId = krediResult.lastInsertRowid;
    
    // Taksitleri oluştur
    const taksitler = taksitListesiOlustur(krediId, aylikTaksit, vade_ay, baslangic_tarihi);
    
    const taksitQuery = `
      INSERT INTO kredi_taksitler (kredi_id, taksit_no, vade_tarihi, tutar, durum)
      VALUES (?, ?, ?, ?, ?)
    `;
    const taksitStmt = db.prepare(taksitQuery);
    
    for (const taksit of taksitler) {
      taksitStmt.run(
        taksit.kredi_id,
        taksit.taksit_no,
        taksit.vade_tarihi,
        taksit.tutar,
        taksit.durum
      );
    }
    
    return krediId;
  });
  
  const krediId = insertKredi();
  return getById(krediId);
}

/**
 * Kredi güncelle (taksitler korunur, durum değişmez)
 * @param {number} id - Kredi ID
 * @param {Object} data - Güncellenecek veriler
 * @param {number} userId - Güncelleyen kullanıcı ID
 * @returns {Object|null} Güncellenen kredi veya null
 */
function update(id, data, userId) {
  const existing = getById(id);
  if (!existing) return null;
  
  const {
    banka_id,
    notlar
  } = data;
  
  // Sadece bazı alanlar güncellenebilir (anapara, faiz, vade değiştirilemez)
  const query = `
    UPDATE krediler 
    SET 
      banka_id = ?,
      notlar = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.prepare(query).run(
    banka_id || null,
    notlar || null,
    id
  );
  
  return getById(id);
}

/**
 * Kredi sil (taksitler CASCADE ile silinir)
 * @param {number} id - Kredi ID
 * @returns {Object} { success: boolean, message: string }
 */
function remove(id) {
  const existing = getById(id);
  if (!existing) {
    return { success: false, message: 'Kredi bulunamadı' };
  }
  
  // Ödenmiş taksit var mı kontrol et
  if (existing.ozet.odenen_taksit > 0) {
    return { 
      success: false, 
      message: 'Ödemesi yapılmış kredi silinemez. Önce tüm ödemeleri iptal edin.' 
    };
  }
  
  const deleteQuery = `DELETE FROM krediler WHERE id = ?`;
  db.prepare(deleteQuery).run(id);
  
  return { success: true, message: 'Kredi başarıyla silindi' };
}

// ============================================
// ÖZET HESAPLAMA
// ============================================

/**
 * Taksit listesinden özet hesapla
 * @param {Array} taksitler - Taksit listesi
 * @returns {Object} Özet bilgiler
 */
function hesaplaOzet(taksitler) {
  const ozet = {
    toplam_taksit: taksitler.length,
    odenen_taksit: 0,
    kalan_taksit: 0,
    geciken_taksit: 0,
    odenen_tutar: 0,
    kalan_borc: 0,
    geciken_tutar: 0
  };
  
  const bugun = new Date().toISOString().split('T')[0];
  
  for (const taksit of taksitler) {
    if (taksit.durum === 'odendi') {
      ozet.odenen_taksit++;
      ozet.odenen_tutar += taksit.odenen_tutar || taksit.tutar;
    } else if (taksit.durum === 'gecikti' || (taksit.durum === 'bekliyor' && taksit.vade_tarihi < bugun)) {
      ozet.geciken_taksit++;
      ozet.geciken_tutar += taksit.tutar;
      ozet.kalan_borc += taksit.tutar;
    } else {
      ozet.kalan_taksit++;
      ozet.kalan_borc += taksit.tutar;
    }
  }
  
  // Yuvarla
  ozet.odenen_tutar = Math.round(ozet.odenen_tutar * 100) / 100;
  ozet.kalan_borc = Math.round(ozet.kalan_borc * 100) / 100;
  ozet.geciken_tutar = Math.round(ozet.geciken_tutar * 100) / 100;
  
  return ozet;
}

/**
 * Tüm krediler için genel özet (Dashboard için)
 * @returns {Object} Genel özet
 */
function getGenelOzet() {
  const query = `
    SELECT 
      COUNT(*) as toplam_kredi,
      COUNT(CASE WHEN durum = 'aktif' THEN 1 END) as aktif_kredi,
      COALESCE(SUM(CASE WHEN durum = 'aktif' THEN anapara END), 0) as toplam_anapara,
      COALESCE(SUM(CASE WHEN durum = 'aktif' THEN toplam_odeme END), 0) as toplam_odeme
    FROM krediler
  `;
  
  const krediOzet = db.prepare(query).get();
  
  // Bu ay ödenecek taksitler
  const taksitQuery = `
    SELECT 
      COUNT(*) as bu_ay_taksit_adet,
      COALESCE(SUM(tutar), 0) as bu_ay_taksit_tutar
    FROM kredi_taksitler kt
    JOIN krediler k ON kt.kredi_id = k.id
    WHERE k.durum = 'aktif'
      AND kt.durum IN ('bekliyor', 'gecikti')
      AND kt.vade_tarihi >= date('now', 'start of month')
      AND kt.vade_tarihi < date('now', 'start of month', '+1 month')
  `;
  
  const taksitOzet = db.prepare(taksitQuery).get();
  
  // Geciken taksitler
  const gecikenQuery = `
    SELECT 
      COUNT(*) as geciken_taksit_adet,
      COALESCE(SUM(kt.tutar), 0) as geciken_taksit_tutar
    FROM kredi_taksitler kt
    JOIN krediler k ON kt.kredi_id = k.id
    WHERE k.durum = 'aktif'
      AND kt.durum IN ('bekliyor', 'gecikti')
      AND kt.vade_tarihi < date('now')
  `;
  
  const gecikenOzet = db.prepare(gecikenQuery).get();
  
  // Toplam kalan borç
  const kalanBorcQuery = `
    SELECT COALESCE(SUM(kt.tutar), 0) as kalan_borc
    FROM kredi_taksitler kt
    JOIN krediler k ON kt.kredi_id = k.id
    WHERE k.durum = 'aktif'
      AND kt.durum IN ('bekliyor', 'gecikti')
  `;
  
  const kalanBorc = db.prepare(kalanBorcQuery).get();
  
  return {
    toplam_kredi: krediOzet.toplam_kredi,
    aktif_kredi: krediOzet.aktif_kredi,
    toplam_anapara: Math.round(krediOzet.toplam_anapara * 100) / 100,
    toplam_odeme: Math.round(krediOzet.toplam_odeme * 100) / 100,
    kalan_borc: Math.round(kalanBorc.kalan_borc * 100) / 100,
    bu_ay_taksit_adet: taksitOzet.bu_ay_taksit_adet,
    bu_ay_taksit_tutar: Math.round(taksitOzet.bu_ay_taksit_tutar * 100) / 100,
    geciken_taksit_adet: gecikenOzet.geciken_taksit_adet,
    geciken_taksit_tutar: Math.round(gecikenOzet.geciken_taksit_tutar * 100) / 100
  };
}

module.exports = {
  // CRUD
  getAll,
  getById,
  create,
  update,
  delete: remove,
  
  // Hesaplama
  taksitHesapla,
  taksitListesiOlustur,
  hesaplaOzet,
  getGenelOzet,
  
  // Sabitler
  KREDI_TURLERI,
  KREDI_TURU_ETIKETLER,
  KREDI_DURUMLARI,
  PARA_BIRIMLERI
};
