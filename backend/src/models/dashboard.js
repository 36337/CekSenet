/**
 * Dashboard Model
 * İstatistikler, vade uyarıları ve özet bilgiler
 */

const db = require('./db');

// ============================================
// ANA İSTATİSTİKLER
// ============================================

/**
 * Tüm dashboard istatistiklerini getir
 * @returns {Object} Kapsamlı dashboard verileri
 */
function getOzet() {
  // Temel istatistikler
  const temelQuery = `
    SELECT 
      -- Portföy (aktif evraklar)
      COUNT(CASE WHEN durum = 'portfoy' THEN 1 END) as portfoy_adet,
      COALESCE(SUM(CASE WHEN durum = 'portfoy' THEN tutar END), 0) as portfoy_tutar,
      
      -- Bankada
      COUNT(CASE WHEN durum = 'bankada' THEN 1 END) as bankada_adet,
      COALESCE(SUM(CASE WHEN durum = 'bankada' THEN tutar END), 0) as bankada_tutar,
      
      -- Ciro edilmiş
      COUNT(CASE WHEN durum = 'ciro' THEN 1 END) as ciro_adet,
      COALESCE(SUM(CASE WHEN durum = 'ciro' THEN tutar END), 0) as ciro_tutar,
      
      -- Tahsil edilmiş
      COUNT(CASE WHEN durum = 'tahsil' THEN 1 END) as tahsil_adet,
      COALESCE(SUM(CASE WHEN durum = 'tahsil' THEN tutar END), 0) as tahsil_tutar,
      
      -- Karşılıksız
      COUNT(CASE WHEN durum = 'karsiliksiz' THEN 1 END) as karsiliksiz_adet,
      COALESCE(SUM(CASE WHEN durum = 'karsiliksiz' THEN tutar END), 0) as karsiliksiz_tutar,
      
      -- Toplam
      COUNT(*) as toplam_adet,
      COALESCE(SUM(tutar), 0) as toplam_tutar
    FROM evraklar
  `;
  const temel = db.prepare(temelQuery).get();
  
  // Vade bazlı istatistikler (sadece aktif evraklar: portfoy, bankada)
  const vadeQuery = `
    SELECT 
      -- Bugün vadesi dolan
      COUNT(CASE WHEN vade_tarihi = date('now') AND durum IN ('portfoy', 'bankada') THEN 1 END) as bugun_adet,
      COALESCE(SUM(CASE WHEN vade_tarihi = date('now') AND durum IN ('portfoy', 'bankada') THEN tutar END), 0) as bugun_tutar,
      
      -- Bu hafta vadesi dolacak (bugün hariç, önümüzdeki 7 gün)
      COUNT(CASE WHEN vade_tarihi > date('now') AND vade_tarihi <= date('now', '+7 days') AND durum IN ('portfoy', 'bankada') THEN 1 END) as bu_hafta_adet,
      COALESCE(SUM(CASE WHEN vade_tarihi > date('now') AND vade_tarihi <= date('now', '+7 days') AND durum IN ('portfoy', 'bankada') THEN tutar END), 0) as bu_hafta_tutar,
      
      -- Gecikmiş (vadesi geçmiş ama hala aktif)
      COUNT(CASE WHEN vade_tarihi < date('now') AND durum IN ('portfoy', 'bankada') THEN 1 END) as gecikmis_adet,
      COALESCE(SUM(CASE WHEN vade_tarihi < date('now') AND durum IN ('portfoy', 'bankada') THEN tutar END), 0) as gecikmis_tutar,
      
      -- Bu ay vadesi dolacak
      COUNT(CASE WHEN vade_tarihi >= date('now', 'start of month') AND vade_tarihi < date('now', 'start of month', '+1 month') AND durum IN ('portfoy', 'bankada') THEN 1 END) as bu_ay_adet,
      COALESCE(SUM(CASE WHEN vade_tarihi >= date('now', 'start of month') AND vade_tarihi < date('now', 'start of month', '+1 month') AND durum IN ('portfoy', 'bankada') THEN tutar END), 0) as bu_ay_tutar
    FROM evraklar
  `;
  const vade = db.prepare(vadeQuery).get();
  
  // Evrak tipi dağılımı
  const tipQuery = `
    SELECT 
      evrak_tipi,
      COUNT(*) as adet,
      COALESCE(SUM(tutar), 0) as tutar
    FROM evraklar
    GROUP BY evrak_tipi
  `;
  const tipDagilimi = db.prepare(tipQuery).all();
  
  return {
    portfoy: { adet: temel.portfoy_adet, tutar: temel.portfoy_tutar },
    bankada: { adet: temel.bankada_adet, tutar: temel.bankada_tutar },
    ciro: { adet: temel.ciro_adet, tutar: temel.ciro_tutar },
    tahsil: { adet: temel.tahsil_adet, tutar: temel.tahsil_tutar },
    karsiliksiz: { adet: temel.karsiliksiz_adet, tutar: temel.karsiliksiz_tutar },
    toplam: { adet: temel.toplam_adet, tutar: temel.toplam_tutar },
    vade: {
      bugun: { adet: vade.bugun_adet, tutar: vade.bugun_tutar },
      buHafta: { adet: vade.bu_hafta_adet, tutar: vade.bu_hafta_tutar },
      gecikmis: { adet: vade.gecikmis_adet, tutar: vade.gecikmis_tutar },
      buAy: { adet: vade.bu_ay_adet, tutar: vade.bu_ay_tutar }
    },
    tipDagilimi
  };
}

