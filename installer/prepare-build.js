/**
 * CekSenet - Installer Build Hazırlık Scripti
 * 
 * Bu script installer için gerekli dosyaları build klasörüne kopyalar.
 * Çalıştırmadan önce:
 * 1. Frontend build yapılmış olmalı (npm run build)
 * 2. Node.js build/node/ klasörüne kopyalanmış olmalı
 * 
 * Kullanım: node prepare-build.js
 */

const fs = require('fs');
const path = require('path');

// Dizinler
const INSTALLER_DIR = __dirname;
const PROJECT_DIR = path.join(__dirname, '..');  // F:\projects\ceksenet
const BUILD_DIR = path.join(__dirname, 'build');

const BACKEND_SRC = path.join(PROJECT_DIR, 'backend');
const FRONTEND_DIST = path.join(PROJECT_DIR, 'frontend', 'dist');
const BUILD_APP_DIR = path.join(BUILD_DIR, 'app');

console.log('╔═══════════════════════════════════════════════╗');
console.log('║     CekSenet - Installer Build Hazırlığı      ║');
console.log('╚═══════════════════════════════════════════════╝');
console.log('');

// Yardımcı fonksiyonlar
function copyDir(src, dest, exclude = []) {
  if (!fs.existsSync(src)) {
    console.log(`  ⚠ Kaynak bulunamadı: ${src}`);
    return false;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    // Exclude listesinde mi kontrol et
    if (exclude.includes(entry.name)) {
      continue;
    }

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, exclude);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  return true;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

// Kontroller
console.log('1. Ön kontroller yapılıyor...');

// Node.js kontrolü
const nodeExe = path.join(BUILD_DIR, 'node', 'node.exe');
if (!fs.existsSync(nodeExe)) {
  console.log('  ❌ Node.js bulunamadı: build/node/node.exe');
  console.log('  → Node.js Windows binary\'sini build/node/ klasörüne kopyalayın');
  process.exit(1);
}
console.log('  ✓ Node.js mevcut');

// Frontend dist kontrolü
if (!fs.existsSync(FRONTEND_DIST)) {
  console.log('  ❌ Frontend build bulunamadı: frontend/dist/');
  console.log('  → Önce "npm run build" çalıştırın');
  process.exit(1);
}
console.log('  ✓ Frontend build mevcut');

// Backend kontrolü
if (!fs.existsSync(BACKEND_SRC)) {
  console.log('  ❌ Backend bulunamadı');
  process.exit(1);
}
console.log('  ✓ Backend mevcut');

console.log('');
console.log('2. Build klasörü hazırlanıyor...');

// App klasörünü temizle ve oluştur
cleanDir(BUILD_APP_DIR);
console.log('  ✓ build/app/ temizlendi');

// Backend klasörü oluştur
const backendDest = path.join(BUILD_APP_DIR, 'backend');
ensureDir(backendDest);

console.log('');
console.log('3. Backend kopyalanıyor...');

// src klasörü
copyDir(path.join(BACKEND_SRC, 'src'), path.join(backendDest, 'src'));
console.log('  ✓ backend/src/ kopyalandı');

// config klasörü
copyDir(path.join(BACKEND_SRC, 'config'), path.join(backendDest, 'config'));
console.log('  ✓ backend/config/ kopyalandı');

// database klasörü (migrations dahil, .db dosyaları hariç)
const dbDest = path.join(backendDest, 'database');
ensureDir(dbDest);
ensureDir(path.join(dbDest, 'backups'));

// migrations klasörünü kopyala
const migrationsSrc = path.join(BACKEND_SRC, 'database', 'migrations');
if (fs.existsSync(migrationsSrc)) {
  copyDir(migrationsSrc, path.join(dbDest, 'migrations'));
  console.log('  ✓ database/migrations/ kopyalandı');
} else {
  console.log('  ⚠ migrations klasörü bulunamadı');
}

// .gitkeep dosyaları
fs.writeFileSync(path.join(dbDest, '.gitkeep'), '');
fs.writeFileSync(path.join(dbDest, 'backups', '.gitkeep'), '');
console.log('  ✓ backend/database/ hazır');

// logs klasörü (boş)
const logsDest = path.join(backendDest, 'logs');
ensureDir(logsDest);
fs.writeFileSync(path.join(logsDest, '.gitkeep'), '');
console.log('  ✓ backend/logs/ hazır');

// package.json ve package-lock.json
fs.copyFileSync(
  path.join(BACKEND_SRC, 'package.json'),
  path.join(backendDest, 'package.json')
);
fs.copyFileSync(
  path.join(BACKEND_SRC, 'package-lock.json'),
  path.join(backendDest, 'package-lock.json')
);
console.log('  ✓ package.json kopyalandı');

// .env.production dosyasını .env olarak kopyala
const envProdPath = path.join(BACKEND_SRC, '.env.production');
if (fs.existsSync(envProdPath)) {
  fs.copyFileSync(envProdPath, path.join(backendDest, '.env'));
  console.log('  ✓ .env.production → .env olarak kopyalandı');
} else {
  console.log('  ⚠ .env.production bulunamadı, varsayılan .env oluşturuluyor...');
  const defaultEnv = `NODE_ENV=production
PORT=7474
JWT_SECRET=${require('crypto').randomBytes(32).toString('hex')}
JWT_EXPIRES_IN=24h
`;
  fs.writeFileSync(path.join(backendDest, '.env'), defaultEnv);
  console.log('  ✓ Varsayılan .env oluşturuldu');
}

// node_modules kopyala (bu uzun sürebilir)
console.log('  → node_modules kopyalanıyor (bu biraz sürebilir)...');
copyDir(
  path.join(BACKEND_SRC, 'node_modules'),
  path.join(backendDest, 'node_modules')
);
console.log('  ✓ node_modules kopyalandı');

console.log('');
console.log('4. Frontend kopyalanıyor...');

// Frontend dist klasörünü kopyala
const frontendDest = path.join(BUILD_APP_DIR, 'frontend', 'dist');
ensureDir(frontendDest);
copyDir(FRONTEND_DIST, frontendDest);
console.log('  ✓ frontend/dist/ kopyalandı');

console.log('');
console.log('5. Boyut hesaplanıyor...');

function getDirSize(dir) {
  let size = 0;
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory()) {
      size += getDirSize(filePath);
    } else {
      size += fs.statSync(filePath).size;
    }
  }
  return size;
}

const totalSize = getDirSize(BUILD_DIR);
const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);

console.log(`  → Toplam boyut: ${sizeMB} MB`);

console.log('');
console.log('═══════════════════════════════════════════════');
console.log('✅ Build hazırlığı tamamlandı!');
console.log('');
console.log('Sonraki adım: Inno Setup ile installer oluşturun');
console.log('  1. Inno Setup Compiler\'ı açın');
console.log('  2. ceksenet.iss dosyasını açın');
console.log('  3. Build > Compile (Ctrl+F9)');
console.log('  4. Output: installer/output/CekSenet-Setup.exe');
console.log('═══════════════════════════════════════════════');
