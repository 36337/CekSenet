-- Migration: 005_evrak_fotograflar
-- Description: Evrak fotoğrafları tablosu
-- Version: 1.1.0
-- Date: 2026-01-03

-- =====================================================
-- EVRAK FOTOĞRAFLARI
-- =====================================================
-- Her evrak için birden fazla fotoğraf saklanabilir
-- Orijinal dosya + thumbnail ayrı ayrı saklanır

CREATE TABLE IF NOT EXISTS evrak_fotograflar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    evrak_id INTEGER NOT NULL,
    dosya_adi TEXT NOT NULL,           -- Orijinal dosya adı (sanitized)
    dosya_yolu TEXT NOT NULL,          -- Tam dosya yolu (uploads/evraklar/{evrak_id}/...)
    thumbnail_yolu TEXT,               -- Thumbnail dosya yolu (opsiyonel)
    boyut INTEGER,                     -- Dosya boyutu (bytes)
    mimetype TEXT,                     -- image/jpeg, image/png, image/webp
    genislik INTEGER,                  -- Orijinal genişlik (px)
    yukseklik INTEGER,                 -- Orijinal yükseklik (px)
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (evrak_id) REFERENCES evraklar(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- İNDEXLER
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_fotograflar_evrak ON evrak_fotograflar(evrak_id);

-- =====================================================
-- NOTLAR
-- =====================================================
-- ON DELETE CASCADE: Evrak silinince DB kayıtları otomatik silinir
-- Ancak dosyalar diskten manuel silinmeli (backend'de kontrol edilir)
-- Thumbnail boyutu: 200x200 px (max), aspect ratio korunur
