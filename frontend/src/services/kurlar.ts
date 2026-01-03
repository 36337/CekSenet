// ============================================
// ÇekSenet - Kurlar Service
// TCMB Döviz Kurları API işlemleri
// ============================================

import api from './api'

// ============================================
// Types
// ============================================

export interface KurlarResponse {
  kurlar: Record<string, number>  // { USD: 35.50, EUR: 38.75, ... }
  cached: boolean
  updated_at: string
  source: string
}

export interface TekKurResponse {
  para_birimi: string
  kur: number
  cached: boolean
  updated_at: string
}

export interface CacheStatusResponse {
  has_cache: boolean
  updated_at: string | null
  age_seconds: number | null
  is_stale: boolean
}

// ============================================
// API Functions
// ============================================

/**
 * Tüm döviz kurlarını getir
 * @returns { kurlar: { USD: 35.50, EUR: 38.75, GBP: 42.10, CHF: 40.20 }, cached: boolean, updated_at: string }
 */
export async function getKurlar(): Promise<KurlarResponse> {
  const response = await api.get<KurlarResponse>('/kurlar')
  return response.data
}

/**
 * Tek bir para biriminin kurunu getir
 * @param paraBirimi - Para birimi kodu (USD, EUR, GBP, CHF)
 */
export async function getKur(paraBirimi: string): Promise<TekKurResponse> {
  const response = await api.get<TekKurResponse>(`/kurlar/${paraBirimi}`)
  return response.data
}

/**
 * Cache durumunu kontrol et (debug için)
 */
export async function getCacheStatus(): Promise<CacheStatusResponse> {
  const response = await api.get<CacheStatusResponse>('/kurlar/status/cache')
  return response.data
}

// ============================================
// Helper Functions
// ============================================

/**
 * Belirli bir para birimi için kuru getir
 * Hata durumunda null döner (form'da manuel giriş gerekir)
 */
export async function getKurSafe(paraBirimi: string): Promise<number | null> {
  // TRY için kur gerekmez
  if (paraBirimi === 'TRY') return null
  
  try {
    const response = await getKur(paraBirimi)
    return response.kur
  } catch (error) {
    console.warn(`Kur alınamadı: ${paraBirimi}`, error)
    return null
  }
}

/**
 * Tüm kurları bir obje olarak getir
 * Hata durumunda boş obje döner
 */
export async function getKurlarSafe(): Promise<Record<string, number>> {
  try {
    const response = await getKurlar()
    return response.kurlar
  } catch (error) {
    console.warn('Kurlar alınamadı', error)
    return {}
  }
}

/**
 * Kur verisinin ne kadar eski olduğunu formatla
 * @param updatedAt - ISO tarih string
 * @returns "5 dakika önce", "2 saat önce", vb.
 */
export function formatKurAge(updatedAt: string): string {
  const now = new Date()
  const updated = new Date(updatedAt)
  const diffMs = now.getTime() - updated.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  
  if (diffMins < 1) return 'Az önce'
  if (diffMins < 60) return `${diffMins} dakika önce`
  if (diffHours < 24) return `${diffHours} saat önce`
  
  return updated.toLocaleDateString('tr-TR')
}

/**
 * Kur bilgisini kullanıcı dostu formatta göster
 * @param kur - Kur değeri
 * @param paraBirimi - Para birimi kodu
 * @returns "1 USD = ₺35,50"
 */
export function formatKurDisplay(kur: number, paraBirimi: string): string {
  const formatted = kur.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  })
  return `1 ${paraBirimi} = ₺${formatted}`
}
