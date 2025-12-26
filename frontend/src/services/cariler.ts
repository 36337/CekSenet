// ============================================
// ÇekSenet - Cariler Service
// Cari hesap API işlemleri
// ============================================

import api from './api'
import type { Evrak } from './evraklar'

// ============================================
// Types
// ============================================

export type CariTip = 'musteri' | 'tedarikci'

export interface Cari {
  id: number
  ad_soyad: string
  tip: CariTip
  telefon: string | null
  email: string | null
  adres: string | null
  vergi_no: string | null
  notlar: string | null
  aktif: boolean
  created_at: string
  updated_at: string
}

export interface CariWithStats extends Cari {
  evrak_sayisi: number
  toplam_tutar: number
  portfoy_tutar: number
  tahsil_tutar: number
}

export interface CariFormData {
  ad_soyad: string
  tip: CariTip
  telefon?: string
  email?: string
  adres?: string
  vergi_no?: string
  notlar?: string
}

export interface CariFilters {
  tip?: CariTip
  search?: string
  page?: number
  limit?: number
}

export interface CariListResponse {
  data: Cari[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CariEvraklarResponse {
  cari: Cari
  data: Evrak[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============================================
// Tip Sabitleri
// ============================================

export const CARI_TIP_LABELS: Record<CariTip, string> = {
  musteri: 'Müşteri',
  tedarikci: 'Tedarikçi',
}

export const CARI_TIP_COLORS: Record<CariTip, string> = {
  musteri: 'green',
  tedarikci: 'blue',
}

// ============================================
// API Functions
// ============================================

/**
 * Cari listesi getir (filtreli, sayfalı)
 */
export async function getCariler(filters: CariFilters = {}): Promise<CariListResponse> {
  const params = new URLSearchParams()
  
  if (filters.tip) params.append('tip', filters.tip)
  if (filters.search) params.append('search', filters.search)
  if (filters.page) params.append('page', String(filters.page))
  if (filters.limit) params.append('limit', String(filters.limit))
  
  const response = await api.get<CariListResponse>(`/cariler?${params.toString()}`)
  return response.data
}

/**
 * Dropdown/Select için basit cari listesi
 * Sayfalama olmadan tüm carileri döndürür (limit: 1000)
 */
export async function getCarilerForSelect(): Promise<Array<{ id: number; ad_soyad: string; tip: CariTip }>> {
  const response = await api.get<CariListResponse>('/cariler?limit=1000')
  return response.data.data.map((cari) => ({
    id: cari.id,
    ad_soyad: cari.ad_soyad,
    tip: cari.tip,
  }))
}

/**
 * Tek cari detayı getir (istatistiklerle birlikte)
 */
export async function getCari(id: number): Promise<CariWithStats> {
  const response = await api.get<CariWithStats>(`/cariler/${id}`)
  return response.data
}

/**
 * Yeni cari oluştur
 */
export async function createCari(data: CariFormData): Promise<{ message: string; cari: Cari }> {
  const response = await api.post<{ message: string; cari: Cari }>('/cariler', data)
  return response.data
}

/**
 * Cari güncelle
 */
export async function updateCari(id: number, data: CariFormData): Promise<{ message: string; cari: Cari }> {
  const response = await api.put<{ message: string; cari: Cari }>(`/cariler/${id}`, data)
  return response.data
}

/**
 * Cari sil
 */
export async function deleteCari(id: number): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(`/cariler/${id}`)
  return response.data
}

/**
 * Cariye ait evrakları getir
 */
export async function getCariEvraklar(
  id: number, 
  options: { page?: number; limit?: number } = {}
): Promise<CariEvraklarResponse> {
  const params = new URLSearchParams()
  if (options.page) params.append('page', String(options.page))
  if (options.limit) params.append('limit', String(options.limit))
  
  const response = await api.get<CariEvraklarResponse>(
    `/cariler/${id}/evraklar?${params.toString()}`
  )
  return response.data
}
