// ============================================
// ÇekSenet - Dashboard Service
// Dashboard API calls
// ============================================

import api from './api'
import type {
  DashboardKart,
  DurumDagilimi,
  AylikDagilim,
  SonHareket,
  VadeUyarilari,
  TopCari,
} from '@/types'

// ============================================
// Dashboard API Functions
// ============================================

/**
 * Dashboard istatistik kartlarını getir
 * GET /api/dashboard/kartlar
 */
export async function getKartlar(): Promise<DashboardKart[]> {
  const response = await api.get<DashboardKart[]>('/dashboard/kartlar')
  return response.data
}

/**
 * Durum dağılımını getir (Pie chart için)
 * GET /api/dashboard/durum-dagilimi
 */
export async function getDurumDagilimi(): Promise<DurumDagilimi[]> {
  const response = await api.get<DurumDagilimi[]>('/dashboard/durum-dagilimi')
  return response.data
}

/**
 * Aylık vade dağılımını getir (Bar chart için)
 * GET /api/dashboard/aylik-dagilim
 */
export async function getAylikDagilim(aySayisi: number = 6): Promise<AylikDagilim[]> {
  const response = await api.get<AylikDagilim[]>('/dashboard/aylik-dagilim', {
    params: { ay_sayisi: aySayisi },
  })
  return response.data
}

/**
 * Son hareketleri getir
 * GET /api/dashboard/son-hareketler
 */
export async function getSonHareketler(limit: number = 10): Promise<SonHareket[]> {
  const response = await api.get<SonHareket[]>('/dashboard/son-hareketler', {
    params: { limit },
  })
  return response.data
}

/**
 * Vade uyarılarını getir
 * GET /api/dashboard/vade-uyarilari
 */
export async function getVadeUyarilari(): Promise<VadeUyarilari> {
  const response = await api.get<VadeUyarilari>('/dashboard/vade-uyarilari')
  return response.data
}

/**
 * Top carileri getir
 * GET /api/dashboard/top-cariler
 */
export async function getTopCariler(limit: number = 10): Promise<TopCari[]> {
  const response = await api.get<TopCari[]>('/dashboard/top-cariler', {
    params: { limit },
  })
  return response.data
}

// ============================================
// Utility Functions
// ============================================

/**
 * Para tutarını formatla (₺1.234,56)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Kısa para formatı (₺1.2K, ₺3.5M)
 */
export function formatCurrencyShort(amount: number): string {
  if (amount >= 1_000_000) {
    return `₺${(amount / 1_000_000).toFixed(1)}M`
  }
  if (amount >= 1_000) {
    return `₺${(amount / 1_000).toFixed(1)}K`
  }
  return formatCurrency(amount)
}

/**
 * Tarihi formatla (26 Ara 2025)
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/**
 * Tarihi kısa formatla (26 Ara)
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
  }).format(date)
}

/**
 * Tarih ve saat formatla (26 Ara 2025, 14:30)
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Evrak durumu label'ı
 */
export function getDurumLabel(durum: string): string {
  const labels: Record<string, string> = {
    portfoy: 'Portföy',
    bankada: 'Bankada',
    ciro: 'Ciro Edildi',
    tahsil: 'Tahsil Edildi',
    karsiliksiz: 'Karşılıksız',
  }
  return labels[durum] || durum
}

/**
 * Evrak tipi label'ı
 */
export function getEvrakTipiLabel(tip: string): string {
  return tip === 'cek' ? 'Çek' : 'Senet'
}
