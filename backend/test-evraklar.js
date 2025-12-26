/**
 * Evraklar API Test Script
 * Tüm endpoint'leri ve durum akışını test eder
 */

const http = require('http');

const BASE_URL = 'http://localhost:7475';
let TOKEN = '';

// Helper: HTTP request
function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (TOKEN) {
      options.headers['Authorization'] = `Bearer ${TOKEN}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test functions
async function runTests() {
  console.log('═══════════════════════════════════════════');
  console.log('        EVRAKLAR API TEST SUITE');
  console.log('═══════════════════════════════════════════\n');

  let testsPassed = 0;
  let testsFailed = 0;
  let createdEvrakId = null;
  let createdEvrakId2 = null;
  let createdCariId = null;

  // Test 1: Login
  console.log('📌 Test 1: Login');
  try {
    const res = await request('POST', '/api/auth/login', {
      username: 'admin',
      password: '123456'
    });
    if (res.status === 200 && res.data.token) {
      TOKEN = res.data.token;
      console.log('   ✅ PASSED - Token alındı\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Token alınamadı\n');
      testsFailed++;
      return;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
    return;
  }

  // Test 2: Önce bir cari oluştur (evrak bağlamak için)
  console.log('📌 Test 2: Cari oluştur (evrak testi için)');
  try {
    const res = await request('POST', '/api/cariler', {
      ad_soyad: 'Test Müşteri A.Ş.',
      tip: 'musteri',
      telefon: '0212 555 1234'
    });
    if (res.status === 201 && res.data.cari) {
      createdCariId = res.data.cari.id;
      console.log(`   ✅ PASSED - Cari ID: ${createdCariId}\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 3: Boş liste
  console.log('📌 Test 3: GET /api/evraklar (boş liste)');
  try {
    const res = await request('GET', '/api/evraklar');
    if (res.status === 200 && res.data.pagination) {
      console.log(`   ✅ PASSED - Toplam: ${res.data.pagination.total} evrak\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Beklenmeyen response\n', res.data);
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 4: Yeni çek ekle
  console.log('📌 Test 4: POST /api/evraklar (çek ekle)');
  try {
    const res = await request('POST', '/api/evraklar', {
      evrak_tipi: 'cek',
      evrak_no: 'CHK-001',
      tutar: 15000.50,
      vade_tarihi: '2025-02-15',
      banka_adi: 'Garanti Bankası',
      kesideci: 'Ahmet Yılmaz',
      cari_id: createdCariId,
      notlar: 'Test çek'
    });
    if (res.status === 201 && res.data.evrak) {
      createdEvrakId = res.data.evrak.id;
      console.log(`   ✅ PASSED - Evrak ID: ${createdEvrakId}, Durum: ${res.data.evrak.durum}\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 5: Yeni senet ekle
  console.log('📌 Test 5: POST /api/evraklar (senet ekle)');
  try {
    const res = await request('POST', '/api/evraklar', {
      evrak_tipi: 'senet',
      evrak_no: 'SNT-001',
      tutar: 25000,
      vade_tarihi: '2025-03-20',
      kesideci: 'Mehmet Demir',
      cari_id: createdCariId
    });
    if (res.status === 201 && res.data.evrak) {
      createdEvrakId2 = res.data.evrak.id;
      console.log(`   ✅ PASSED - Evrak ID: ${createdEvrakId2}\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 6: Validation hatası (evrak_no eksik)
  console.log('📌 Test 6: POST /api/evraklar (validation - evrak_no eksik)');
  try {
    const res = await request('POST', '/api/evraklar', {
      evrak_tipi: 'cek',
      tutar: 1000,
      vade_tarihi: '2025-01-01',
      kesideci: 'Test'
    });
    if (res.status === 400 && res.data.error === 'Validation hatası') {
      console.log('   ✅ PASSED - Validation hatası döndü\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Beklenmeyen response\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 7: Validation hatası (geçersiz evrak_tipi)
  console.log('📌 Test 7: POST /api/evraklar (validation - geçersiz evrak_tipi)');
  try {
    const res = await request('POST', '/api/evraklar', {
      evrak_tipi: 'bono',
      evrak_no: 'TEST',
      tutar: 1000,
      vade_tarihi: '2025-01-01',
      kesideci: 'Test'
    });
    if (res.status === 400 && res.data.error === 'Validation hatası') {
      console.log('   ✅ PASSED - Validation hatası döndü\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Beklenmeyen response\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 8: Validation hatası (tutar negatif)
  console.log('📌 Test 8: POST /api/evraklar (validation - negatif tutar)');
  try {
    const res = await request('POST', '/api/evraklar', {
      evrak_tipi: 'cek',
      evrak_no: 'TEST',
      tutar: -100,
      vade_tarihi: '2025-01-01',
      kesideci: 'Test'
    });
    if (res.status === 400 && res.data.error === 'Validation hatası') {
      console.log('   ✅ PASSED - Validation hatası döndü\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Beklenmeyen response\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 9: Evrak detay
  console.log('📌 Test 9: GET /api/evraklar/:id (detay)');
  try {
    const res = await request('GET', `/api/evraklar/${createdEvrakId}`);
    if (res.status === 200 && res.data.evrak_no === 'CHK-001' && res.data.cari_adi) {
      console.log(`   ✅ PASSED - Evrak No: ${res.data.evrak_no}, Cari: ${res.data.cari_adi}\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 10: Filtreleme - evrak_tipi=cek
  console.log('📌 Test 10: GET /api/evraklar?evrak_tipi=cek (filtreleme)');
  try {
    const res = await request('GET', '/api/evraklar?evrak_tipi=cek');
    if (res.status === 200 && res.data.data.every(e => e.evrak_tipi === 'cek')) {
      console.log(`   ✅ PASSED - ${res.data.pagination.total} çek bulundu\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Filtre çalışmadı\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 11: Filtreleme - durum=portfoy
  console.log('📌 Test 11: GET /api/evraklar?durum=portfoy (durum filtre)');
  try {
    const res = await request('GET', '/api/evraklar?durum=portfoy');
    if (res.status === 200 && res.data.data.every(e => e.durum === 'portfoy')) {
      console.log(`   ✅ PASSED - ${res.data.pagination.total} portföy evrakı\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Filtre çalışmadı\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 12: Arama
  console.log('📌 Test 12: GET /api/evraklar?search=CHK (arama)');
  try {
    const res = await request('GET', '/api/evraklar?search=CHK');
    if (res.status === 200 && res.data.pagination.total >= 1) {
      console.log(`   ✅ PASSED - ${res.data.pagination.total} sonuç bulundu\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Arama sonucu yok\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 13: Sıralama
  console.log('📌 Test 13: GET /api/evraklar?sort=tutar&order=desc (sıralama)');
  try {
    const res = await request('GET', '/api/evraklar?sort=tutar&order=desc');
    if (res.status === 200 && res.data.data.length >= 2) {
      const first = res.data.data[0].tutar;
      const second = res.data.data[1].tutar;
      if (first >= second) {
        console.log(`   ✅ PASSED - Büyükten küçüğe: ${first} >= ${second}\n`);
        testsPassed++;
      } else {
        console.log('   ❌ FAILED - Sıralama yanlış\n');
        testsFailed++;
      }
    } else {
      console.log('   ❌ FAILED - Yetersiz veri\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 14: Evrak güncelleme
  console.log('📌 Test 14: PUT /api/evraklar/:id (güncelleme)');
  try {
    const res = await request('PUT', `/api/evraklar/${createdEvrakId}`, {
      evrak_tipi: 'cek',
      evrak_no: 'CHK-001-UPD',
      tutar: 16000,
      vade_tarihi: '2025-02-20',
      banka_adi: 'İş Bankası',
      kesideci: 'Ahmet Yılmaz (Güncellendi)',
      cari_id: createdCariId,
      notlar: 'Güncellenmiş test çek'
    });
    if (res.status === 200 && res.data.evrak.evrak_no === 'CHK-001-UPD') {
      console.log(`   ✅ PASSED - Evrak No: ${res.data.evrak.evrak_no}\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 15: Durum değişikliği (portfoy -> bankada)
  console.log('📌 Test 15: PATCH /api/evraklar/:id/durum (portfoy -> bankada)');
  try {
    const res = await request('PATCH', `/api/evraklar/${createdEvrakId}/durum`, {
      durum: 'bankada',
      aciklama: 'Garanti Bankası şubesine tahsile verildi'
    });
    if (res.status === 200 && res.data.evrak.durum === 'bankada' && res.data.hareket) {
      console.log(`   ✅ PASSED - Yeni durum: ${res.data.evrak.durum}, Hareket ID: ${res.data.hareket.id}\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 16: Hareket geçmişi
  console.log('📌 Test 16: GET /api/evraklar/:id/hareketler');
  try {
    const res = await request('GET', `/api/evraklar/${createdEvrakId}/hareketler`);
    if (res.status === 200 && res.data.hareketler && res.data.hareketler.length >= 2) {
      console.log(`   ✅ PASSED - ${res.data.hareketler.length} hareket kaydı\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 17: Geçersiz durum geçişi (bankada -> ciro)
  console.log('📌 Test 17: PATCH durum (geçersiz: bankada -> ciro)');
  try {
    const res = await request('PATCH', `/api/evraklar/${createdEvrakId}/durum`, {
      durum: 'ciro',
      aciklama: 'Geçersiz geçiş'
    });
    if (res.status === 400 && res.data.error.includes('geçiş yapılamaz')) {
      console.log('   ✅ PASSED - Geçersiz geçiş engellendi\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Geçersiz geçiş engellenmedi\n', res.data);
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 18: Durum değişikliği (bankada -> tahsil)
  console.log('📌 Test 18: PATCH /api/evraklar/:id/durum (bankada -> tahsil)');
  try {
    const res = await request('PATCH', `/api/evraklar/${createdEvrakId}/durum`, {
      durum: 'tahsil',
      aciklama: 'Tahsil edildi'
    });
    if (res.status === 200 && res.data.evrak.durum === 'tahsil') {
      console.log(`   ✅ PASSED - Yeni durum: ${res.data.evrak.durum}\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 19: Son durumdan değişiklik (tahsil -> X)
  console.log('📌 Test 19: PATCH durum (son durum: tahsil -> bankada)');
  try {
    const res = await request('PATCH', `/api/evraklar/${createdEvrakId}/durum`, {
      durum: 'bankada'
    });
    if (res.status === 400 && res.data.error.includes('son durum')) {
      console.log('   ✅ PASSED - Son durum değişikliği engellendi\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Son durum engellenmedi\n', res.data);
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 20: Toplu durum güncelleme (portfoy -> ciro)
  console.log('📌 Test 20: POST /api/evraklar/toplu-durum');
  try {
    const res = await request('POST', '/api/evraklar/toplu-durum', {
      ids: [createdEvrakId2],
      durum: 'ciro',
      aciklama: 'Toplu ciro işlemi'
    });
    if (res.status === 200 && res.data.success === 1) {
      console.log(`   ✅ PASSED - ${res.data.success} evrak güncellendi\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 21: Token olmadan erişim
  console.log('📌 Test 21: GET /api/evraklar (token yok - 401)');
  try {
    const savedToken = TOKEN;
    TOKEN = '';
    const res = await request('GET', '/api/evraklar');
    TOKEN = savedToken;
    if (res.status === 401) {
      console.log('   ✅ PASSED - 401 Unauthorized döndü\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Beklenmeyen status:', res.status, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 22: Evrak silme (admin)
  console.log('📌 Test 22: DELETE /api/evraklar/:id (admin)');
  try {
    const res = await request('DELETE', `/api/evraklar/${createdEvrakId}`);
    if (res.status === 200 && res.data.message.includes('silindi')) {
      console.log('   ✅ PASSED - Evrak silindi\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 23: Silinen evrakı getirme (404)
  console.log('📌 Test 23: GET /api/evraklar/:id (silinen - 404)');
  try {
    const res = await request('GET', `/api/evraklar/${createdEvrakId}`);
    if (res.status === 404) {
      console.log('   ✅ PASSED - 404 Not Found döndü\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Beklenmeyen status:', res.status, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Summary
  console.log('═══════════════════════════════════════════');
  console.log('                 SONUÇLAR');
  console.log('═══════════════════════════════════════════');
  console.log(`   ✅ Başarılı: ${testsPassed}`);
  console.log(`   ❌ Başarısız: ${testsFailed}`);
  console.log(`   📊 Toplam: ${testsPassed + testsFailed}`);
  console.log('═══════════════════════════════════════════\n');

  // Cleanup
  console.log('🧹 Test verilerini temizleniyor...');
  try {
    // İkinci evrakı sil
    if (createdEvrakId2) {
      await request('DELETE', `/api/evraklar/${createdEvrakId2}`);
      console.log('   - Evrak 2 silindi');
    }
    // Test carisini sil
    if (createdCariId) {
      await request('DELETE', `/api/cariler/${createdCariId}`);
      console.log('   - Test carisi silindi');
    }
    console.log('✅ Temizlik tamamlandı\n');
  } catch (e) {
    console.log('⚠️ Temizlik sırasında hata (önemli değil)\n');
  }
}

// Run
runTests().catch(console.error);
