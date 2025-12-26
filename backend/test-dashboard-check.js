/**
 * Dashboard İstatistik Kontrol Scripti
 * Veritabanındaki verileri kontrol eder
 */

const path = require('path');
const dbPath = path.join(__dirname, 'database', 'ceksenet.db');
const db = require('better-sqlite3')(dbPath);

console.log('='.repeat(60));
console.log('DASHBOARD İSTATİSTİK KONTROLÜ');
console.log('='.repeat(60));

// 1. Tüm evrakları listele
console.log('\n📋 TÜM EVRAKLAR:');
const evraklar = db.prepare(`
  SELECT id, evrak_no, evrak_tipi, tutar, durum, vade_tarihi, cari_id
  FROM evraklar
  ORDER BY created_at DESC
`).all();

evraklar.forEach(e => {
  console.log(`  ${e.id}. ${e.evrak_no} | ${e.evrak_tipi} | ₺${e.tutar.toLocaleString('tr-TR')} | ${e.durum} | Vade: ${e.vade_tarihi}`);
});

// 2. Duruma göre özet
console.log('\n📊 DURUMA GÖRE ÖZET:');
const durumOzet = db.prepare(`
  SELECT durum, COUNT(*) as adet, SUM(tutar) as toplam
  FROM evraklar
  GROUP BY durum
`).all();

durumOzet.forEach(d => {
  console.log(`  ${d.durum}: ${d.adet} adet, ₺${(d.toplam || 0).toLocaleString('tr-TR')}`);
});

// 3. Vade durumu kontrol
const today = new Date().toISOString().split('T')[0];
console.log(`\n📅 BUGÜNÜN TARİHİ: ${today}`);

// Gecikmiş evraklar (vade_tarihi < bugün ve durum tahsil/karşılıksız değil)
const gecikmis = db.prepare(`
  SELECT COUNT(*) as adet, COALESCE(SUM(tutar), 0) as toplam
  FROM evraklar
  WHERE vade_tarihi < date('now')
  AND durum NOT IN ('tahsil', 'karsilsiz')
`).get();
console.log(`\n⚠️ GECİKMİŞ: ${gecikmis.adet} adet, ₺${gecikmis.toplam.toLocaleString('tr-TR')}`);

// Bugün vadesi dolan
const bugunVadeli = db.prepare(`
  SELECT COUNT(*) as adet, COALESCE(SUM(tutar), 0) as toplam
  FROM evraklar
  WHERE vade_tarihi = date('now')
  AND durum NOT IN ('tahsil', 'karsilsiz')
`).get();
console.log(`📌 BUGÜN VADELİ: ${bugunVadeli.adet} adet, ₺${bugunVadeli.toplam.toLocaleString('tr-TR')}`);

// Portföyde olanlar
const portfoy = db.prepare(`
  SELECT COUNT(*) as adet, COALESCE(SUM(tutar), 0) as toplam
  FROM evraklar
  WHERE durum = 'portfoy'
`).get();
console.log(`💼 PORTFÖY: ${portfoy.adet} adet, ₺${portfoy.toplam.toLocaleString('tr-TR')}`);

// Tahsil edilenler
const tahsil = db.prepare(`
  SELECT COUNT(*) as adet, COALESCE(SUM(tutar), 0) as toplam
  FROM evraklar
  WHERE durum = 'tahsil'
`).get();
console.log(`✅ TAHSİL: ${tahsil.adet} adet, ₺${tahsil.toplam.toLocaleString('tr-TR')}`);

// 4. Cariler
console.log('\n👥 CARİLER:');
const cariler = db.prepare(`SELECT id, unvan, tip FROM cariler`).all();
cariler.forEach(c => {
  console.log(`  ${c.id}. ${c.unvan} (${c.tip})`);
});

// 5. Son hareketler
console.log('\n🕐 SON HAREKETLER (evrak_hareketleri):');
const hareketler = db.prepare(`
  SELECT eh.*, e.evrak_no
  FROM evrak_hareketleri eh
  JOIN evraklar e ON eh.evrak_id = e.id
  ORDER BY eh.created_at DESC
  LIMIT 5
`).all();

hareketler.forEach(h => {
  console.log(`  ${h.evrak_no}: ${h.onceki_durum || 'Yeni'} → ${h.yeni_durum} (${h.aciklama || '-'})`);
});

console.log('\n' + '='.repeat(60));
db.close();
