-- Migration: 002_evrak_tarihi
-- Description: Evrak tarihi alanı ekleme
-- Version: 1.1.0
-- Date: 2026-01-03

-- =====================================================
-- EVRAK TARİHİ KOLONU
-- =====================================================
-- Evrakın düzenlenme/keşide tarihi (vade tarihinden farklı)
-- Opsiyonel alan - mevcut evraklar için NULL olacak

ALTER TABLE evraklar ADD COLUMN evrak_tarihi TEXT;

-- =====================================================
-- NOT: KESİDECİ ALANI
-- =====================================================
-- kesideci alanı veritabanında NOT NULL olarak tanımlı.
-- SQLite'ta NOT NULL constraint'i kaldırmak için tablo
-- yeniden oluşturulması gerekir (riskli).
-- 
-- Çözüm: Backend validation'dan zorunluluk kaldırılacak,
-- boş string ('') kabul edilecek. Mevcut veriler korunur.
-- =====================================================

-- Versiyon güncelle
UPDATE ayarlar SET value = '1.1.0' WHERE key = 'app_version';
