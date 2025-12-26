// ============================================
// ÇekSenet - Users API Test Script
// Test: Kullanıcı yönetimi endpoint'leri
// ============================================

const API_URL = 'http://localhost:7475/api';

// Test verileri
let authToken = '';
let testUserId = null;

// ============================================
// Yardımcı Fonksiyonlar
// ============================================

async function request(method, endpoint, data = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);
  const json = await response.json().catch(() => ({}));
  
  return {
    status: response.status,
    ok: response.ok,
    data: json,
  };
}

function log(emoji, message, details = null) {
  console.log(`${emoji} ${message}`);
  if (details) {
    console.log('   ', JSON.stringify(details, null, 2).split('\n').join('\n    '));
  }
}

function success(message, details = null) {
  log('✅', message, details);
}

function error(message, details = null) {
  log('❌', message, details);
}

function info(message) {
  log('ℹ️', message);
}

function section(title) {
  console.log('\n' + '='.repeat(50));
  console.log(`📋 ${title}`);
  console.log('='.repeat(50));
}

// ============================================
// Test Cases
// ============================================

async function testAdminLogin() {
  section('Admin Login');
  
  const res = await request('POST', '/auth/login', {
    username: 'admin',
    password: '123456',
  });

  if (res.ok && res.data.token) {
    authToken = res.data.token;
    success('Admin login başarılı', { user: res.data.user });
    return true;
  } else {
    error('Admin login başarısız', res.data);
    return false;
  }
}

async function testGetUsers() {
  section('GET /users - Kullanıcı Listesi');
  
  const res = await request('GET', '/users', null, authToken);

  if (res.ok) {
    success(`${res.data.count} kullanıcı bulundu`, { users: res.data.users });
    return true;
  } else {
    error('Kullanıcı listesi alınamadı', res.data);
    return false;
  }
}

async function testCreateUser() {
  section('POST /users - Kullanıcı Oluştur');
  
  const testUser = {
    username: 'testuser_' + Date.now(),
    password: 'test123456',
    ad_soyad: 'Test Kullanıcı',
    role: 'normal',
  };

  const res = await request('POST', '/users', testUser, authToken);

  if (res.ok && res.data.user) {
    testUserId = res.data.user.id;
    success('Kullanıcı oluşturuldu', { user: res.data.user });
    return true;
  } else {
    error('Kullanıcı oluşturulamadı', res.data);
    return false;
  }
}

async function testGetUser() {
  section('GET /users/:id - Kullanıcı Detay');
  
  if (!testUserId) {
    info('Test kullanıcısı yok, atlanıyor');
    return false;
  }

  const res = await request('GET', `/users/${testUserId}`, null, authToken);

  if (res.ok) {
    success('Kullanıcı detayı alındı', res.data);
    return true;
  } else {
    error('Kullanıcı detayı alınamadı', res.data);
    return false;
  }
}

async function testUpdateUser() {
  section('PUT /users/:id - Kullanıcı Güncelle');
  
  if (!testUserId) {
    info('Test kullanıcısı yok, atlanıyor');
    return false;
  }

  const updateData = {
    ad_soyad: 'Güncellenmiş Ad Soyad',
    role: 'normal',
  };

  const res = await request('PUT', `/users/${testUserId}`, updateData, authToken);

  if (res.ok) {
    success('Kullanıcı güncellendi', res.data);
    return true;
  } else {
    error('Kullanıcı güncellenemedi', res.data);
    return false;
  }
}

async function testResetPassword() {
  section('PUT /users/:id/password - Şifre Sıfırla');
  
  if (!testUserId) {
    info('Test kullanıcısı yok, atlanıyor');
    return false;
  }

  const res = await request('PUT', `/users/${testUserId}/password`, {
    newPassword: 'yenisifre123',
  }, authToken);

  if (res.ok) {
    success('Şifre sıfırlandı', res.data);
    return true;
  } else {
    error('Şifre sıfırlanamadı', res.data);
    return false;
  }
}

async function testDeleteUser() {
  section('DELETE /users/:id - Kullanıcı Sil');
  
  if (!testUserId) {
    info('Test kullanıcısı yok, atlanıyor');
    return false;
  }

  const res = await request('DELETE', `/users/${testUserId}`, null, authToken);

  if (res.ok) {
    success('Kullanıcı silindi', res.data);
    testUserId = null;
    return true;
  } else {
    error('Kullanıcı silinemedi', res.data);
    return false;
  }
}

async function testUnauthorizedAccess() {
  section('Yetki Kontrolü - Token olmadan');
  
  const res = await request('GET', '/users');

  if (res.status === 401) {
    success('Token olmadan erişim engellendi (401)', res.data);
    return true;
  } else {
    error('Yetki kontrolü başarısız', { status: res.status, data: res.data });
    return false;
  }
}

async function testChangeOwnPassword() {
  section('PUT /auth/password - Kendi Şifresini Değiştir');
  
  // Admin şifresini değiştirip geri al
  const res = await request('PUT', '/auth/password', {
    currentPassword: '123456',
    newPassword: 'yeniadminsifre123',
    confirmPassword: 'yeniadminsifre123',
  }, authToken);

  if (res.ok) {
    success('Şifre değiştirildi', res.data);
    
    // Eski şifreye geri al
    await request('PUT', '/auth/password', {
      currentPassword: 'yeniadminsifre123',
      newPassword: '123456',
      confirmPassword: '123456',
    }, authToken);
    
    info('Şifre eski haline döndürüldü');
    return true;
  } else {
    error('Şifre değiştirilemedi', res.data);
    return false;
  }
}

// ============================================
// Ana Test Çalıştırıcı
// ============================================

async function runTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║           ÇekSenet - Users API Test Suite              ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  const results = {
    passed: 0,
    failed: 0,
  };

  try {
    // Login
    if (await testAdminLogin()) results.passed++; else results.failed++;

    // Users CRUD
    if (await testGetUsers()) results.passed++; else results.failed++;
    if (await testCreateUser()) results.passed++; else results.failed++;
    if (await testGetUser()) results.passed++; else results.failed++;
    if (await testUpdateUser()) results.passed++; else results.failed++;
    if (await testResetPassword()) results.passed++; else results.failed++;
    if (await testDeleteUser()) results.passed++; else results.failed++;

    // Auth
    if (await testUnauthorizedAccess()) results.passed++; else results.failed++;
    if (await testChangeOwnPassword()) results.passed++; else results.failed++;

  } catch (err) {
    error('Test çalıştırma hatası', { message: err.message });
    results.failed++;
  }

  // Özet
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SONUÇLARI                      ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  ✅ Başarılı: ${results.passed.toString().padEnd(40)}║`);
  console.log(`║  ❌ Başarısız: ${results.failed.toString().padEnd(39)}║`);
  console.log('╚════════════════════════════════════════════════════════╝');

  if (results.failed === 0) {
    console.log('\n🎉 Tüm testler başarılı!\n');
  } else {
    console.log('\n⚠️  Bazı testler başarısız oldu.\n');
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Çalıştır
runTests();
