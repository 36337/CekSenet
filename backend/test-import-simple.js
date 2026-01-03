/**
 * Basit Import API Test
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 7475;
let authToken = null;

// HTTP Request helper
function request(method, path, body = null, isMultipart = false) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: method,
      headers: {}
    };
    
    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    let postData = null;
    if (body && !isMultipart) {
      postData = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          // Binary response (template download)
          if (res.headers['content-type']?.includes('spreadsheet')) {
            resolve({ status: res.statusCode, binary: true, headers: res.headers });
          } else {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          }
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Multipart form data için özel request
function uploadFile(filePath) {
  return new Promise((resolve, reject) => {
    const boundary = '----FormBoundary' + Date.now();
    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);
    
    // Multipart body oluştur
    const header = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
      `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`
    );
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, fileContent, footer]);
    
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/import/evraklar/parse',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║         IMPORT API TESTS                      ║');
  console.log('╚═══════════════════════════════════════════════╝');
  
  // 1. Health Check
  console.log('\n🏥 Health Check...');
  let res = await request('GET', '/api/health');
  if (res.data.status === 'ok') {
    console.log('✅ Backend çalışıyor');
  } else {
    console.log('❌ Backend hatası');
    return;
  }
  
  // 2. Login
  console.log('\n📝 Login...');
  res = await request('POST', '/api/auth/login', {
    username: 'admin',
    password: '123456'
  });
  
  if (res.data.token) {
    authToken = res.data.token;
    console.log('✅ Login başarılı');
  } else {
    console.log('❌ Login başarısız:', res.data.error || res.data);
    return;
  }
  
  // 3. Template Download
  console.log('\n📥 Template Download...');
  res = await request('GET', '/api/import/evraklar/template');
  if (res.status === 200 && res.binary) {
    console.log('✅ Template download başarılı');
    console.log('   Content-Type:', res.headers['content-type']);
  } else {
    console.log('❌ Template download başarısız:', res.status, res.data);
  }
  
  // 4. Import Info
  console.log('\n📋 Import Info...');
  res = await request('GET', '/api/import/evraklar/info');
  if (res.data.success) {
    console.log('✅ Import info başarılı');
    console.log('   Max boyut:', res.data.info.maxFileSize);
    console.log('   Formatlar:', res.data.info.allowedFormats.join(', '));
  } else {
    console.log('❌ Import info başarısız:', res.data.error);
  }
  
  // 5. Parse Test
  console.log('\n📊 Parse Test...');
  const templatePath = path.join(__dirname, 'templates/evrak-import-template.xlsx');
  if (!fs.existsSync(templatePath)) {
    console.log('❌ Template dosyası bulunamadı');
  } else {
    res = await uploadFile(templatePath);
    if (res.data.success) {
      console.log('✅ Parse başarılı');
      console.log('   Toplam:', res.data.ozet.toplam);
      console.log('   Geçerli:', res.data.ozet.gecerli);
      console.log('   Hatalı:', res.data.ozet.hatali);
      
      // İlk satır bilgisi
      if (res.data.data && res.data.data.length > 0) {
        const ilk = res.data.data[0];
        console.log('\n   İlk satır:');
        console.log('   - Evrak No:', ilk.evrak_no);
        console.log('   - Tip:', ilk.evrak_tipi);
        console.log('   - Tutar:', ilk.tutar, ilk.para_birimi);
        console.log('   - Vade:', ilk.vade_tarihi);
        console.log('   - Geçerli:', ilk.gecerli ? 'Evet' : 'Hayır');
        if (ilk.hatalar && ilk.hatalar.length > 0) {
          console.log('   - Hatalar:', ilk.hatalar.join('; '));
        }
        if (ilk.uyarilar && ilk.uyarilar.length > 0) {
          console.log('   - Uyarılar:', ilk.uyarilar.join('; '));
        }
        
        // 6. Import Test
        console.log('\n💾 Import Test...');
        const gecerliSatirlar = res.data.data.filter(s => s.gecerli);
        if (gecerliSatirlar.length === 0) {
          console.log('⚠️ Geçerli satır yok, import atlanıyor');
        } else {
          console.log(`   ${gecerliSatirlar.length} satır import edilecek...`);
          
          const importRes = await request('POST', '/api/import/evraklar/import', {
            satirlar: gecerliSatirlar
          });
          
          if (importRes.data.success) {
            console.log('✅ Import başarılı');
            console.log('   Başarılı:', importRes.data.sonuc.basarili);
            console.log('   Başarısız:', importRes.data.sonuc.basarisiz);
          } else {
            console.log('⚠️ Import:', importRes.data.error || 'Kısmen başarılı');
            if (importRes.data.sonuc) {
              console.log('   Başarılı:', importRes.data.sonuc.basarili);
              console.log('   Başarısız:', importRes.data.sonuc.basarisiz);
            }
          }
        }
      }
    } else {
      console.log('❌ Parse başarısız:', res.data.error);
    }
  }
  
  console.log('\n✅ Tüm testler tamamlandı');
}

runTests().catch(err => {
  console.error('Test hatası:', err.message);
});
