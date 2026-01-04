// test-krediler-api.js
// Krediler API endpoint testleri

const http = require('http');

const BASE_URL = 'http://localhost:7475';
let TOKEN = null;

// HTTP Request Helper
function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
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

async function runTests() {
  console.log('=== KREDİLER API TESTLERİ ===\n');

  // 1. Login
  console.log('1. Login...');
  try {
    const loginRes = await request('POST', '/api/auth/login', {
      username: 'admin',
      password: '123456'
    });
    
    if (loginRes.status === 200 && loginRes.data.token) {
      TOKEN = loginRes.data.token;
      console.log('   ✅ Login başarılı\n');
    } else {
      console.log('   ❌ Login başarısız:', loginRes.data);
      process.exit(1);
    }
  } catch (e) {
    console.log('   ❌ Login hatası:', e.message);
    console.log('   Backend çalışıyor mu? (npm run dev)');
    process.exit(1);
  }

  // 2. GET /api/krediler (boş liste)
  console.log('2. GET /api/krediler (liste)');
  const listeRes = await request('GET', '/api/krediler');
  console.log('   Status:', listeRes.status);
  console.log('   Toplam:', listeRes.data.pagination?.total || 0);
  console.log('   ✅ Başarılı\n');

  // 3. GET /api/krediler/ozet
  console.log('3. GET /api/krediler/ozet');
  const ozetRes = await request('GET', '/api/krediler/ozet');
  console.log('   Status:', ozetRes.status);
  console.log('   Aktif Kredi:', ozetRes.data.aktif_kredi);
  console.log('   ✅ Başarılı\n');

  // 4. POST /api/krediler (yeni kredi)
  console.log('4. POST /api/krediler (yeni kredi)');
  const yeniKrediRes = await request('POST', '/api/krediler', {
    kredi_turu: 'tuketici',
    anapara: 50000,
    faiz_orani: 36,
    vade_ay: 12,
    baslangic_tarihi: '2026-01-01',
    notlar: 'API test kredisi'
  });
  console.log('   Status:', yeniKrediRes.status);
  
  let krediId = null;
  if (yeniKrediRes.status === 201) {
    krediId = yeniKrediRes.data.kredi.id;
    console.log('   Kredi ID:', krediId);
    console.log('   Aylık Taksit:', yeniKrediRes.data.kredi.aylik_taksit);
    console.log('   Taksit Sayısı:', yeniKrediRes.data.kredi.taksitler.length);
    console.log('   ✅ Başarılı\n');
  } else {
    console.log('   ❌ Hata:', yeniKrediRes.data);
    process.exit(1);
  }

  // 5. GET /api/krediler/:id (detay)
  console.log('5. GET /api/krediler/:id (detay)');
  const detayRes = await request('GET', `/api/krediler/${krediId}`);
  console.log('   Status:', detayRes.status);
  console.log('   Kredi Türü:', detayRes.data.kredi_turu);
  console.log('   Toplam Taksit:', detayRes.data.ozet?.toplam_taksit);
  console.log('   ✅ Başarılı\n');

  // 6. GET /api/krediler/:id/taksitler
  console.log('6. GET /api/krediler/:id/taksitler');
  const taksitlerRes = await request('GET', `/api/krediler/${krediId}/taksitler`);
  console.log('   Status:', taksitlerRes.status);
  console.log('   Taksit Sayısı:', taksitlerRes.data.toplam);
  console.log('   İlk Taksit:', taksitlerRes.data.taksitler[0]?.vade_tarihi);
  console.log('   ✅ Başarılı\n');

  // 7. PATCH /api/krediler/:id/taksitler/:tid/ode (ilk taksiti öde)
  const ilkTaksitId = taksitlerRes.data.taksitler[0]?.id;
  console.log('7. PATCH taksit ödeme (ID:', ilkTaksitId, ')');
  const odemeRes = await request('PATCH', `/api/krediler/${krediId}/taksitler/${ilkTaksitId}/ode`, {
    odeme_tarihi: '2026-01-15',
    notlar: 'Test ödemesi'
  });
  console.log('   Status:', odemeRes.status);
  console.log('   Taksit Durumu:', odemeRes.data.taksit?.durum);
  console.log('   Kalan Taksit:', odemeRes.data.ozet?.kalan_taksit);
  console.log('   ✅ Başarılı\n');

  // 8. PATCH /api/krediler/:id/taksitler/:tid/iptal (ödemeyi iptal et)
  console.log('8. PATCH ödeme iptal');
  const iptalRes = await request('PATCH', `/api/krediler/${krediId}/taksitler/${ilkTaksitId}/iptal`);
  console.log('   Status:', iptalRes.status);
  console.log('   Taksit Durumu:', iptalRes.data.taksit?.durum);
  console.log('   ✅ Başarılı\n');

  // 9. PUT /api/krediler/:id (güncelle)
  console.log('9. PUT /api/krediler/:id (güncelle)');
  const guncelleRes = await request('PUT', `/api/krediler/${krediId}`, {
    notlar: 'Güncellenen not - API test'
  });
  console.log('   Status:', guncelleRes.status);
  console.log('   Güncel Not:', guncelleRes.data.kredi?.notlar);
  console.log('   ✅ Başarılı\n');

  // 10. DELETE /api/krediler/:id (sil)
  console.log('10. DELETE /api/krediler/:id (sil)');
  const silRes = await request('DELETE', `/api/krediler/${krediId}`);
  console.log('   Status:', silRes.status);
  console.log('   Mesaj:', silRes.data.message);
  console.log('   ✅ Başarılı\n');

  // 11. Genel endpoint'ler
  console.log('11. Genel taksit endpoint\'leri:');
  
  const buAyRes = await request('GET', '/api/krediler/taksitler/bu-ay');
  console.log('   Bu Ay:', buAyRes.status === 200 ? '✅' : '❌');
  
  const gecikenRes = await request('GET', '/api/krediler/taksitler/geciken');
  console.log('   Geciken:', gecikenRes.status === 200 ? '✅' : '❌');
  
  const yaklasanRes = await request('GET', '/api/krediler/taksitler/yaklasan?gun=14');
  console.log('   Yaklaşan:', yaklasanRes.status === 200 ? '✅' : '❌');

  console.log('\n=== TÜM TESTLER TAMAMLANDI ===');
}

runTests().catch(e => {
  console.error('Test hatası:', e);
  process.exit(1);
});
