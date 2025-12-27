# CekSenet Installer

Bu klasör Windows installer oluşturmak için kullanılır.

## 📁 Klasör Yapısı

```
installer/
├── build/                  # Installer için hazırlanan dosyalar
│   ├── node/               # Embedded Node.js runtime (manuel indirilecek)
│   ├── app/                # Backend + Frontend (prepare-build.js kopyalar)
│   │   ├── backend/
│   │   └── frontend/dist/
│   ├── service/            # Windows service scriptleri
│   ├── database/           # Boş veritabanı klasörü
│   └── logs/               # Boş log klasörü
├── output/                 # Oluşturulan .exe installer
├── ceksenet.iss            # Inno Setup script
├── prepare-build.js        # Build hazırlık scripti
└── README.md               # Bu dosya
```

## 🚀 Installer Oluşturma Adımları

### 1. Ön Hazırlık (bir kez yapılır)

1. **Node.js Windows binary indir:**
   - https://nodejs.org/dist/v22.17.0/node-v22.17.0-win-x64.zip
   - ZIP içeriğini `build/node/` klasörüne çıkart
   - `build/node/node.exe` olmalı

2. **Inno Setup kur:**
   - https://jrsoftware.org/isdl.php

### 2. Frontend Build

```bash
cd F:\projects\ceksenet
npm run build
```

### 3. Build Hazırlığı

```bash
cd F:\projects\ceksenet\installer
node prepare-build.js
```

Bu script:
- Backend ve Frontend'i `build/app/` klasörüne kopyalar
- node_modules dahil tüm bağımlılıkları kopyalar
- Production .env dosyasını ayarlar

### 4. Installer Oluştur

1. Inno Setup Compiler'ı aç
2. `ceksenet.iss` dosyasını aç
3. **Build > Compile** (veya Ctrl+F9)
4. Output: `output/CekSenet-Setup-1.0.0.exe`

## 📦 Installer Özellikleri

- **Kurulum dizini:** `C:\Program Files\CekSenet\`
- **Windows servisi:** Otomatik kurulur ve başlatılır
- **Firewall:** 7474 portu otomatik açılır
- **Masaüstü kısayolu:** Opsiyonel
- **Otomatik başlatma:** Windows başlangıcında (opsiyonel)

## 🔧 Servis Yönetimi

Kurulum sonrası servis otomatik başlar. Manuel yönetim için:

```cmd
# Servisi durdur
net stop CekSenet

# Servisi başlat
net start CekSenet

# Servis durumu
sc query CekSenet
```

## 📝 Notlar

- `build/` klasörü .gitignore'da (büyük dosyalar)
- `output/` klasörü .gitignore'da (generated)
- Her yeni versiyon için `ceksenet.iss` içindeki `MyAppVersion` güncellenmeli
