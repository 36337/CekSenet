/**
 * Raporlar Model
 * Tarih aralığı, vade, cari bazlı raporlar ve Excel export
 */

const db = require('./db');

// ============================================
// TARİH ARALIĞI RAPORU
// ============================================

/**
 * Tarih aralığı bazlı evrak raporu
 * @param {Object} params - Filtre parametreleri
 * @param {string} params.baslangic - Başlangıç tarihi (YYYY-MM-DD)
 * @param {string} params.bitis - Bitiş tarihi (YYYY-MM-DD)
 * @param {string} params.tarih_tipi - 'vade' | 'kayit' (hangi tarihe göre filtre)
 * @param {string} params.durum - Virgülle ayrılmış durumlar (opsiyonel)
 * @param {string} params.evrak_tipi - 'cek' | 'senet' (opsiyonel)
 * @returns {Object} { ozet, detay }
 */
function tarihAraligiRaporu(params) {
  const {
    baslangic,
    bitis,
    tarih_tipi = 'vade', // 'vade' veya 'kayit'
    durum,
    evrak_tipi
  } = params;

  // Tarih alanını belirle
  const tarihAlani = tarih_tipi === 'kayit' ? 'e.created_at' : 'e.vade_tarihi';

  // WHERE koşullarını oluştur
  let whereClause = `date(${tarihAlani}) >= ? AND date(${tarihAlani}) <= ?`;
  const queryParams = [baslangic, bitis];

  // Durum filtresi
  if (durum) {
    const durumlar = durum.split(',').map(d => d.trim()).filter(Boolean);
    if (durumlar.length > 0) {
      whereClause += ` AND e.durum IN (${durumlar.map(() => '?').join(',')})`;
      queryParams.push(...durumlar);
    }
  }

  // Evrak tipi filtresi
  if (evrak_tipi && ['cek', 'senet'].includes(evrak_tipi)) {
    whereClause += ' AND e.evrak_tipi = ?';
    queryParams.push(evrak_tipi);
  }

  // Özet istatistikler
  const ozetQuery = `
    SELECT 
      COUNT(*) as toplam_adet,
      COALESCE(SUM(tutar), 0) as toplam_tutar,
      COUNT(CASE WHEN evrak_tipi = 'cek' THEN 1 END) as cek_adet,
      COALESCE(SUM(CASE WHEN evrak_tipi = 'cek' THEN tutar END), 0) as cek_tutar,
      COUNT(CASE WHEN evrak_tipi = 'senet' THEN 1 END) as senet_adet,
      COALESCE(SUM(CASE WHEN evrak_tipi = 'senet' THEN tutar END), 0) as senet_tutar,
      COUNT(CASE WHEN durum = 'portfoy' THEN 1 END) as portfoy_adet,
      COALESCE(SUM(CASE WHEN durum = 'portfoy' THEN tutar END), 0) as portfoy_tutar,
      COUNT(CASE WHEN durum = 'bankada' THEN 1 END) as bankada_adet,
      COALESCE(SUM(CASE WHEN durum = 'bankada' THEN tutar END), 0) as bankada_tutar,
      COUNT(CASE WHEN durum = 'tahsil' THEN 1 END) as tahsil_adet,
      COALESCE(SUM(CASE WHEN durum = 'tahsil' THEN tutar END), 0) as tahsil_tutar,
      COUNT(CASE WHEN durum = 'ciro' THEN 1 END) as ciro_adet,
      COALESCE(SUM(CASE WHEN durum = 'ciro' THEN tutar END), 0) as ciro_tutar,
      COUNT(CASE WHEN durum = 'karsiliksiz' THEN 1 END) as karsiliksiz_adet,
      COALESCE(SUM(CASE WHEN durum = 'karsiliksiz' THEN tutar END), 0) as karsiliksiz_tutar
    FROM evraklar e
    WHERE ${whereClause}
  `;
  const ozet = db.prepare(ozetQuery).get(...queryParams);

  // Detaylı liste
  const detayQuery = `
    SELECT 
      e.*,
      c.ad_soyad as cari_adi,
      c.tip as cari_tipi
    FROM evraklar e
    LEFT JOIN cariler c ON e.cari_id = c.id
    WHERE ${whereClause}
    ORDER BY e.vade_tarihi ASC, e.tutar DESC
  `;
  const detay = db.prepare(detayQuery).all(...queryParams);

  return {
    filtreler: {
      baslangic,
      bitis,
      tarih_tipi,
      durum: durum || 'tumu',
      evrak_tipi: evrak_tipi || 'tumu'
    },
    ozet: {
      toplam: { adet: ozet.toplam_adet, tutar: ozet.toplam_tutar },
      cek: { adet: ozet.cek_adet, tutar: ozet.cek_tutar },
      senet: { adet: ozet.senet_adet, tutar: ozet.senet_tutar },
      durumlar: {
        portfoy: { adet: ozet.portfoy_adet, tutar: ozet.portfoy_tutar },
        bankada: { adet: ozet.bankada_adet, tutar: ozet.bankada_tutar },
        tahsil: { adet: ozet.tahsil_adet, tutar: ozet.tahsil_tutar },
        ciro: { adet: ozet.ciro_adet, tutar: ozet.ciro_tutar },
        karsiliksiz: { adet: ozet.karsiliksiz_adet, tutar: ozet.karsiliksiz_tutar }
      }
    },
    detay
  };
}

