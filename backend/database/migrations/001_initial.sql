-- Migration: 001_initial
-- Description: Veritabanı başlangıç yapısı - tüm tablolar
-- Version: 1.0.0

-- =====================================================
-- KULLANICILAR
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    ad_soyad TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'normal' CHECK(role IN ('admin', 'normal')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_login TEXT
);

-- =====================================================
-- CARİLER
-- =====================================================
CREATE TABLE IF NOT EXISTS cariler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad_soyad TEXT NOT NULL,
    tip TEXT NOT NULL CHECK(tip IN ('musteri', 'tedarikci')),
    telefon TEXT,
    email TEXT,
    adres TEXT,
    vergi_no TEXT,
    notlar TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT
);

-- =====================================================
-- EVRAKLAR (Çek ve Senetler)
-- =====================================================
CREATE TABLE IF NOT EXISTS evraklar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    evrak_tipi TEXT NOT NULL CHECK(evrak_tipi IN ('cek', 'senet')),
    evrak_no TEXT NOT NULL,
    tutar REAL NOT NULL,
    vade_tarihi TEXT NOT NULL,
    banka_adi TEXT,
    kesideci TEXT NOT NULL,
    cari_id INTEGER,
    durum TEXT NOT NULL DEFAULT 'portfoy' CHECK(durum IN ('portfoy', 'bankada', 'ciro', 'tahsil', 'karsiliksiz')),
    notlar TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    created_by INTEGER,
    FOREIGN KEY (cari_id) REFERENCES cariler(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- EVRAK HAREKETLERİ (Durum Geçmişi)
-- =====================================================
CREATE TABLE IF NOT EXISTS evrak_hareketleri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    evrak_id INTEGER NOT NULL,
    eski_durum TEXT,
    yeni_durum TEXT NOT NULL,
    aciklama TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (evrak_id) REFERENCES evraklar(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- AYARLAR
-- =====================================================
CREATE TABLE IF NOT EXISTS ayarlar (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- =====================================================
-- İNDEXLER (Performans)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_evraklar_durum ON evraklar(durum);
CREATE INDEX IF NOT EXISTS idx_evraklar_vade ON evraklar(vade_tarihi);
CREATE INDEX IF NOT EXISTS idx_evraklar_cari ON evraklar(cari_id);
CREATE INDEX IF NOT EXISTS idx_evraklar_tipi ON evraklar(evrak_tipi);
CREATE INDEX IF NOT EXISTS idx_hareketler_evrak ON evrak_hareketleri(evrak_id);
CREATE INDEX IF NOT EXISTS idx_cariler_tip ON cariler(tip);

-- =====================================================
-- VARSAYILAN VERİLER
-- =====================================================

-- Uygulama versiyonu
INSERT OR IGNORE INTO ayarlar (key, value) VALUES ('app_version', '1.0.0');

-- Veritabanı oluşturulma tarihi
INSERT OR IGNORE INTO ayarlar (key, value) VALUES ('db_created_at', datetime('now'));