// ============================================
// DURUM DAĞILIMI (PIE CHART İÇİN)
// ============================================

/**
 * Durum bazlı dağılım (grafik için)
 * @returns {Array} [{ durum, label, adet, tutar, renk }, ...]
 */
function getDurumDagilimi() {
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
  
  const sonuclar = db.prepare(query).all();
  
  // Her durum için label ve renk ekle
  const durumMeta = {
    'portfoy': { label: 'Portföy', renk: '#3B82F6' },      // blue-500
    'bankada': { label: 'Bankada', renk: '#8B5CF6' },      // violet-500
    'ciro': { label: 'Ciro Edildi', renk: '#F97316' },     // orange-500
    'tahsil': { label: 'Tahsil Edildi', renk: '#22C55E' }, // green-500
    'karsiliksiz': { label: 'Karşılıksız', renk: '#EF4444' } // red-500
  };
  
  return sonuclar.map(row => ({
    durum: row.durum,
    label: durumMeta[row.durum]?.label || row.durum,
    adet: row.adet,
    tutar: row.tutar,
    renk: durumMeta[row.durum]?.renk || '#6B7280'
  }));
}

// ============================================
// AYLIK DAĞILIM (BAR CHART İÇİN)
// ============================================

/**
 * Aylık vade dağılımı (önümüzdeki 12 ay)
 * Sadece aktif evraklar (portfoy, bankada)
 * @param {number} aySayisi - Kaç ay gösterilsin (varsayılan: 12)
 * @returns {Array} [{ ay, ayLabel, adet, tutar }, ...]
 */
function getAylikVadeDagilimi(aySayisi = 12) {
  // Önümüzdeki X ay için her ay ayrı ayrı hesapla
  const sonuclar = [];
  
  for (let i = 0; i < aySayisi; i++) {
    const query = `
      SELECT 
        strftime('%Y-%m', date('now', 'start of month', '+${i} months')) as ay,
        COUNT(*) as adet,
        COALESCE(SUM(tutar), 0) as tutar
      FROM evraklar
      WHERE 
        vade_tarihi >= date('now', 'start of month', '+${i} months')
        AND vade_tarihi < date('now', 'start of month', '+${i + 1} months')
        AND durum IN ('portfoy', 'bankada')
    `;
    
    const row = db.prepare(query).get();
    
    // Ay label'ı oluştur (örn: "Ocak 2025")
    const aylar = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                   'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const [yil, ayNo] = row.ay.split('-');
    const ayLabel = `${aylar[parseInt(ayNo) - 1]} ${yil}`;
    
    sonuclar.push({
      ay: row.ay,
      ayLabel,
      adet: row.adet || 0,
      tutar: row.tutar || 0
    });
  }
  
  return sonuclar;
}

// ============================================
// SON HAREKETLER
// ============================================

/**
 * Son evrak hareketlerini getir
 * @param {number} limit - Kaç hareket getirilsin (varsayılan: 10)
 * @returns {Array} Hareket listesi
 */
function getSonHareketler(limit = 10) {
  const query = `
    SELECT 
      h.id,
      h.evrak_id,
      h.eski_durum,
      h.yeni_durum,
      h.aciklama,
      h.created_at,
      e.evrak_no,
      e.evrak_tipi,
      e.tutar,
      e.kesideci,
      u.ad_soyad as islem_yapan,
      c.ad_soyad as cari_adi
    FROM evrak_hareketleri h
    LEFT JOIN evraklar e ON h.evrak_id = e.id
    LEFT JOIN users u ON h.created_by = u.id
    LEFT JOIN cariler c ON e.cari_id = c.id
    ORDER BY h.created_at DESC
    LIMIT ?
  `;
  
  return db.prepare(query).all(limit);
}

// ============================================
// VADE UYARILARI
// ============================================

/**
 * Detaylı vade uyarıları listesi
 * @returns {Object} { bugun: [], buHafta: [], gecikmis: [] }
 */