// ============================================
// VADE RAPORU
// ============================================

/**
 * Önümüzdeki X gün içinde vadesi dolacak evraklar
 * @param {number} gun - Kaç gün sonrasına kadar (varsayılan: 30)
 * @param {boolean} gecikmisDahil - Gecikmiş evrakları da dahil et
 * @returns {Object} { ozet, gunluk, detay }
 */
function vadeRaporu(gun = 30, gecikmisDahil = true) {
  // Aktif evraklar için filtre
  const aktifDurumlar = "'portfoy', 'bankada'";

  // Özet istatistikler
  const ozetQuery = `
    SELECT 
      -- Gecikmiş
      COUNT(CASE WHEN vade_tarihi < date('now') THEN 1 END) as gecikmis_adet,
      COALESCE(SUM(CASE WHEN vade_tarihi < date('now') THEN tutar END), 0) as gecikmis_tutar,
      
      -- Bugün
      COUNT(CASE WHEN vade_tarihi = date('now') THEN 1 END) as bugun_adet,
      COALESCE(SUM(CASE WHEN vade_tarihi = date('now') THEN tutar END), 0) as bugun_tutar,
      
      -- Bu hafta (önümüzdeki 7 gün)
      COUNT(CASE WHEN vade_tarihi > date('now') AND vade_tarihi <= date('now', '+7 days') THEN 1 END) as bu_hafta_adet,
      COALESCE(SUM(CASE WHEN vade_tarihi > date('now') AND vade_tarihi <= date('now', '+7 days') THEN tutar END), 0) as bu_hafta_tutar,
      
      -- Bu ay
      COUNT(CASE WHEN vade_tarihi > date('now') AND vade_tarihi <= date('now', '+30 days') THEN 1 END) as bu_ay_adet,
      COALESCE(SUM(CASE WHEN vade_tarihi > date('now') AND vade_tarihi <= date('now', '+30 days') THEN tutar END), 0) as bu_ay_tutar,
      
      -- Toplam (seçilen aralık)
      COUNT(*) as toplam_adet,
      COALESCE(SUM(tutar), 0) as toplam_tutar
    FROM evraklar
    WHERE durum IN (${aktifDurumlar})
      AND vade_tarihi <= date('now', '+${gun} days')
      ${gecikmisDahil ? '' : "AND vade_tarihi >= date('now')"}
  `;
  const ozet = db.prepare(ozetQuery).get();

  // Günlük dağılım (önümüzdeki X gün)
  const gunlukQuery = `
    SELECT 
      vade_tarihi as gun,
      COUNT(*) as adet,
      COALESCE(SUM(tutar), 0) as tutar
    FROM evraklar
    WHERE durum IN (${aktifDurumlar})
      AND vade_tarihi >= date('now')
      AND vade_tarihi <= date('now', '+${gun} days')
    GROUP BY vade_tarihi
    ORDER BY vade_tarihi ASC
  `;
  const gunluk = db.prepare(gunlukQuery).all();

  // Detaylı liste
  let detayWhere = `durum IN (${aktifDurumlar}) AND vade_tarihi <= date('now', '+${gun} days')`;
  if (!gecikmisDahil) {
    detayWhere += " AND vade_tarihi >= date('now')";
  }

  const detayQuery = `
    SELECT 
      e.*,
      c.ad_soyad as cari_adi,
      c.telefon as cari_telefon,
      CASE 
        WHEN e.vade_tarihi < date('now') THEN 'gecikmis'
        WHEN e.vade_tarihi = date('now') THEN 'bugun'
        WHEN e.vade_tarihi <= date('now', '+7 days') THEN 'bu_hafta'
        ELSE 'diger'
      END as vade_durumu,
      CAST(julianday(e.vade_tarihi) - julianday('now') AS INTEGER) as kalan_gun
    FROM evraklar e
    LEFT JOIN cariler c ON e.cari_id = c.id
    WHERE ${detayWhere}
    ORDER BY e.vade_tarihi ASC, e.tutar DESC
  `;
  const detay = db.prepare(detayQuery).all();

  return {
    filtreler: {
      gun,
      gecikmisDahil
    },
    ozet: {
      gecikmis: { adet: ozet.gecikmis_adet, tutar: ozet.gecikmis_tutar },
      bugun: { adet: ozet.bugun_adet, tutar: ozet.bugun_tutar },
      buHafta: { adet: ozet.bu_hafta_adet, tutar: ozet.bu_hafta_tutar },
      buAy: { adet: ozet.bu_ay_adet, tutar: ozet.bu_ay_tutar },
      toplam: { adet: ozet.toplam_adet, tutar: ozet.toplam_tutar }
    },
    gunluk,
    detay
  };
}

