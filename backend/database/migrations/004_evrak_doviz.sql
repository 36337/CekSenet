-- Migration: 004_evrak_doviz
-- Description: Evrak para birimi, döviz kuru ve banka referansı
-- Version: 1.1.0
-- Date: 2026-01-03

-- =====================================================
-- EVRAK PARA BİRİMİ VE DÖVİZ KURU
-- =====================================================
-- para_birimi: TRY, USD, EUR, GBP, CHF
-- doviz_kuru: Evrak kaydedildiğindeki kur (TRY için NULL)
-- banka_id: Bankalar tablosuna referans (opsiyonel)

-- Para birimi kolonu (varsayılan TRY)
ALTER TABLE evraklar ADD COLUMN para_birimi TEXT DEFAULT 'TRY' 
    CHECK(para_birimi IN ('TRY', 'USD', 'EUR', 'GBP', 'CHF'));

-- Döviz kuru kolonu (TRY dışında zorunlu olacak - backend'de kontrol)
ALTER TABLE evraklar ADD COLUMN doviz_kuru REAL;

-- Banka referansı (opsiyonel - geriye uyumluluk için banka_adi korunuyor)
ALTER TABLE evraklar ADD COLUMN banka_id INTEGER REFERENCES bankalar(id);

-- =====================================================
-- MEVCUT VERİLERİ GÜNCELLE
-- =====================================================
-- Mevcut evrakların para_birimi TRY olarak ayarla
UPDATE evraklar SET para_birimi = 'TRY' WHERE para_birimi IS NULL;

-- =====================================================
-- INDEX
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_evraklar_para_birimi ON evraklar(para_birimi);
CREATE INDEX IF NOT EXISTS idx_evraklar_banka_id ON evraklar(banka_id);

-- =====================================================
-- NOT
-- =====================================================
-- banka_adi kolonu korunuyor (geriye uyumluluk)
-- Yeni evraklarda hem banka_id hem banka_adi kullanılabilir
-- banka_id varsa, banka adı bankalar tablosundan JOIN ile alınır
-- banka_id yoksa, banka_adi doğrudan kullanılır
