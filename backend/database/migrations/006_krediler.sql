-- Migration: 006_krediler
-- Description: Krediler ve kredi taksitleri tabloları
-- Version: 1.1.0
-- Date: 2026-01-04

-- =====================================================
-- KREDİLER TABLOSU
-- =====================================================
-- Bankalardan alınan kredilerin takibi
-- banka_id → bankalar tablosuna referans

CREATE TABLE IF NOT EXISTS krediler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    banka_id INTEGER,
    kredi_turu TEXT NOT NULL CHECK(kredi_turu IN ('tuketici', 'konut', 'tasit', 'ticari', 'isletme', 'diger')),
    anapara REAL NOT NULL,
    faiz_orani REAL NOT NULL,
    vade_ay INTEGER NOT NULL,
    baslangic_tarihi TEXT NOT NULL,
    aylik_taksit REAL NOT NULL,
    toplam_odeme REAL,
    para_birimi TEXT DEFAULT 'TRY' CHECK(para_birimi IN ('TRY', 'USD', 'EUR', 'GBP', 'CHF')),
    notlar TEXT,
    durum TEXT DEFAULT 'aktif' CHECK(durum IN ('aktif', 'kapandi', 'erken_kapandi')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    created_by INTEGER,
    FOREIGN KEY (banka_id) REFERENCES bankalar(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Krediler index'leri
CREATE INDEX IF NOT EXISTS idx_krediler_durum ON krediler(durum);
CREATE INDEX IF NOT EXISTS idx_krediler_banka ON krediler(banka_id);
CREATE INDEX IF NOT EXISTS idx_krediler_baslangic ON krediler(baslangic_tarihi);

-- =====================================================
-- KREDİ TAKSİTLERİ TABLOSU
-- =====================================================
-- Her kredinin aylık taksit ödemeleri
-- kredi_id → krediler tablosuna referans (CASCADE ile silinir)

CREATE TABLE IF NOT EXISTS kredi_taksitler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kredi_id INTEGER NOT NULL,
    taksit_no INTEGER NOT NULL,
    vade_tarihi TEXT NOT NULL,
    tutar REAL NOT NULL,
    odeme_tarihi TEXT,
    odenen_tutar REAL,
    durum TEXT DEFAULT 'bekliyor' CHECK(durum IN ('bekliyor', 'odendi', 'gecikti')),
    notlar TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kredi_id) REFERENCES krediler(id) ON DELETE CASCADE
);

-- Taksitler index'leri
CREATE INDEX IF NOT EXISTS idx_taksitler_kredi ON kredi_taksitler(kredi_id);
CREATE INDEX IF NOT EXISTS idx_taksitler_vade ON kredi_taksitler(vade_tarihi);
CREATE INDEX IF NOT EXISTS idx_taksitler_durum ON kredi_taksitler(durum);

-- =====================================================
-- KOMBİNE INDEX (sık kullanılan sorgular için)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_taksitler_kredi_durum ON kredi_taksitler(kredi_id, durum);
