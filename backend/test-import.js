/**
 * Import API Test Script
 * Backend'in çalışır durumda olması gerekir: npm run dev
 * 
 * Çalıştırma: node test-import.js
 */

const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:7475/api';
let authToken = null;

// ============================================
// YARDIMCI FONKSİYONLAR
// ============================================

async function login() {
  console.log('\n📝 Login yapılıyor...');
  
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: '123456'
    })
  });
  
  const data = await response.json();
  
  if (data.success && data.token) {
    authToken = data.token;
    console.log('✅ Login başarılı');
    return true;
  } else {
    console.log('❌ Login başarısız:', data.error);
    return false;
  }
}

function getHeaders(isMultipart = false) {
  const headers = {
    'Authorization': `Bearer ${authToken}`
  };
  
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
}

// ============================================
// TEST FONKSİYONLARI
// ============================================

async function testHealthCheck() {
  console.log('\n🏥 Health Check...');
  
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    
    if (data.status === 'ok') {
      console.log('✅ Backend çalışıyor:', data.environment);
      return true;
    } else {
      console.log('❌ Backend yanıt vermiyor');
      return false;
    }
  } catch (error) {
    console.log('❌ Backend bağlantı hatası:', error.message);
    return false;
  }
}

async function testTemplateDownload() {
  console.log('\n📥 Template Download Testi...');
  
  try {
    const response = await fetch(`${API_BASE}/import/evraklar/template`, {
      headers: getHeaders()
    });
    
    if (response.status === 200) {
      const contentType = response.headers.get('content-type');
      const contentDisposition = response.headers.get('content-disposition');
      const contentLength = response.headers.get('content-length');
      
      console.log('✅ Template download başarılı');
      console.log('   Content-Type:', contentType);
      console.log('   Content-Disposition:', contentDisposition);
      console.log('   Content-Length:', contentLength, 'bytes');
      
      // Dosyayı kaydet (opsiyonel test)
      const buffer = await response.arrayBuffer();
      const testPath = path.join(__dirname, 'test-downloaded-template.xlsx');
      fs.writeFileSync(testPath, Buffer.from(buffer));
      console.log('   Dosya kaydedildi:', testPath);
      
      return true;
    } else {
      const data = await response.json();
      console.log('❌ Template download başarısız:', response.status, data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Template download hatası:', error.message);
    return false;
  }
}

async function testImportInfo() {
  console.log('\n📋 Import Info Testi...');
  
  try {
    const response = await fetch(`${API_BASE}/import/evraklar/info`, {
      headers: getHeaders()
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Import info başarılı');
      console.log('   Max dosya boyutu:', data.info.maxFileSize);
      console.log('   İzin verilen formatlar:', data.info.allowedFormats.join(', '));
      console.log('   Zorunlu kolonlar:', data.info.requiredColumns.length);
      console.log('   Opsiyonel kolonlar:', data.info.optionalColumns.length);
      return true;
    } else {
      console.log('❌ Import info başarısız:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Import info hatası:', error.message);
    return false;
  }
}

async function testParse() {
  console.log('\n📊 Parse Testi...');
  
  const templatePath = path.join(__dirname, 'templates/evrak-import-template.xlsx');
  
  if (!fs.existsSync(templatePath)) {
    console.log('❌ Template dosyası bulunamadı:', templatePath);
    return false;
  }
  
  try {
    // FormData oluştur
    const fileBuffer = fs.readFileSync(templatePath);
    const blob = new Blob([fileBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const formData = new FormData();
    formData.append('file', blob, 'evrak-import-template.xlsx');
    
    const response = await fetch(`${API_BASE}/import/evraklar/parse`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Parse başarılı');
      console.log('   Toplam satır:', data.ozet.toplam);
      console.log('   Geçerli:', data.ozet.gecerli);
      console.log('   Hatalı:', data.ozet.hatali);
      console.log('   Uyarılı:', data.ozet.uyarili);
      
      // İlk satırı göster
      if (data.data.length > 0) {
        const ilk = data.data[0];
        console.log('\n   İlk satır örneği:');
        console.log('   - Satır:', ilk.satir);
        console.log('   - Evrak Tipi:', ilk.evrak_tipi);
        console.log('   - Evrak No:', ilk.evrak_no);
        console.log('   - Tutar:', ilk.tutar);
        console.log('   - Vade:', ilk.vade_tarihi);
        console.log('   - Geçerli:', ilk.gecerli);
        if (ilk.hatalar.length > 0) {
          console.log('   - Hatalar:', ilk.hatalar.join(', '));
        }
        if (ilk.uyarilar.length > 0) {
          console.log('   - Uyarılar:', ilk.uyarilar.join(', '));
        }
      }
      
      // Parse sonucunu kaydet (import testi için)
      global.parseResult = data;
      
      return true;
    } else {
      console.log('❌ Parse başarısız:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Parse hatası:', error.message);
    return false;
  }
}

async function testImport() {
  console.log('\n💾 Import Testi...');
  
  // Parse sonucu var mı?
  if (!global.parseResult || !global.parseResult.data) {
    console.log('⚠️ Parse sonucu yok, import testi atlanıyor');
    return false;
  }
  
  // Sadece geçerli satırları al
  const gecerliSatirlar = global.parseResult.data.filter(s => s.gecerli);
  
  if (gecerliSatirlar.length === 0) {
    console.log('⚠️ Geçerli satır yok, import testi atlanıyor');
    return false;
  }
  
  console.log(`   ${gecerliSatirlar.length} geçerli satır import edilecek...`);
  
  try {
    const response = await fetch(`${API_BASE}/import/evraklar/import`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        satirlar: gecerliSatirlar
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Import başarılı');
      console.log('   Başarılı:', data.sonuc.basarili);
      console.log('   Başarısız:', data.sonuc.basarisiz);
      
      if (data.sonuc.hatalar.length > 0) {
        console.log('   Hatalar:');
        data.sonuc.hatalar.forEach(h => {
          console.log(`   - Satır ${h.satir} (${h.evrak_no}): ${h.hata}`);
        });
      }
      
      return true;
    } else {
      console.log('❌ Import başarısız:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Import hatası:', error.message);
    return false;
  }
}

// ============================================
// ANA TEST AKIŞI
// ============================================

async function runTests() {
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║         IMPORT API TEST SCRIPT                ║');
  console.log('╚═══════════════════════════════════════════════╝');
  
  const results = {
    health: false,
    login: false,
    template: false,
    info: false,
    parse: false,
    import: false
  };
  
  // 1. Health check
  results.health = await testHealthCheck();
  if (!results.health) {
    console.log('\n❌ Backend çalışmıyor. Önce "npm run dev" ile başlatın.');
    return;
  }
  
  // 2. Login
  results.login = await login();
  if (!results.login) {
    console.log('\n❌ Login başarısız. Testler durduruluyor.');
    return;
  }
  
  // 3. Template download
  results.template = await testTemplateDownload();
  
  // 4. Import info
  results.info = await testImportInfo();
  
  // 5. Parse test
  results.parse = await testParse();
  
  // 6. Import test (parse başarılıysa)
  if (results.parse) {
    // Uyarı: Bu test gerçek veri ekler!
    console.log('\n⚠️ Import testi gerçek veri ekleyecek.');
    console.log('   (Template\'deki örnek veriler zaten sistemde olabilir)');
    results.import = await testImport();
  }
  
  // Sonuç özeti
  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║                TEST SONUÇLARI                 ║');
  console.log('╠═══════════════════════════════════════════════╣');
  console.log(`║  Health Check:     ${results.health ? '✅ PASS' : '❌ FAIL'}                     ║`);
  console.log(`║  Login:            ${results.login ? '✅ PASS' : '❌ FAIL'}                     ║`);
  console.log(`║  Template Download:${results.template ? '✅ PASS' : '❌ FAIL'}                     ║`);
  console.log(`║  Import Info:      ${results.info ? '✅ PASS' : '❌ FAIL'}                     ║`);
  console.log(`║  Parse:            ${results.parse ? '✅ PASS' : '❌ FAIL'}                     ║`);
  console.log(`║  Import:           ${results.import ? '✅ PASS' : '❌ FAIL'}                     ║`);
  console.log('╚═══════════════════════════════════════════════╝');
  
  // Temizlik: Test dosyasını sil
  const testFile = path.join(__dirname, 'test-downloaded-template.xlsx');
  if (fs.existsSync(testFile)) {
    fs.unlinkSync(testFile);
    console.log('\n🧹 Test dosyası temizlendi');
  }
}

runTests().catch(console.error);
