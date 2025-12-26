/**
 * Dashboard, Raporlar, Backup, Settings API Test Script
 * TASK-05 tüm endpoint'lerini test eder
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
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
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

// Test runner
async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('     TASK-05: Dashboard, Raporlar, Backup, Settings');
  console.log('═══════════════════════════════════════════════════════\n');

  let testsPassed = 0;
  let testsFailed = 0;
  let createdBackupFilename = null;

  // =============================================
  // SETUP: Login
  // =============================================
  console.log('🔐 SETUP: Login\n');
  
  console.log('📌 Test: Admin login');
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
      console.log('\n⚠️  Login başarısız. Sunucunun çalıştığından emin olun.');
      console.log('   Komut: cd backend && npm run dev\n');
      return;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message);
    console.log('\n⚠️  Sunucuya bağlanılamadı. Sunucunun çalıştığından emin olun.');
    console.log('   Komut: cd backend && npm run dev\n');
    return;
  }

  // =============================================
  // SETTINGS TESTS
  // =============================================
  console.log('═══════════════════════════════════════════════════════');
  console.log('                    SETTINGS API');
  console.log('═══════════════════════════════════════════════════════\n');

  // Test: Setup status (public)
  console.log('📌 Test: GET /api/settings/setup-status (public)');
  try {
    const savedToken = TOKEN;
    TOKEN = ''; // Token olmadan dene
    const res = await request('GET', '/api/settings/setup-status');
    TOKEN = savedToken;
    if (res.status === 200 && res.data.setup_completed !== undefined) {
      console.log(`   ✅ PASSED - Setup: ${res.data.setup_completed}, Admin: ${res.data.has_admin}\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: App info (public)
  console.log('📌 Test: GET /api/settings/app-info (public)');
  try {
    const savedToken = TOKEN;
    TOKEN = '';
    const res = await request('GET', '/api/settings/app-info');
    TOKEN = savedToken;
    if (res.status === 200 && res.data.version) {
      console.log(`   ✅ PASSED - Version: ${res.data.version}\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: Get all settings
  console.log('📌 Test: GET /api/settings');
  try {
    const res = await request('GET', '/api/settings');
    if (res.status === 200 && typeof res.data === 'object') {
      const keys = Object.keys(res.data);
      console.log(`   ✅ PASSED - ${keys.length} ayar bulundu\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: Get settings with system
  console.log('📌 Test: GET /api/settings?include_system=true (admin)');
  try {
    const res = await request('GET', '/api/settings?include_system=true');
    if (res.status === 200 && res.data.app_version) {
      console.log(`   ✅ PASSED - app_version: ${res.data.app_version.value}\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: Update setting
  console.log('📌 Test: PUT /api/settings (update company_name)');
  try {
    const res = await request('PUT', '/api/settings', {
      company_name: 'Test Şirketi A.Ş.'
    });
    if (res.status === 200 && res.data.updated.includes('company_name')) {
      console.log(`   ✅ PASSED - Güncellenen: ${res.data.updated.join(', ')}\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: Update non-editable setting (should fail)
  console.log('📌 Test: PUT /api/settings (non-editable - app_version)');
  try {
    const res = await request('PUT', '/api/settings', {
      app_version: '9.9.9'
    });
    if (res.status === 400 && res.data.errors) {
      console.log('   ✅ PASSED - Düzenlenemez ayar engellendi\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Engellenmedi\n', res.data);
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: Setup endpoint (should fail - already setup)
  console.log('📌 Test: POST /api/settings/setup (already completed)');
  try {
    const res = await request('POST', '/api/settings/setup', {
      username: 'newadmin',
      password: '123456',
      ad_soyad: 'New Admin'
    });
    if (res.status === 400 && res.data.error.includes('zaten')) {
      console.log('   ✅ PASSED - Tekrar kurulum engellendi\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // =============================================
  // DASHBOARD TESTS
  // =============================================
  console.log('═══════════════════════════════════════════════════════');
  console.log('                   DASHBOARD API');
  console.log('═══════════════════════════════════════════════════════\n');

  // Test: Dashboard özet
  console.log('📌 Test: GET /api/dashboard');
  try {
    const res = await request('GET', '/api/dashboard');
    if (res.status === 200 && res.data.portfoy !== undefined && res.data.vade !== undefined) {
      console.log(`   ✅ PASSED - Portföy: ${res.data.portfoy.adet} adet, ${res.data.portfoy.tutar} TL`);
      console.log(`             Toplam: ${res.data.toplam.adet} adet, ${res.data.toplam.tutar} TL\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: Dashboard kartlar
  console.log('📌 Test: GET /api/dashboard/kartlar');
  try {
    const res = await request('GET', '/api/dashboard/kartlar');
    if (res.status === 200 && Array.isArray(res.data) && res.data.length >= 4) {
      console.log(`   ✅ PASSED - ${res.data.length} kart: ${res.data.map(k => k.id).join(', ')}\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: Durum dağılımı
  console.log('📌 Test: GET /api/dashboard/durum-dagilimi');
  try {
    const res = await request('GET', '/api/dashboard/durum-dagilimi');
    if (res.status === 200 && Array.isArray(res.data)) {
      console.log(`   ✅ PASSED - ${res.data.length} durum: ${res.data.map(d => d.label).join(', ')}\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: Aylık dağılım
  console.log('📌 Test: GET /api/dashboard/aylik-dagilim');
  try {
    const res = await request('GET', '/api/dashboard/aylik-dagilim');
    if (res.status === 200 && Array.isArray(res.data) && res.data.length === 12) {
      console.log(`   ✅ PASSED - ${res.data.length} ay: ${res.data[0].ayLabel} - ${res.data[11].ayLabel}\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: Aylık dağılım (custom ay sayısı)
  console.log('📌 Test: GET /api/dashboard/aylik-dagilim?ay_sayisi=6');
  try {
    const res = await request('GET', '/api/dashboard/aylik-dagilim?ay_sayisi=6');
    if (res.status === 200 && Array.isArray(res.data) && res.data.length === 6) {
      console.log(`   ✅ PASSED - ${res.data.length} ay\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: Son hareketler
  console.log('📌 Test: GET /api/dashboard/son-hareketler');
  try {
    const res = await request('GET', '/api/dashboard/son-hareketler');
    if (res.status === 200 && Array.isArray(res.data)) {
      console.log(`   ✅ PASSED - ${res.data.length} hareket\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: Vade uyarıları
  console.log('📌 Test: GET /api/dashboard/vade-uyarilari');
  try {
    const res = await request('GET', '/api/dashboard/vade-uyarilari');
    if (res.status === 200 && res.data.ozet && res.data.bugun !== undefined) {
      console.log(`   ✅ PASSED - Bugün: ${res.data.ozet.bugun.adet}, Bu Hafta: ${res.data.ozet.buHafta.adet}, Gecikmiş: ${res.data.ozet.gecikmis.adet}\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: Top cariler
  console.log('📌 Test: GET /api/dashboard/top-cariler');
  try {
    const res = await request('GET', '/api/dashboard/top-cariler');
    if (res.status === 200 && Array.isArray(res.data)) {
      console.log(`   ✅ PASSED - ${res.data.length} cari\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: Auth gerekli (token yok)
  console.log('📌 Test: GET /api/dashboard (without token - 401)');
  try {
    const savedToken = TOKEN;
    TOKEN = '';
    const res = await request('GET', '/api/dashboard');
    TOKEN = savedToken;
    if (res.status === 401) {
      console.log('   ✅ PASSED - 401 Unauthorized\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Beklenmeyen status:', res.status, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // =============================================
  // RAPORLAR TESTS
  // =============================================
  console.log('═══════════════════════════════════════════════════════');
  console.log('                    RAPORLAR API');
  console.log('═══════════════════════════════════════════════════════\n');

  // Test: Tarih aralığı raporu
  console.log('📌 Test: GET /api/raporlar/tarih-araligi');
  try {
    const res = await request('GET', '/api/raporlar/tarih-araligi?baslangic=2025-01-01&bitis=2025-12-31');
    if (res.status === 200 && res.data.ozet && res.data.detay !== undefined) {
      console.log(`   ✅ PASSED - Toplam: ${res.data.ozet.toplam.adet} evrak, ${res.data.detay.length} detay satırı\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: Tarih aralığı raporu (filtreli)
  console.log('📌 Test: GET /api/raporlar/tarih-araligi (durum + tip filtresi)');
  try {
    const res = await request('GET', '/api/raporlar/tarih-araligi?baslangic=2025-01-01&bitis=2025-12-31&durum=portfoy&evrak_tipi=cek');
    if (res.status === 200 && res.data.filtreler.durum === 'portfoy') {
      console.log(`   ✅ PASSED - Filtre: ${res.data.filtreler.durum}, ${res.data.filtreler.evrak_tipi}\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: Tarih validation
  console.log('📌 Test: GET /api/raporlar/tarih-araligi (validation - tarih eksik)');
  try {
    const res = await request('GET', '/api/raporlar/tarih-araligi?baslangic=2025-01-01');
    if (res.status === 400 && res.data.error === 'Validation hatası') {
      console.log('   ✅ PASSED - Validation hatası döndü\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: Tarih sırası validation
  console.log('📌 Test: GET /api/raporlar/tarih-araligi (başlangıç > bitiş)');
  try {
    const res = await request('GET', '/api/raporlar/tarih-araligi?baslangic=2025-12-31&bitis=2025-01-01');
    if (res.status === 400 && res.data.error.includes('büyük')) {
      console.log('   ✅ PASSED - Tarih sırası hatası döndü\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: Vade raporu
  console.log('📌 Test: GET /api/raporlar/vade');
  try {
    const res = await request('GET', '/api/raporlar/vade');
    if (res.status === 200 && res.data.ozet && res.data.gunluk !== undefined) {
      console.log(`   ✅ PASSED - Gecikmis: ${res.data.ozet.gecikmis.adet}, Bu ay: ${res.data.ozet.buAy.adet}\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: Vade raporu (custom gün)
  console.log('📌 Test: GET /api/raporlar/vade?gun=14');
  try {
    const res = await request('GET', '/api/raporlar/vade?gun=14');
    if (res.status === 200 && res.data.filtreler.gun === 14) {
      console.log(`   ✅ PASSED - ${res.data.filtreler.gun} günlük rapor\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: Cariler raporu
  console.log('📌 Test: GET /api/raporlar/cariler');
  try {
    const res = await request('GET', '/api/raporlar/cariler');
    if (res.status === 200 && res.data.ozet && res.data.cariler !== undefined) {
      console.log(`   ✅ PASSED - ${res.data.ozet.cariSayisi} cari, ${res.data.ozet.toplamEvrak} evrak\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: Cariler raporu (filtreli)
  console.log('📌 Test: GET /api/raporlar/cariler?tip=musteri&siralama=adet');
  try {
    const res = await request('GET', '/api/raporlar/cariler?tip=musteri&siralama=adet');
    if (res.status === 200 && res.data.filtreler.tip === 'musteri') {
      console.log(`   ✅ PASSED - Filtre: ${res.data.filtreler.tip}, Sıralama: ${res.data.filtreler.siralama}\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: Excel export
  console.log('📌 Test: GET /api/raporlar/excel');
  try {
    const res = await request('GET', '/api/raporlar/excel?baslangic=2025-01-01&bitis=2025-12-31');
    // Excel response binary olacak veya veri yoksa 404
    if (res.status === 200 || res.status === 404) {
      if (res.status === 200 && res.headers['content-type']?.includes('spreadsheet')) {
        console.log('   ✅ PASSED - Excel dosyası döndü\n');
      } else if (res.status === 404) {
        console.log('   ✅ PASSED - Veri yok (404 beklenen)\n');
      } else {
        console.log(`   ✅ PASSED - Status: ${res.status}\n`);
      }
      testsPassed++;
    } else {
      console.log('   ❌ FAILED - Status:', res.status, res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // =============================================
  // BACKUP TESTS
  // =============================================
  console.log('═══════════════════════════════════════════════════════');
  console.log('                    BACKUP API');
  console.log('═══════════════════════════════════════════════════════\n');

  // Test: Backup listesi
  console.log('📌 Test: GET /api/backup');
  try {
    const res = await request('GET', '/api/backup');
    if (res.status === 200 && res.data.backups !== undefined && res.data.stats !== undefined) {
      console.log(`   ✅ PASSED - ${res.data.backups.length} yedek, ${res.data.stats.total_size_kb} KB\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: Backup stats
  console.log('📌 Test: GET /api/backup/stats');
  try {
    const res = await request('GET', '/api/backup/stats');
    if (res.status === 200 && res.data.backup_dir) {
      console.log(`   ✅ PASSED - Dir: ${res.data.backup_dir}\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: Yeni backup oluştur
  console.log('📌 Test: POST /api/backup');
  try {
    const res = await request('POST', '/api/backup', {
      aciklama: 'Test yedeği - API test'
    });
    if (res.status === 201 && res.data.success && res.data.filename) {
      createdBackupFilename = res.data.filename;
      console.log(`   ✅ PASSED - Yedek: ${res.data.filename}, ${res.data.size} KB\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: Backup detay
  if (createdBackupFilename) {
    console.log('📌 Test: GET /api/backup/:filename');
    try {
      const res = await request('GET', `/api/backup/${createdBackupFilename}`);
      if (res.status === 200 && res.data.filename === createdBackupFilename) {
        console.log(`   ✅ PASSED - Dosya: ${res.data.filename}\n`);
        testsPassed++;
      } else {
        console.log('   ❌ FAILED -', res.data, '\n');
        testsFailed++;
      }
    } catch (err) {
      console.log('   ❌ FAILED - ' + err.message + '\n');
      testsFailed++;
    }
  }

  // Test: Geçersiz filename format
  console.log('📌 Test: GET /api/backup/invalid.txt (validation)');
  try {
    const res = await request('GET', '/api/backup/invalid.txt');
    if (res.status === 400 && res.data.error === 'Validation hatası') {
      console.log('   ✅ PASSED - Geçersiz dosya adı engellendi\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: Backup cleanup
  console.log('📌 Test: POST /api/backup/cleanup');
  try {
    const res = await request('POST', '/api/backup/cleanup', {
      keep_count: 50  // Çok yüksek tutarak silme olmasın
    });
    if (res.status === 200 && res.data.success !== undefined) {
      console.log(`   ✅ PASSED - Silinen: ${res.data.deleted_count}\n`);
      testsPassed++;
    } else {
      console.log('   ❌ FAILED -', res.data, '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('   ❌ FAILED - ' + err.message + '\n');
    testsFailed++;
  }

  // Test: Backup sil
  if (createdBackupFilename) {
    console.log('📌 Test: DELETE /api/backup/:filename');
    try {
      const res = await request('DELETE', `/api/backup/${createdBackupFilename}`);
      if (res.status === 200 && res.data.success) {
        console.log('   ✅ PASSED - Yedek silindi\n');
        testsPassed++;
      } else {
        console.log('   ❌ FAILED -', res.data, '\n');
        testsFailed++;
      }
    } catch (err) {
      console.log('   ❌ FAILED - ' + err.message + '\n');
      testsFailed++;
    }
  }

  // =============================================
  // SUMMARY
  // =============================================
  console.log('═══════════════════════════════════════════════════════');
  console.log('                      SONUÇLAR');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`   ✅ Başarılı: ${testsPassed}`);
  console.log(`   ❌ Başarısız: ${testsFailed}`);
  console.log(`   📊 Toplam: ${testsPassed + testsFailed}`);
  console.log(`   📈 Başarı Oranı: ${Math.round(testsPassed / (testsPassed + testsFailed) * 100)}%`);
  console.log('═══════════════════════════════════════════════════════\n');

  if (testsFailed === 0) {
    console.log('🎉 Tüm testler başarılı!\n');
  } else {
    console.log(`⚠️  ${testsFailed} test başarısız. Logları kontrol edin.\n`);
  }
}

// Run
runTests().catch(console.error);
