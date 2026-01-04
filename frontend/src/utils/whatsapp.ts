// ============================================
// ÇekSenet - WhatsApp Utility
// Telefon normalizasyonu, mesaj şablonu, URL oluşturma
// ============================================

import type { EvrakDetay } from '@/services/evraklar'
import { formatCurrency, formatDate, DURUM_LABELS, EVRAK_TIPI_LABELS } from '@/services'

// ============================================
// Telefon Normalizasyonu
// ============================================

/**
 * Telefon numarasını WhatsApp formatına normalize et
 * @param phone - Giriş telefon numarası (herhangi bir formatta)
 * @returns Normalize edilmiş numara (ülke kodu ile, + veya 0 olmadan)
 * 
 * Örnekler:
 * - "905551234567" → "905551234567"
 * - "+905551234567" → "905551234567"
 * - "05551234567" → "905551234567"
 * - "5551234567" → "905551234567"
 * - "+90 555 123 45 67" → "905551234567"
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return ''
  
  // Boşlukları, +, -, (, ) karakterlerini kaldır
  let normalized = phone.replace(/[\s+\-()]/g, '')
  
  // Başında 0 varsa kaldır ve 90 ekle
  if (normalized.startsWith('0')) {
    normalized = '90' + normalized.substring(1)
  }
  
  // 90 ile başlamıyorsa ekle (10 haneli Türkiye numarası varsayımı)
  if (!normalized.startsWith('90') && normalized.length === 10) {
    normalized = '90' + normalized
  }
  
  return normalized
}

/**
 * Telefon numarasının geçerli olup olmadığını kontrol et
 * @param phone - Kontrol edilecek telefon numarası
 * @returns Geçerli mi
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false
  
  const normalized = normalizePhoneNumber(phone)
  
  // Türkiye numarası: 90 + 10 hane = 12 hane
  // Sadece rakam olmalı
  return /^90\d{10}$/.test(normalized)
}

// ============================================
// Mesaj Şablonu İşlemleri
// ============================================

/**
 * Kullanılabilir mesaj değişkenleri
 */
export const MESSAGE_VARIABLES = [
  { key: '{evrak_no}', label: 'Evrak No', example: 'ÇK-2025-001' },
  { key: '{tutar}', label: 'Tutar', example: '₺10.000,00' },
  { key: '{para_birimi}', label: 'Para Birimi', example: 'TRY' },
  { key: '{doviz_kuru}', label: 'Döviz Kuru', example: '32,50' },
  { key: '{vade_tarihi}', label: 'Vade Tarihi', example: '15.01.2026' },
  { key: '{evrak_tarihi}', label: 'Evrak Tarihi', example: '01.01.2026' },
  { key: '{kesideci}', label: 'Keşideci', example: 'Ahmet Yılmaz' },
  { key: '{evrak_tipi}', label: 'Evrak Tipi', example: 'Çek' },
  { key: '{durum}', label: 'Durum', example: 'Portföy' },
  { key: '{cari}', label: 'Cari Hesap', example: 'ABC Ltd. Şti.' },
  { key: '{banka}', label: 'Banka', example: 'Ziraat Bankası' },
] as const

/**
 * Mesaj şablonundaki değişkenleri evrak bilgileriyle değiştir
 * @param template - Mesaj şablonu
 * @param evrak - Evrak bilgileri
 * @returns Değişkenler doldurulmuş mesaj
 */
export function fillMessageTemplate(template: string, evrak: EvrakDetay): string {
  if (!template || !evrak) return template || ''
  
  let message = template
  
  // Değişkenleri değiştir
  message = message.replace(/{evrak_no}/g, evrak.evrak_no || '-')
  message = message.replace(/{tutar}/g, formatCurrency(evrak.tutar, evrak.para_birimi))
  message = message.replace(/{para_birimi}/g, evrak.para_birimi || 'TRY')
  message = message.replace(/{doviz_kuru}/g, evrak.doviz_kuru?.toLocaleString('tr-TR') || '-')
  message = message.replace(/{vade_tarihi}/g, evrak.vade_tarihi ? formatDate(evrak.vade_tarihi) : '-')
  message = message.replace(/{evrak_tarihi}/g, evrak.evrak_tarihi ? formatDate(evrak.evrak_tarihi) : '-')
  message = message.replace(/{kesideci}/g, evrak.kesideci || '-')
  message = message.replace(/{evrak_tipi}/g, EVRAK_TIPI_LABELS[evrak.evrak_tipi] || '-')
  message = message.replace(/{durum}/g, DURUM_LABELS[evrak.durum] || '-')
  message = message.replace(/{cari}/g, evrak.cari_adi || '-')
  message = message.replace(/{banka}/g, evrak.banka_adi_display || evrak.banka_adi || '-')
  
  return message
}

// ============================================
// WhatsApp URL Oluşturma
// ============================================

/**
 * WhatsApp wa.me URL'i oluştur
 * @param telefon - Telefon numarası (normalize edilecek)
 * @param mesaj - Gönderilecek mesaj
 * @returns wa.me URL'i
 */
export function createWhatsAppUrl(telefon: string, mesaj: string): string {
  const normalizedPhone = normalizePhoneNumber(telefon)
  const encodedMessage = encodeURIComponent(mesaj)
  
  return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`
}

/**
 * WhatsApp URL'i oluştur ve yeni sekmede aç
 * @param telefon - Telefon numarası
 * @param template - Mesaj şablonu
 * @param evrak - Evrak bilgileri
 */
export function openWhatsApp(telefon: string, template: string, evrak: EvrakDetay): void {
  const message = fillMessageTemplate(template, evrak)
  const url = createWhatsAppUrl(telefon, message)
  
  window.open(url, '_blank', 'noopener,noreferrer')
}

// ============================================
// Varsayılan Mesaj Şablonu
// ============================================

export const DEFAULT_WHATSAPP_MESSAGE = `Merhaba, aşağıdaki evrak hakkında bilgi almak istiyorum:

📄 Evrak No: {evrak_no}
💰 Tutar: {tutar}
📅 Vade: {vade_tarihi}
👤 Keşideci: {kesideci}

Detaylı bilgi verebilir misiniz?`