// ============================================
// CARİ BAZLI RAPOR
// ============================================

/**
 * Belirli bir carinin evrak raporu
 * @param {number} cariId - Cari ID
 * @returns {Object|null} { cari, ozet, detay } veya null
 */
function cariRaporu(cariId) {
  // Cari bilgisi
  const cariQuery = `
    SELECT * FROM cariler WHERE id = ?
  `;
  const cari = db.prepare(cariQuery).get(cariId);

  if (!cari) {
    return null;
  }

  // Özet istatistikler
  const ozetQuery = `
    SELECT 
      COUNT(*) as toplam_adet,
      COALESCE(SUM(tutar), 0) as toplam_tutar,
      
      -- Evrak tipi
      COUNT(CASE WHEN evrak_tipi = 'cek' THEN 1 END) as cek_adet,
      COALESCE(SUM(CASE WHEN evrak_tipi = 'cek' THEN tutar END), 0) as cek_tutar,
      COUNT(CASE WHEN evrak_tipi = 'senet' THEN 1 END) as senet_adet,
      COALESCE(SUM(CASE WHEN evrak_tipi = 'senet' THEN tutar END), 0) as senet_tutar,
      
      -- Durumlar
      COUNT(CASE WHEN durum = 'portfoy' THEN 1 END) as portfoy_adet,
      COALESCE(SUM(CASE WHEN durum = 'portfoy' THEN tutar END), 0) as portfoy_tutar,
      COUNT(CASE WHEN durum = 'bankada' THEN 1 END) as bankada_adet,
      COALESCE(SUM(CASE WHEN durum = 'bankada' THEN tutar END), 0) as bankada_tutar,
      COUNT(CASE WHEN durum = 'tahsil' THEN 1 END) as tahsil_adet,
      COALESCE(SUM(CASE WHEN durum = 'tahsil' THEN tutar END), 0) as tahsil_tutar,
      COUNT(CASE WHEN durum = 'ciro' THEN 1 END) as ciro_adet,
      COALESCE(SUM(CASE WHEN durum = 'ciro' THEN tutar END), 0) as ciro_tutar,
      COUNT(CASE WHEN durum = 'karsiliksiz' THEN 1 END) as karsiliksiz_adet,
      COALESCE(SUM(CASE WHEN durum = 'karsiliksiz' THEN tutar END), 0) as karsiliksiz_tutar,
      
      -- Aktif evraklar
      COUNT(CASE WHEN durum IN ('portfoy', 'bankada') THEN 1 END) as aktif_adet,
      COALESCE(SUM(CASE WHEN durum IN ('portfoy', 'bankada') THEN tutar END), 0) as aktif_tutar,
      
      -- Gecikmiş
      COUNT(CASE WHEN vade_tarihi < date('now') AND durum IN ('portfoy', 'bankada') THEN 1 END) as gecikmis_adet,
      COALESCE(SUM(CASE WHEN vade_tarihi < date('now') AND durum IN ('portfoy', 'bankada') THEN tutar END), 0) as gecikmis_tutar
    FROM evraklar
    WHERE cari_id = ?
  `;
  const ozetRow = db.prepare(ozetQuery).get(cariId);

  // Detaylı evrak listesi
  const detayQuery = `
    SELECT 
      e.*,
      CASE 
        WHEN e.durum IN ('tahsil', 'ciro') THEN 'kapali'
        WHEN e.vade_tarihi < date('now') THEN 'gecikmis'
        WHEN e.vade_tarihi = date('now') THEN 'bugun'
        WHEN e.vade_tarihi <= date('now', '+7 days') THEN 'bu_hafta'
        ELSE 'normal'
      END as vade_durumu
    FROM evraklar e
    WHERE e.cari_id = ?
    ORDER BY 
      CASE e.durum
        WHEN 'portfoy' THEN 1
        WHEN 'bankada' THEN 2
        WHEN 'karsiliksiz' THEN 3
        WHEN 'ciro' THEN 4
        WHEN 'tahsil' THEN 5
      END,
      e.vade_tarihi ASC
  `;
  const detay = db.prepare(detayQuery).all(cariId);

  return {
    cari,
    ozet: {
      toplam: { adet: ozetRow.toplam_adet, tutar: ozetRow.toplam_tutar },
      cek: { adet: ozetRow.cek_adet, tutar: ozetRow.cek_tutar },
      senet: { adet: ozetRow.senet_adet, tutar: ozetRow.senet_tutar },
      aktif: { adet: ozetRow.aktif_adet, tutar: ozetRow.aktif_tutar },
      gecikmis: { adet: ozetRow.gecikmis_adet, tutar: ozetRow.gecikmis_tutar },
      durumlar: {
        portfoy: { adet: ozetRow.portfoy_adet, tutar: ozetRow.portfoy_tutar },
        bankada: { adet: ozetRow.bankada_adet, tutar: ozetRow.bankada_tutar },
        tahsil: { adet: ozetRow.tahsil_adet, tutar: ozetRow.tahsil_tutar },
        ciro: { adet: ozetRow.ciro_adet, tutar: ozetRow.ciro_tutar },
        karsiliksiz: { adet: ozetRow.karsiliksiz_adet, tutar: ozetRow.karsiliksiz_tutar }
      }
    },
    detay
  };
}

