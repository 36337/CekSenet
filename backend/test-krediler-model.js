// test-krediler-model.js
// Krediler model testleri

const Krediler = require('./src/models/krediler');

console.log('=== KREDİLER MODEL TESTLERİ ===\n');

// 1. Taksit hesaplama testi
console.log('1. Taksit Hesaplama Testi:');
console.log('   Anapara: 100,000 TL');
console.log('   Faiz: %24 yıllık');
console.log('   Vade: 12 ay');

const taksit = Krediler.taksitHesapla(100000, 24, 12);
console.log('   Aylık Taksit: ' + taksit + ' TL');
console.log('   Toplam Ödeme: ' + (taksit * 12) + ' TL');
console.log('   Toplam Faiz: ' + ((taksit * 12) - 100000) + ' TL');

// 2. Taksit listesi oluşturma testi
console.log('\n2. Taksit Listesi Testi:');
const taksitler = Krediler.taksitListesiOlustur(999, taksit, 3, '2026-01-04');
console.log('   İlk 3 taksit:');
taksitler.forEach(t => {
  console.log(`   - Taksit ${t.taksit_no}: ${t.vade_tarihi} - ${t.tutar} TL`);
});

// 3. Sabitler testi
console.log('\n3. Sabitler:');
console.log('   Kredi Türleri: ' + Krediler.KREDI_TURLERI.join(', '));
console.log('   Durumlar: ' + Krediler.KREDI_DURUMLARI.join(', '));
console.log('   Para Birimleri: ' + Krediler.PARA_BIRIMLERI.join(', '));

// 4. Genel özet testi (boş DB)
console.log('\n4. Genel Özet (mevcut veriler):');
try {
  const ozet = Krediler.getGenelOzet();
  console.log('   Toplam Kredi: ' + ozet.toplam_kredi);
  console.log('   Aktif Kredi: ' + ozet.aktif_kredi);
  console.log('   Kalan Borç: ' + ozet.kalan_borc + ' TL');
} catch (e) {
  console.log('   HATA: ' + e.message);
}

// 5. Liste testi
console.log('\n5. Liste Testi:');
try {
  const liste = Krediler.getAll({ page: 1, limit: 5 });
  console.log('   Toplam Kayıt: ' + liste.pagination.total);
  console.log('   Sayfa: ' + liste.pagination.page + '/' + liste.pagination.totalPages);
} catch (e) {
  console.log('   HATA: ' + e.message);
}

console.log('\n=== TESTLER TAMAMLANDI ===');
process.exit(0);
