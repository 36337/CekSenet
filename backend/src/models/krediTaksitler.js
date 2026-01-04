/**
 * Kredi Taksitler Model
 * Taksit ödeme, erken ödeme ve gecikme yönetimi
 */

const db = require('./db');

// ============================================
// SABİTLER
// ============================================

/**
 * Geçerli taksit durumları
 */
const TAKSIT_DURUMLARI = ['bekliyor', 'odendi', 'gecikti'];

// ============================================
// SORGULAMA FONKSİYONLARI
// ============================================

/**
 * Krediye ait tüm taksitleri getir
 * @param {number} krediId - Kredi ID
 * @returns {Array} Taksit listesi
 */
function getByKrediId(krediId) {
  const query = `
    SELECT * FROM kredi_taksitler 
    WHERE kredi_id = ? 
    ORDER BY taksit_no ASC
  `;
  return db.prepare(query).all(krediId);
}

/**
 * Tek taksit getir
 * @param {number} taksitId - Taksit ID
 * @returns {Object|null} Taksit objesi veya null
 */
function getById(taksitId) {
  const query = `SELECT * FROM kredi_taksitler WHERE id = ?`;
  return db.prepare(query).get(taksitId) || null;
}

/**
 * Geciken taksitleri getir (tüm aktif krediler için)
 * @returns {Array} Geciken taksit listesi (kredi bilgisi ile)
 */
function getGeciken() {
  const bugun = new Date().toISOString().split('T')[0];
  
  const query = `
    SELECT 
      kt.*,
      k.kredi_turu,
      k.para_birimi,
      b.ad as banka_adi
    FROM kredi_taksitler kt
    JOIN krediler k ON kt.kredi_id = k.id
    LEFT JOIN bankalar b ON k.banka_id = b.id
    WHERE k.durum = 'aktif'
      AND kt.durum IN ('bekliyor', 'gecikti')
      AND kt.vade_tarihi < ?
    ORDER BY kt.vade_tarihi ASC
  `;
  
  return db.prepare(query).all(bugun);
}

/**
 * Bu ay ödenecek taksitleri getir
 * @returns {Array} Bu ayki taksit listesi
 */
function getBuAyOdenecek() {
  const query = `
    SELECT 
      kt.*,
      k.kredi_turu,
      k.para_birimi,
      b.ad as banka_adi
    FROM kredi_taksitler kt
    JOIN krediler k ON kt.kredi_id = k.id
    LEFT JOIN bankalar b ON k.banka_id = b.id
    WHERE k.durum = 'aktif'
      AND kt.durum IN ('bekliyor', 'gecikti')
      AND kt.vade_tarihi >= date('now', 'start of month')
      AND kt.vade_tarihi < date('now', 'start of month', '+1 month')
    ORDER BY kt.vade_tarihi ASC
  `;
  
  return db.prepare(query).all();
}

/**
 * Yaklaşan taksitleri getir (gelecek X gün)
 * @param {number} gunSayisi - Kaç gün içindeki taksitler (default 7)
 * @returns {Array} Yaklaşan taksit listesi
 */
function getYaklasan(gunSayisi = 7) {
  const query = `
    SELECT 
      kt.*,
      k.kredi_turu,
      k.para_birimi,
      b.ad as banka_adi
    FROM kredi_taksitler kt
    JOIN krediler k ON kt.kredi_id = k.id
    LEFT JOIN bankalar b ON k.banka_id = b.id
    WHERE k.durum = 'aktif'
      AND kt.durum = 'bekliyor'
      AND kt.vade_tarihi >= date('now')
      AND kt.vade_tarihi <= date('now', '+' || ? || ' days')
    ORDER BY kt.vade_tarihi ASC
  `;
  
  return db.prepare(query).all(gunSayisi);
}

// ============================================
// ÖDEME FONKSİYONLARI
// ============================================

/**
 * Tek taksit öde
 * @param {number} taksitId - Taksit ID
 * @param {Object} data - Ödeme verileri
 * @param {string} data.odeme_tarihi - Ödeme tarihi (ISO format)
 * @param {number} data.odenen_tutar - Ödenen tutar (opsiyonel, default: taksit tutarı)
 * @param {string} data.notlar - Notlar (opsiyonel)
 * @returns {Object} { success: boolean, message?: string, taksit?: Object }
 */
