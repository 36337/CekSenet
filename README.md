# ÇekSenet - Çek/Senet Takip Sistemi

Şirket içi çek ve senet takip uygulaması.

## Teknolojiler

- **Backend:** Node.js + Express + SQLite
- **Frontend:** React + Vite + TypeScript + Tailwind CSS v4
- **UI Kit:** Tailwind UI Catalyst

## Kurulum (Geliştirici)

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

# Root'a dön ve çalıştır
cd ..
npm run dev
```

## Çalıştırma

```bash
# Geliştirme modu (backend + frontend birlikte)
npm run dev

# Sadece backend
npm run dev:backend

# Sadece frontend
npm run dev:frontend
```

## Portlar

| Servis | Port |
|--------|------|
| Backend API (dev) | 7475 |
| Frontend (dev) | 5173 |
| Production | 7474 |

## Proje Yapısı

```
ceksenet/
├── backend/          # Node.js + Express API
│   ├── src/
│   ├── database/
│   └── config/
├── frontend/         # React + Vite
│   └── src/
└── package.json      # Root scripts
```

## Lisans

Private - Tüm hakları saklıdır.
