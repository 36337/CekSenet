# CekSenet Installer

Bu klasör Windows installer oluşturmak için kullanılır.

## Klasör Yapısı

```
installer/
├── build/              # Installer için hazırlanan dosyalar
│   ├── node/           # Embedded Node.js runtime
│   ├── app/            # Backend + Frontend (kopyalanacak)
│   ├── service/        # Windows service scriptleri
│   ├── scripts/        # Kurulum/kaldırma scriptleri
│   ├── database/       # Boş veritabanı klasörü
│   └── logs/           # Boş log klasörü
├── output/             # Oluşturulan .exe installer
├── ceksenet.iss        # Inno Setup script
└── README.md           # Bu dosya
```

## Installer Oluşturma

1. Node.js'i `build/node/` klasörüne indir
2. Backend ve Frontend'i `build/app/` klasörüne kopyala
3. Inno Setup ile `ceksenet.iss` derle
4. Output: `output/CekSenet-Setup-x.x.x.exe`

## Gereksinimler

- Inno Setup 6.x (https://jrsoftware.org/isdl.php)
- Node.js 20.x Windows binary

## Notlar

- `build/` klasörü .gitignore'da (büyük dosyalar)
- `output/` klasörü .gitignore'da (generated)
