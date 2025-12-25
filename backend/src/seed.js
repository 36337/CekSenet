/**
 * İlk Admin Kullanıcı Oluşturma Scripti
 * 
 * Kullanım: node src/seed.js
 * 
 * Bu script sadece users tablosu boşsa çalışır.
 * Varsayılan admin: admin / 123456
 */

const bcrypt = require('bcryptjs');
const path = require('path');

// Config yükle (dotenv dahil)
require('./utils/config');

const db = require('./models/db');
const config = require('./utils/config');

async function seedAdmin() {
  console.log('\n🌱 Admin Seed Script');
  console.log('─'.repeat(40));

  try {
    // Mevcut kullanıcı sayısını kontrol et
    const { count } = db.prepare(`SELECT COUNT(*) as count FROM users`).get();

    if (count > 0) {
      console.log(`ℹ️  Veritabanında ${count} kullanıcı mevcut.`);
      console.log('⏭️  Seed işlemi atlandı (kullanıcılar zaten var).\n');
      return;
    }

    // Admin kullanıcı bilgileri
    const adminData = {
      username: 'admin',
      password: '123456',
      ad_soyad: 'Sistem Yöneticisi',
      role: 'admin'
    };

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(adminData.password, config.bcrypt.saltRounds);

    // Admin kullanıcı oluştur
    const result = db.prepare(`
      INSERT INTO users (username, password, ad_soyad, role)
      VALUES (?, ?, ?, ?)
    `).run(adminData.username, hashedPassword, adminData.ad_soyad, adminData.role);

    console.log('✅ Admin kullanıcı oluşturuldu!');
    console.log('─'.repeat(40));
    console.log(`   ID:           ${result.lastInsertRowid}`);
    console.log(`   Kullanıcı:    ${adminData.username}`);
    console.log(`   Şifre:        ${adminData.password}`);
    console.log(`   Ad Soyad:     ${adminData.ad_soyad}`);
    console.log(`   Rol:          ${adminData.role}`);
    console.log('─'.repeat(40));
    console.log('⚠️  ÖNEMLİ: İlk girişten sonra şifreyi değiştirin!\n');

  } catch (error) {
    console.error('❌ Seed hatası:', error.message);
    process.exit(1);
  }
}

// Script doğrudan çalıştırıldığında
if (require.main === module) {
  seedAdmin().then(() => {
    process.exit(0);
  });
}

module.exports = { seedAdmin };