// ============================================
// TÜM CARİLER ÖZET RAPORU
// ============================================

/**
 * Tüm carilerin özet raporu
 * @param {Object} params - Filtre parametreleri
 * @param {string} params.tip - 'musteri' | 'tedarikci' (opsiyonel)
 * @param {string} params.siralama - 'tutar' | 'adet' | 'ad' (varsayılan: tutar)
 * @returns {Object} { ozet, cariler }
 */
function tumCarilerRaporu(params = {}) {
  const { tip, siralama = 'tutar' } = params;

  // WHERE koşulu
  let whereClause = '1=1';
  const queryParams = [];

  if (tip && ['musteri', 'tedarikci'].includes(tip)) {
    whereClause += ' AND c.tip = ?';
    queryParams.push(tip);
  }

  // Sıralama
  let orderBy = 'aktif_tutar DESC';
  if (siralama === 'adet') {
    orderBy = 'evrak_adet DESC';
  } else if (siralama === 'ad') {
    orderBy = 'c.ad_soyad ASC';
  }

  // Cari bazlı özet
  const cariQuery = `
    SELECT 
      c.id,
      c.ad_soyad,
      c.tip,
      c.telefon,
      COUNT(e.id) as evrak_adet,
      COALESCE(SUM(e.tutar), 0) as toplam_tutar,
      COUNT(CASE WHEN e.durum IN ('portfoy', 'bankada') THEN 1 END) as aktif_adet,
      COALESCE(SUM(CASE WHEN e.durum IN ('portfoy', 'bankada') THEN e.tutar END), 0) as aktif_tutar,
      COUNT(CASE WHEN e.durum = 'tahsil' THEN 1 END) as tahsil_adet,
      COALESCE(SUM(CASE WHEN e.durum = 'tahsil' THEN e.tutar END), 0) as tahsil_tutar,
      COUNT(CASE WHEN e.durum = 'karsiliksiz' THEN 1 END) as karsiliksiz_adet,
      COUNT(CASE WHEN e.vade_tarihi < date('now') AND e.durum IN ('portfoy', 'bankada') THEN 1 END) as gecikmis_adet
    FROM cariler c
    LEFT JOIN evraklar e ON c.id = e.cari_id
    WHERE ${whereClause}
    GROUP BY c.id
    HAVING evrak_adet > 0
    ORDER BY ${orderBy}
  `;
  const cariler = db.prepare(cariQuery).all(...queryParams);

  // Genel özet
  const ozet = {
    cariSayisi: cariler.length,
    toplamEvrak: cariler.reduce((sum, c) => sum + c.evrak_adet, 0),
    toplamTutar: cariler.reduce((sum, c) => sum + c.toplam_tutar, 0),
    aktifTutar: cariler.reduce((sum, c) => sum + c.aktif_tutar, 0),
    tahsilTutar: cariler.reduce((sum, c) => sum + c.tahsil_tutar, 0),
    karsiliksizSayisi: cariler.reduce((sum, c) => sum + c.karsiliksiz_adet, 0),
    gecikmisCariler: cariler.filter(c => c.gecikmis_adet > 0).length
  };

  return {
    filtreler: { tip: tip || 'tumu', siralama },
    ozet,
    cariler
  };
}