function odemeYap(taksitId, data) {
  const taksit = getById(taksitId);
  
  if (!taksit) {
    return { success: false, message: 'Taksit bulunamadı' };
  }
  
  if (taksit.durum === 'odendi') {
    return { success: false, message: 'Bu taksit zaten ödenmiş' };
  }
  
  // Kredinin aktif olup olmadığını kontrol et
  const kredi = db.prepare('SELECT durum FROM krediler WHERE id = ?').get(taksit.kredi_id);
  if (!kredi || kredi.durum !== 'aktif') {
    return { success: false, message: 'Kredi aktif değil, ödeme yapılamaz' };
  }
  
  const {
    odeme_tarihi = new Date().toISOString().split('T')[0],
    odenen_tutar = taksit.tutar,
    notlar
  } = data;
  
  // Transaction ile güncelle
  const odemeTransaction = db.transaction(() => {
    // Taksiti güncelle
    const updateQuery = `
      UPDATE kredi_taksitler 
      SET 
        durum = 'odendi',
        odeme_tarihi = ?,
        odenen_tutar = ?,
        notlar = COALESCE(?, notlar)
      WHERE id = ?
    `;
    
    db.prepare(updateQuery).run(
      odeme_tarihi,
      parseFloat(odenen_tutar),
      notlar || null,
      taksitId
    );
    
    // Tüm taksitler ödendi mi kontrol et
    const kalanQuery = `
      SELECT COUNT(*) as kalan 
      FROM kredi_taksitler 
      WHERE kredi_id = ? AND durum != 'odendi'
    `;
    const kalan = db.prepare(kalanQuery).get(taksit.kredi_id);
    
    // Tüm taksitler ödendiyse krediyi kapat
    if (kalan.kalan === 0) {
      db.prepare(`
        UPDATE krediler 
        SET durum = 'kapandi', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(taksit.kredi_id);
    }
  });
  
  odemeTransaction();
  
  return {
    success: true,
    message: 'Taksit ödemesi kaydedildi',
    taksit: getById(taksitId)
  };
}

/**
 * Ödemeyi iptal et (geri al)
 * @param {number} taksitId - Taksit ID
 * @returns {Object} { success: boolean, message?: string }
 */
function odemeIptal(taksitId) {
  const taksit = getById(taksitId);
  
  if (!taksit) {
    return { success: false, message: 'Taksit bulunamadı' };
  }
  
  if (taksit.durum !== 'odendi') {
    return { success: false, message: 'Bu taksit zaten ödenmemiş durumda' };
  }
  
  // Transaction ile geri al
  const iptalTransaction = db.transaction(() => {
    // Vade tarihi geçmiş mi kontrol et
    const bugun = new Date().toISOString().split('T')[0];
    const yeniDurum = taksit.vade_tarihi < bugun ? 'gecikti' : 'bekliyor';
    
    // Taksiti geri al
    const updateQuery = `
      UPDATE kredi_taksitler 
      SET 
        durum = ?,
        odeme_tarihi = NULL,
        odenen_tutar = NULL
      WHERE id = ?
    `;
    
    db.prepare(updateQuery).run(yeniDurum, taksitId);
    
    // Kredi kapalıysa tekrar aktif yap
    db.prepare(`
      UPDATE krediler 
      SET durum = 'aktif', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND durum = 'kapandi'
    `).run(taksit.kredi_id);
  });
  
  iptalTransaction();
  
  return {
    success: true,
    message: 'Taksit ödemesi iptal edildi',
    taksit: getById(taksitId)
  };
}

/**
 * Erken/toplu ödeme (kalan tüm taksitleri öde)
 * @param {number} krediId - Kredi ID
 * @param {Object} data - Ödeme verileri
 * @param {string} data.odeme_tarihi - Ödeme tarihi
 * @param {string} data.notlar - Notlar (opsiyonel)
 * @returns {Object} { success: boolean, message?: string, odenen_taksit_sayisi?: number }
 */
function erkenOdeme(krediId, data) {
  // Kredi var mı ve aktif mi kontrol et
  const kredi = db.prepare('SELECT * FROM krediler WHERE id = ?').get(krediId);
  
  if (!kredi) {
    return { success: false, message: 'Kredi bulunamadı' };
  }
  
  if (kredi.durum !== 'aktif') {
    return { success: false, message: 'Kredi aktif değil, erken ödeme yapılamaz' };
  }
  
  const {
    odeme_tarihi = new Date().toISOString().split('T')[0],
    notlar = 'Erken ödeme'
  } = data;
  
  // Bekleyen taksitleri getir
  const bekleyenler = db.prepare(`
    SELECT * FROM kredi_taksitler 
    WHERE kredi_id = ? AND durum IN ('bekliyor', 'gecikti')
  `).all(krediId);
  
  if (bekleyenler.length === 0) {
    return { success: false, message: 'Ödenmemiş taksit bulunamadı' };
  }
  
  // Toplam kalan borç hesapla
  const toplamKalan = bekleyenler.reduce((sum, t) => sum + t.tutar, 0);
  
  // Transaction ile tüm taksitleri öde
  const erkenOdemeTransaction = db.transaction(() => {
    // Tüm bekleyen taksitleri öde
    const updateQuery = `
      UPDATE kredi_taksitler 
      SET 
        durum = 'odendi',
        odeme_tarihi = ?,
        odenen_tutar = tutar,
        notlar = ?
      WHERE kredi_id = ? AND durum IN ('bekliyor', 'gecikti')
    `;
    
    db.prepare(updateQuery).run(odeme_tarihi, notlar, krediId);
    
    // Krediyi erken kapandı olarak işaretle
    db.prepare(`
      UPDATE krediler 
      SET durum = 'erken_kapandi', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(krediId);
  });
  
  erkenOdemeTransaction();
  
  return {
    success: true,
    message: 'Erken ödeme tamamlandı, kredi kapatıldı',
    odenen_taksit_sayisi: bekleyenler.length,
    odenen_tutar: Math.round(toplamKalan * 100) / 100
  };
}

// ============================================
// GECİKME YÖNETİMİ
// ============================================

/**
 * Vadesi geçmiş taksitleri 'gecikti' olarak işaretle
 * Bu fonksiyon scheduler tarafından günlük çağrılabilir
 * @returns {Object} { updated_count: number }
 */
function guncelleGecikenler() {
  const bugun = new Date().toISOString().split('T')[0];
  
  const updateQuery = `
    UPDATE kredi_taksitler 
    SET durum = 'gecikti'
    WHERE durum = 'bekliyor'
      AND vade_tarihi < ?
      AND kredi_id IN (SELECT id FROM krediler WHERE durum = 'aktif')
  `;
  
  const result = db.prepare(updateQuery).run(bugun);
  
  return {
    updated_count: result.changes
  };
}

/**
 * Gecikme özeti (Dashboard için)
 * @returns {Object} Gecikme istatistikleri
 */
function getGecikmeOzeti() {
  const query = `
    SELECT 
      COUNT(DISTINCT kt.kredi_id) as geciken_kredi_sayisi,
      COUNT(*) as geciken_taksit_sayisi,
      COALESCE(SUM(kt.tutar), 0) as geciken_toplam_tutar,
      MIN(kt.vade_tarihi) as en_eski_gecikme
    FROM kredi_taksitler kt
    JOIN krediler k ON kt.kredi_id = k.id
    WHERE k.durum = 'aktif'
      AND kt.durum IN ('bekliyor', 'gecikti')
      AND kt.vade_tarihi < date('now')
  `;
  
  const ozet = db.prepare(query).get();
  
  // Gecikme gün sayısını hesapla
  let gecikmeGunSayisi = 0;
  if (ozet.en_eski_gecikme) {
    const enEski = new Date(ozet.en_eski_gecikme);
    const bugun = new Date();
    gecikmeGunSayisi = Math.floor((bugun - enEski) / (1000 * 60 * 60 * 24));
  }
  
  return {
    geciken_kredi_sayisi: ozet.geciken_kredi_sayisi,
    geciken_taksit_sayisi: ozet.geciken_taksit_sayisi,
    geciken_toplam_tutar: Math.round(ozet.geciken_toplam_tutar * 100) / 100,
    en_eski_gecikme: ozet.en_eski_gecikme,
    max_gecikme_gun: gecikmeGunSayisi
  };
}

module.exports = {
  // Sorgulama
  getByKrediId,
  getById,
  getGeciken,
  getBuAyOdenecek,
  getYaklasan,
  
  // Ödeme
  odemeYap,
  odemeIptal,
  erkenOdeme,
  
  // Gecikme yönetimi
  guncelleGecikenler,
  getGecikmeOzeti,
  
  // Sabitler
  TAKSIT_DURUMLARI
};
