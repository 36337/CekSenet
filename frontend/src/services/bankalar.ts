// ============================================
// ÇekSenet - Bankalar Service
// Banka API işlemleri
// ============================================

import api from './api'

// ============================================
// Types
// ============================================

export interface Banka {
  id: number
  ad: string
  aktif: number
  created_at: string
}

export interface BankaFormData {
  ad: string
}

export interface BankaListResponse {
  data: Banka[]
  total: number
}

// ============================================
// API Functions
// ============================================

/**
 * Tüm bankaları getir (aktif olanlar)
 */
export async function getBankalar(): Promise<Banka[]> {
  const response = await api.get<BankaListResponse>('/bankalar')
  return response.data.data
}

/**
 * Dropdown/Select için basit banka listesi
 */
export async function getBankalarForSelect(): Promise<Array<{ id: number; ad: string }>> {
  const bankalar = await getBankalar()
  return bankalar.map((banka) => ({
    id: banka.id,
    ad: banka.ad,
  }))
}

/**
 * Tek banka detayı getir
 */
export async function getBanka(id: number): Promise<Banka> {
  const response = await api.get<Banka>(`/bankalar/${id}`)
  return response.data
}

/**
 * Banka ara (autocomplete için)
 */
export async function searchBankalar(term: string): Promise<Banka[]> {
  if (!term || term.length < 2) return []
  
  const response = await api.get<BankaListResponse>(`/bankalar?search=${encodeURIComponent(term)}`)
  return response.data.data
}

/**
 * Yeni banka oluştur
 */
export async function createBanka(data: BankaFormData): Promise<{ message: string; banka: Banka }> {
  const response = await api.post<{ message: string; banka: Banka }>('/bankalar', data)
  return response.data
}

/**
 * Banka güncelle (admin only)
 */
export async function updateBanka(id: number, data: BankaFormData): Promise<{ message: string; banka: Banka }> {
  const response = await api.put<{ message: string; banka: Banka }>(`/bankalar/${id}`, data)
  return response.data
}

/**
 * Banka sil (admin only, soft delete)
 */
export async function deleteBanka(id: number): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(`/bankalar/${id}`)
  return response.data
}

/**
 * Banka adına göre ID bul veya yeni oluştur
 * Form'da yeni banka girildiğinde kullanılır
 */
export async function getOrCreateBanka(ad: string): Promise<Banka> {
  // Önce mevcut bankalarda ara
  const bankalar = await getBankalar()
  const mevcut = bankalar.find(b => b.ad.toLowerCase() === ad.toLowerCase())
  
  if (mevcut) {
    return mevcut
  }
  
  // Yoksa yeni oluştur
  const result = await createBanka({ ad })
  return result.banka
}
