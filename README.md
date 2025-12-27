# ÇekSenet - Çek/Senet Takip Sistemi

Şirket içi çek ve senet takip uygulaması.

## Özellikler

- Çek ve senet kayıt/takip
- Vade takibi ve uyarılar (bugün, bu hafta, gecikmiş)
- Durum yönetimi (Portföy → Bankada → Ciro → Tahsil / Karşılıksız)
- Cari hesap yönetimi (Müşteri/Tedarikçi)
- Dashboard ve grafikler
- Raporlama ve Excel'e aktarma
- Kullanıcı yönetimi (Admin/Normal roller)
- Responsive tasarım (mobil uyumlu)
- Otomatik günlük yedekleme

## Hızlı Başlangıç (Son Kullanıcı)

### Kurulum

1. [Releases](https://github.com/36337/CekSenet/releases) sayfasından `CekSenet-Setup-1.0.0.exe` dosyasını indirin
2. Çalıştırın ve kurulum sihirbazını takip edin
3. Kurulum sonrası tarayıcı otomatik açılır
4. Varsayılan giriş bilgileri: `admin` / `123456`

### Sistem Gereksinimleri

- Windows 10/11 (64-bit)
- Modern tarayıcı (Chrome, Edge, Firefox)

## Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Backend | Node.js + Express |
| Database | SQLite (WAL mode) |
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| UI Kit | Tailwind UI Catalyst |
| Auth | JWT + bcrypt |
| Installer | Inno Setup |

## Geliştirici Kurulumu

### Gereksinimler

- Node.js v20+
- npm v10+
- Git

### Kurulum Adımları

```bash
# Repo'yu klonla
git clone https://github.com/36337/CekSenet.git
cd CekSenet

# Backend bağımlılıklarını kur
cd backend
npm install

# Frontend bağımlılıklarını kur
cd ../frontend
npm install

# Root'a dön
cd ..
```

### Çalıştırma

```bash
# Geliştirme modu (backend + frontend birlikte)
npm run dev

# Sadece backend
npm run dev:backend

# Sadece frontend
npm run dev:frontend

# Production modu
npm run start:production
```

### Portlar

| Servis | Port |
|--------|------|
| Backend API (dev) | 7475 |
| Frontend (dev) | 5173 |
| Production | 7474 |

## Proje Yapısı

```
ceksenet/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── routes/       # API endpoint'leri
│   │   ├── models/       # Veritabanı modelleri
│   │   ├── middleware/   # Auth, validation
│   │   └── index.js      # Ana sunucu dosyası
│   ├── config/           # Yapılandırma
│   ├── database/
│   │   ├── migrations/   # SQL migration dosyaları
│   │   └── backups/      # Otomatik yedekler
│   └── logs/             # Uygulama logları
│
├── frontend/             # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/   # UI bileşenleri
│   │   ├── pages/        # Sayfa bileşenleri
│   │   ├── services/     # API servisleri
│   │   └── App.tsx       # Ana uygulama
│   └── dist/             # Production build
│
├── installer/            # Windows installer dosyaları
│   ├── build/            # Paketlenmiş dosyalar
│   ├── output/           # Oluşturulan exe
│   ├── ceksenet.iss      # Inno Setup script
│   └── prepare-build.js  # Build hazırlık scripti
│
└── package.json          # Root scripts
```

## API Endpoints

```
POST   /api/auth/login           # Giriş
POST   /api/auth/logout          # Çıkış
GET    /api/auth/me              # Mevcut kullanıcı

GET    /api/evraklar             # Evrak listesi
POST   /api/evraklar             # Yeni evrak
GET    /api/evraklar/:id         # Evrak detayı
PUT    /api/evraklar/:id         # Evrak güncelle
DELETE /api/evraklar/:id         # Evrak sil
PATCH  /api/evraklar/:id/durum   # Durum güncelle

GET    /api/cariler              # Cari listesi
POST   /api/cariler              # Yeni cari
GET    /api/cariler/:id          # Cari detayı
PUT    /api/cariler/:id          # Cari güncelle
DELETE /api/cariler/:id          # Cari sil

GET    /api/dashboard            # Dashboard verileri
GET    /api/raporlar/excel       # Excel export

GET    /api/users                # Kullanıcı listesi (admin)
POST   /api/users                # Kullanıcı ekle (admin)
PUT    /api/users/:id            # Kullanıcı güncelle (admin)
DELETE /api/users/:id            # Kullanıcı sil (admin)
```

## Installer Oluşturma

```bash
# 1. Build hazırlığı
cd installer
node prepare-build.js

# 2. Inno Setup ile derleme
# Inno Setup Compiler'ı aç
# ceksenet.iss dosyasını aç
# Compile (Ctrl+F9)

# 3. Çıktı
# installer/output/CekSenet-Setup-1.0.0.exe
```

## Yedekleme

- Otomatik yedekleme: Her gece 02:00
- Yedek konumu: `database/backups/`
- Son 7 yedek saklanır

## Lisans

Private - Tüm hakları saklıdır.

---

**Versiyon:** 1.0.0  
**Tarih:** Aralık 2025