function getVadeUyarilari() {
  // Bugün vadesi dolan
  const bugunQuery = `
    SELECT 
      e.*,
      c.ad_soyad as cari_adi,
      c.telefon as cari_telefon
    FROM evraklar e
    LEFT JOIN cariler c ON e.cari_id = c.id
    WHERE e.vade_tarihi = date('now')
      AND e.durum IN ('portfoy', 'bankada')
    ORDER BY e.tutar DESC
  `;
  const bugun = db.prepare(bugunQuery).all();
  
  // Bu hafta vadesi dolacak (bugün hariç)
  const buHaftaQuery = `
    SELECT 
      e.*,
      c.ad_soyad as cari_adi,
      c.telefon as cari_telefon
    FROM evraklar e
    LEFT JOIN cariler c ON e.cari_id = c.id
    WHERE e.vade_tarihi > date('now')
      AND e.vade_tarihi <= date('now', '+7 days')
      AND e.durum IN ('portfoy', 'bankada')
    ORDER BY e.vade_tarihi ASC, e.tutar DESC
  `;
  const buHafta = db.prepare(buHaftaQuery).all();
  
  // Gecikmiş evraklar
  const gecikmisQuery = `
    SELECT 
      e.*,
      c.ad_soyad as cari_adi,
      c.telefon as cari_telefon,
      julianday('now') - julianday(e.vade_tarihi) as gecikme_gun
    FROM evraklar e
    LEFT JOIN cariler c ON e.cari_id = c.id
    WHERE e.vade_tarihi < date('now')
      AND e.durum IN ('portfoy', 'bankada')
    ORDER BY e.vade_tarihi ASC
  `;
  const gecikmis = db.prepare(gecikmisQuery).all();
  
  return {
    bugun,
    buHafta,
    gecikmis,
    ozet: {
      bugun: { adet: bugun.length, tutar: bugun.reduce((sum, e) => sum + e.tutar, 0) },
      buHafta: { adet: buHafta.length, tutar: buHafta.reduce((sum, e) => sum + e.tutar, 0) },
      gecikmis: { adet: gecikmis.length, tutar: gecikmis.reduce((sum, e) => sum + e.tutar, 0) }
    }
  };
}

// ============================================
// CARİ İSTATİSTİKLERİ
// ============================================

/**
 * En çok evrakı olan cariler (Top 10)
 * @param {number} limit - Kaç cari getirilsin
 * @returns {Array} Cari listesi
 */
function getTopCariler(limit = 10) {
  const query = `
    SELECT 
      c.id,
      c.ad_soyad,
      c.tip,
      COUNT(e.id) as evrak_adet,
      COALESCE(SUM(e.tutar), 0) as toplam_tutar,
      COUNT(CASE WHEN e.durum IN ('portfoy', 'bankada') THEN 1 END) as aktif_evrak_adet,
      COALESCE(SUM(CASE WHEN e.durum IN ('portfoy', 'bankada') THEN e.tutar END), 0) as aktif_tutar,
      COUNT(CASE WHEN e.durum = 'karsiliksiz' THEN 1 END) as karsiliksiz_adet
    FROM cariler c
    LEFT JOIN evraklar e ON c.id = e.cari_id
    GROUP BY c.id
    HAVING evrak_adet > 0
    ORDER BY aktif_tutar DESC
    LIMIT ?
  `;
  
  return db.prepare(query).all(limit);
}

// ============================================
// ÖZET İSTATİSTİK KARTLARI
// ============================================

/**
 * Dashboard kartları için özet istatistikler
 * @returns {Array} Kart verileri
 */
function getKartlar() {
  const ozet = getOzet();
  
  return [
    {
      id: 'portfoy',
      baslik: 'Portföy',
      adet: ozet.portfoy.adet,
      tutar: ozet.portfoy.tutar,
      renk: 'blue',
      ikon: 'BanknotesIcon'
    },
    {
      id: 'bugun',
      baslik: 'Bugün Vadesi Dolan',
      adet: ozet.vade.bugun.adet,
      tutar: ozet.vade.bugun.tutar,
      renk: 'amber',
      ikon: 'ExclamationTriangleIcon'
    },
    {
      id: 'gecikmis',
      baslik: 'Gecikmiş',
      adet: ozet.vade.gecikmis.adet,
      tutar: ozet.vade.gecikmis.tutar,
      renk: 'red',
      ikon: 'XCircleIcon'
    },
    {
      id: 'tahsil',
      baslik: 'Tahsil Edilen',
      adet: ozet.tahsil.adet,
      tutar: ozet.tahsil.tutar,
      renk: 'green',
      ikon: 'CheckCircleIcon'
    }
  ];
}

module.exports = {
  getOzet,
  getDurumDagilimi,
  getAylikVadeDagilimi,
  getSonHareketler,
  getVadeUyarilari,
  getTopCariler,
  getKartlar
};
