-- Migration: 003_bankalar
-- Description: Bankalar tablosu ve varsayılan veriler
-- Version: 1.1.0
-- Date: 2026-01-03

-- =====================================================
-- BANKALAR TABLOSU
-- =====================================================
-- Evraklarda kullanılacak banka listesi
-- Kullanıcılar yeni banka ekleyebilir

CREATE TABLE IF NOT EXISTS bankalar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad TEXT NOT NULL UNIQUE,
    aktif INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX IF NOT EXISTS idx_bankalar_aktif ON bankalar(aktif);
CREATE INDEX IF NOT EXISTS idx_bankalar_ad ON bankalar(ad);

-- =====================================================
-- VARSAYILAN BANKALAR (20 adet)
-- =====================================================

INSERT OR IGNORE INTO bankalar (ad) VALUES 
    ('Ziraat Bankası'),
    ('İş Bankası'),
    ('Garanti BBVA'),
    ('Yapı Kredi'),
    ('Akbank'),
    ('QNB Finansbank'),
    ('Denizbank'),
    ('Vakıfbank'),
    ('Halkbank'),
    ('TEB'),
    ('ING Bank'),
    ('HSBC'),
    ('Enpara'),
    ('Şekerbank'),
    ('Kuveyt Türk'),
    ('Türkiye Finans'),
    ('Albaraka Türk'),
    ('Ziraat Katılım'),
    ('Vakıf Katılım'),
    ('Emlak Katılım');