// ============================================
// EXCEL EXPORT İÇİN VERİ
// ============================================

/**
 * Excel export için evrak verisi hazırla
 * @param {Object} params - Filtre parametreleri (tarihAraligiRaporu ile aynı)
 * @returns {Array} Excel satırları için hazır veri
 */
function excelVerisiHazirla(params) {
  const rapor = tarihAraligiRaporu(params);

  // Excel için düz veri formatı
  return rapor.detay.map(evrak => ({
    'Evrak No': evrak.evrak_no,
    'Evrak Tipi': evrak.evrak_tipi === 'cek' ? 'Çek' : 'Senet',
    'Tutar': evrak.tutar,
    'Vade Tarihi': evrak.vade_tarihi,
    'Durum': getDurumLabel(evrak.durum),
    'Cari': evrak.cari_adi || '-',
    'Cari Tipi': evrak.cari_tipi === 'musteri' ? 'Müşteri' : (evrak.cari_tipi === 'tedarikci' ? 'Tedarikçi' : '-'),
    'Keşideci': evrak.kesideci || '-',
    'Banka': evrak.banka_adi || '-',
    'Kayıt Tarihi': evrak.created_at ? evrak.created_at.split('T')[0] : '-',
    'Notlar': evrak.notlar || '-'
  }));
}

/**
 * Durum kodunu Türkçe label'a çevir
 */
function getDurumLabel(durum) {
  const labels = {
    'portfoy': 'Portföy',
    'bankada': 'Bankada',
    'ciro': 'Ciro Edildi',
    'tahsil': 'Tahsil Edildi',
    'karsiliksiz': 'Karşılıksız'
  };
  return labels[durum] || durum;
}

module.exports = {
  tarihAraligiRaporu,
  vadeRaporu,
  cariRaporu,
  tumCarilerRaporu,
  excelVerisiHazirla,
  getDurumLabel
};
