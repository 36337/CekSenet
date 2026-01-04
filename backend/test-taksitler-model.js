// test-taksitler-model.js
// Kredi Taksitler model testleri

const KrediTaksitler = require('./src/models/krediTaksitler');
const Krediler = require('./src/models/krediler');

console.log('=== KREDİ TAKSİTLER MODEL TESTLERİ ===\n');

// 1. Sabitler
console.log('1. Sabitler:');
console.log('   Taksit Durumları: ' + KrediTaksitler.TAKSIT_DURUMLARI.join(', '));

// 2. Geciken taksitler
console.log('\n2. Geciken Taksitler:');
try {
  const geciken = KrediTaksitler.getGeciken();
  console.log('   Geciken Taksit Sayısı: ' + geciken.length);
} catch (e) {
  console.log('   HATA: ' + e.message);
}

// 3. Bu ay ödenecek
console.log('\n3. Bu Ay Ödenecek Taksitler:');
try {
  const buAy = KrediTaksitler.getBuAyOdenecek();
  console.log('   Bu Ay Taksit Sayısı: ' + buAy.length);
} catch (e) {
  console.log('   HATA: ' + e.message);
}

// 4. Yaklaşan taksitler (7 gün)
console.log('\n4. Yaklaşan Taksitler (7 gün):');
try {
  const yaklasan = KrediTaksitler.getYaklasan(7);
  console.log('   Yaklaşan Taksit Sayısı: ' + yaklasan.length);
} catch (e) {
  console.log('   HATA: ' + e.message);
}

// 5. Gecikme özeti
console.log('\n5. Gecikme Özeti:');
try {
  const ozet = KrediTaksitler.getGecikmeOzeti();
  console.log('   Geciken Kredi: ' + ozet.geciken_kredi_sayisi);
  console.log('   Geciken Taksit: ' + ozet.geciken_taksit_sayisi);
  console.log('   Geciken Tutar: ' + ozet.geciken_toplam_tutar + ' TL');
} catch (e) {
  console.log('   HATA: ' + e.message);
}

// 6. Gecikenler güncelleme (dry run - zaten boş)
console.log('\n6. Gecikenler Güncelleme:');
try {
  const guncelleme = KrediTaksitler.guncelleGecikenler();
  console.log('   Güncellenen Taksit: ' + guncelleme.updated_count);
} catch (e) {
  console.log('   HATA: ' + e.message);
}

// 7. Test kredi oluştur ve taksitleri kontrol et
console.log('\n7. Test Kredisi Oluştur:');
try {
  const testKredi = Krediler.create({
    kredi_turu: 'tuketici',
    anapara: 10000,
    faiz_orani: 36,
    vade_ay: 6,
    baslangic_tarihi: '2026-01-01',
    notlar: 'Test kredisi'
  }, 1);
  
  console.log('   Kredi ID: ' + testKredi.id);
  console.log('   Aylık Taksit: ' + testKredi.aylik_taksit + ' TL');
  console.log('   Taksit Sayısı: ' + testKredi.taksitler.length);
  
  // Taksitleri listele
  const taksitler = KrediTaksitler.getByKrediId(testKredi.id);
  console.log('\n   Taksitler:');
  taksitler.forEach(t => {
    console.log(`     ${t.taksit_no}. ${t.vade_tarihi} - ${t.tutar} TL (${t.durum})`);
  });
  
  // İlk taksiti öde
  console.log('\n8. İlk Taksiti Öde:');
  const odeme = KrediTaksitler.odemeYap(taksitler[0].id, {
    odeme_tarihi: '2026-01-05',
    notlar: 'Test ödemesi'
  });
  console.log('   Sonuç: ' + odeme.message);
  console.log('   Yeni Durum: ' + odeme.taksit.durum);
  
  // Ödemeyi iptal et
  console.log('\n9. Ödemeyi İptal Et:');
  const iptal = KrediTaksitler.odemeIptal(taksitler[0].id);
  console.log('   Sonuç: ' + iptal.message);
  
  // Test krediyi sil
  console.log('\n10. Test Kredisini Sil:');
  const silme = Krediler.delete(testKredi.id);
  console.log('   Sonuç: ' + silme.message);
  
} catch (e) {
  console.log('   HATA: ' + e.message);
  console.log('   Stack: ' + e.stack);
}

console.log('\n=== TESTLER TAMAMLANDI ===');
process.exit(0);
