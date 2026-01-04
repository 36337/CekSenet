// ============================================
// ÇekSenet - Settings Service
// Uygulama ayarları API fonksiyonları
// ============================================

import api from './api'

// ============================================
// Types
// ============================================

export interface SettingValue {
  value: string
  description: string
  editable: boolean
}

export interface Settings {
  [key: string]: SettingValue
}

export interface WhatsAppSettings {
  whatsapp_telefon: string
  whatsapp_mesaj: string
}

// ============================================
// API Functions
// ============================================

/**
 * Tüm ayarları getir
 * @param includeSystem - Sistem ayarlarını dahil et (admin only)
 */
export async function getSettings(includeSystem = false): Promise<Settings> {
  const params = includeSystem ? { include_system: 'true' } : {}
  const response = await api.get('/settings', { params })
  return response.data
}

/**
 * Tek bir ayar değeri getir
 */
export async function getSetting(key: string): Promise<SettingValue> {
  const response = await api.get(`/settings/${key}`)
  return response.data
}

/**
 * Birden fazla ayarı güncelle
 */
export async function updateSettings(settings: Record<string, string>): Promise<{ updated: string[] }> {
  const response = await api.put('/settings', settings)
  return response.data
}

/**
 * Tek bir ayar güncelle
 */
export async function updateSetting(key: string, value: string): Promise<{ success: boolean }> {
  const response = await api.put(`/settings/${key}`, { value })
  return response.data
}

// ============================================
// WhatsApp Specific Functions
// ============================================

/**
 * WhatsApp ayarlarını getir
 */
export async function getWhatsAppSettings(): Promise<WhatsAppSettings> {
  const settings = await getSettings()
  return {
    whatsapp_telefon: settings.whatsapp_telefon?.value || '',
    whatsapp_mesaj: settings.whatsapp_mesaj?.value || ''
  }
}

/**
 * WhatsApp ayarlarını güncelle
 */
export async function updateWhatsAppSettings(data: WhatsAppSettings): Promise<{ updated: string[] }> {
  return updateSettings({
    whatsapp_telefon: data.whatsapp_telefon,
    whatsapp_mesaj: data.whatsapp_mesaj
  })
}

// ============================================
// Export All
// ============================================

export const settingsService = {
  getSettings,
  getSetting,
  updateSettings,
  updateSetting,
  getWhatsAppSettings,
  updateWhatsAppSettings
}

export default settingsService
