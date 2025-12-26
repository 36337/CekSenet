/**
 * Cariler API Test Script
 * Tüm endpoint'leri sırayla test eder
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
  console.log('        CARILER API TEST SUITE');
  console.log('═══════════════════════════════════════════\n');

  let testsPassed = 0;
  let testsFailed = 0;
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

  // Test 2: Boş liste
  console.log('📌 Test 2: GET /api/cariler (boş liste)');
  try {
    const res = await request('GET', '/api/cariler');
    if (res.status === 200 && res.data.pagination) {
      console.log(`   ✅ PASSED - Toplam: ${res.data.pagination.total} cari\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Beklenmeyen response\n', res.data);
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 3: Yeni müşteri ekle
  console.log('📌 Test 3: POST /api/cariler (müşteri ekle)');
  try {
    const res = await request('POST', '/api/cariler', {
      ad_soyad: 'ABC Ticaret Ltd.',
      tip: 'musteri',
      telefon: '0212 555 1234',
      email: 'info@abc.com',
      adres: 'İstanbul, Türkiye',
      vergi_no: '1234567890',
      notlar: 'Test müşteri'
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

  // Test 4: Tedarikçi ekle
  console.log('📌 Test 4: POST /api/cariler (tedarikçi ekle)');
  try {
    const res = await request('POST', '/api/cariler', {
      ad_soyad: 'XYZ Tedarik A.Ş.',
      tip: 'tedarikci',
      telefon: '0216 444 5678',
      email: 'satis@xyz.com'
    });
    if (res.status === 201 && res.data.cari) {
      console.log(`   ✅ PASSED - Cari ID: ${res.data.cari.id}\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 5: Validation hatası (ad_soyad eksik)
  console.log('📌 Test 5: POST /api/cariler (validation - ad_soyad eksik)');
  try {
    const res = await request('POST', '/api/cariler', {
      tip: 'musteri'
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

  // Test 6: Validation hatası (geçersiz tip)
  console.log('📌 Test 6: POST /api/cariler (validation - geçersiz tip)');
  try {
    const res = await request('POST', '/api/cariler', {
      ad_soyad: 'Test',
      tip: 'invalid_tip'
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

  // Test 7: Cari detay
  console.log('📌 Test 7: GET /api/cariler/:id (detay)');
  try {
    const res = await request('GET', `/api/cariler/${createdCariId}`);
    if (res.status === 200 && res.data.ad_soyad === 'ABC Ticaret Ltd.' && res.data.istatistikler) {
      console.log(`   ✅ PASSED - Ad: ${res.data.ad_soyad}, İstatistikler mevcut\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 8: Liste filtreleme (tip=musteri)
  console.log('📌 Test 8: GET /api/cariler?tip=musteri (filtreleme)');
  try {
    const res = await request('GET', '/api/cariler?tip=musteri');
    if (res.status === 200 && res.data.data.every(c => c.tip === 'musteri')) {
      console.log(`   ✅ PASSED - ${res.data.pagination.total} müşteri bulundu\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Filtre çalışmadı\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 9: Arama
  console.log('📌 Test 9: GET /api/cariler?search=ABC (arama)');
  try {
    const res = await request('GET', '/api/cariler?search=ABC');
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

  // Test 10: Güncelleme
  console.log('📌 Test 10: PUT /api/cariler/:id (güncelleme)');
  try {
    const res = await request('PUT', `/api/cariler/${createdCariId}`, {
      ad_soyad: 'ABC Ticaret Ltd. (Güncellendi)',
      tip: 'musteri',
      telefon: '0212 555 9999',
      email: 'yeni@abc.com'
    });
    if (res.status === 200 && res.data.cari.ad_soyad.includes('Güncellendi')) {
      console.log(`   ✅ PASSED - Ad güncellendi: ${res.data.cari.ad_soyad}\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 11: Cariye ait evraklar (boş)
  console.log('📌 Test 11: GET /api/cariler/:id/evraklar');
  try {
    const res = await request('GET', `/api/cariler/${createdCariId}/evraklar`);
    if (res.status === 200 && res.data.cari && res.data.pagination) {
      console.log(`   ✅ PASSED - ${res.data.pagination.total} evrak\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 12: Token olmadan erişim
  console.log('📌 Test 12: GET /api/cariler (token yok - 401)');
  try {
    const savedToken = TOKEN;
    TOKEN = '';
    const res = await request('GET', '/api/cariler');
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

  // Test 13: Silme
  console.log('📌 Test 13: DELETE /api/cariler/:id');
  try {
    const res = await request('DELETE', `/api/cariler/${createdCariId}`);
    if (res.status === 200 && res.data.message.includes('silindi')) {
      console.log('   ✅ PASSED - Cari silindi\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test 14: Silinen cariyi getirme (404)
  console.log('📌 Test 14: GET /api/cariler/:id (silinen - 404)');
  try {
    const res = await request('GET', `/api/cariler/${createdCariId}`);
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

  // Cleanup: İkinci tedarikçiyi de sil
  try {
    const listRes = await request('GET', '/api/cariler');
    for (const cari of listRes.data.data) {
      if (cari.ad_soyad === 'XYZ Tedarik A.Ş.') {
        await request('DELETE', `/api/cariler/${cari.id}`);
        console.log('🧹 Test verisi temizlendi: XYZ Tedarik A.Ş.\n');
      }
    }
  } catch (e) {
    // ignore
  }
}

// Run
runTests().catch(console.error);
