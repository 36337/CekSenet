// ============================================
// ÇekSenet - Evraklar Service
// Çek/Senet API işlemleri
// ============================================

import api from './api'

// ============================================
// Types
// ============================================

export type EvrakTipi = 'cek' | 'senet'
export type EvrakDurumu = 'portfoy' | 'bankada' | 'ciro' | 'tahsil' | 'karsiliksiz'

export interface Evrak {
  id: number
  evrak_tipi: EvrakTipi
  evrak_no: string
  tutar: number
  vade_tarihi: string
  evrak_tarihi: string | null  // Evrak/keşide tarihi (opsiyonel)
  banka_adi: string | null     // Eski alan (geriye uyumluluk)
  banka_id: number | null      // YENİ: Banka ID (foreign key)
  banka_adi_display: string | null  // YENİ: Gösterilecek banka adı (JOIN'den)
  kesideci: string | null      // Artık opsiyonel (boş olabilir)
  cari_id: number | null
  cari_adi: string | null
  durum: EvrakDurumu
  notlar: string | null
  para_birimi: string          // YENİ: TRY, USD, EUR, GBP, CHF
  doviz_kuru: number | null    // YENİ: Döviz kuru (TRY için null)
  created_by: number
  created_at: string
  updated_at: string
}

export interface EvrakDetay extends Evrak {
  cari_telefon?: string | null
  cari_tip?: string | null
}

export interface EvrakHareket {
  id: number
  evrak_id: number
  eski_durum: EvrakDurumu | null
  yeni_durum: EvrakDurumu
  aciklama: string | null
  created_at: string
  kullanici_id: number
  kullanici_adi: string
}

export interface EvrakFormData {
  evrak_tipi: EvrakTipi
  evrak_no: string
  tutar: number | string
  vade_tarihi: string
  evrak_tarihi?: string        // Evrak/keşide tarihi (opsiyonel)
  banka_adi?: string           // Eski alan (geriye uyumluluk)
  banka_id?: number | null     // YENİ: Banka ID
  kesideci?: string            // Artık opsiyonel
  cari_id?: number | null
  durum?: EvrakDurumu
  notlar?: string
  para_birimi?: string         // YENİ: Para birimi (default: TRY)
  doviz_kuru?: number | null   // YENİ: Döviz kuru
}

export interface EvrakFilters {
  durum?: string // virgülle ayrılmış durumlar
  evrak_tipi?: EvrakTipi
  vade_baslangic?: string
  vade_bitis?: string
  tutar_min?: number
  tutar_max?: number
  search?: string
  cari_id?: number
  sort?: 'vade_tarihi' | 'tutar' | 'created_at' | 'evrak_no'
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface EvrakListResponse {
  data: Evrak[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface DurumUpdateResponse {
  message: string
  evrak: Evrak
  hareket: EvrakHareket
}

export interface TopluDurumResponse {
  message: string
  success: number
  failed: Array<{ id: number; message: string }>
}

// ============================================
// Durum Sabitleri
// ============================================

export const DURUM_LABELS: Record<EvrakDurumu, string> = {
  portfoy: 'Portföy',
  bankada: 'Bankada',
  ciro: 'Ciro Edildi',
  tahsil: 'Tahsil Edildi',
  karsiliksiz: 'Karşılıksız',
}

export const DURUM_COLORS: Record<EvrakDurumu, string> = {
  portfoy: 'blue',
  bankada: 'purple',
  ciro: 'orange',
  tahsil: 'green',
  karsiliksiz: 'red',
}

export const EVRAK_TIPI_LABELS: Record<EvrakTipi, string> = {
  cek: 'Çek',
  senet: 'Senet',
}

export const EVRAK_TIPI_COLORS: Record<EvrakTipi, string> = {
  cek: 'cyan',
  senet: 'amber',
}

// Geçerli durum geçişleri
export const DURUM_GECISLERI: Record<EvrakDurumu, EvrakDurumu[]> = {
  portfoy: ['bankada', 'ciro'],
  bankada: ['tahsil', 'karsiliksiz'],
  ciro: [], // Son durum
  tahsil: [], // Son durum
  karsiliksiz: ['tahsil'], // Geri dönüş mümkün
}

// ============================================
// API Functions
// ============================================

/**
 * Evrak listesi getir (filtreli, sayfalı)
 */
export async function getEvraklar(filters: EvrakFilters = {}): Promise<EvrakListResponse> {
  const params = new URLSearchParams()
  
  if (filters.durum) params.append('durum', filters.durum)
  if (filters.evrak_tipi) params.append('evrak_tipi', filters.evrak_tipi)
  if (filters.vade_baslangic) params.append('vade_baslangic', filters.vade_baslangic)
  if (filters.vade_bitis) params.append('vade_bitis', filters.vade_bitis)
  if (filters.tutar_min !== undefined) params.append('tutar_min', String(filters.tutar_min))
  if (filters.tutar_max !== undefined) params.append('tutar_max', String(filters.tutar_max))
  if (filters.search) params.append('search', filters.search)
  if (filters.cari_id) params.append('cari_id', String(filters.cari_id))
  if (filters.sort) params.append('sort', filters.sort)
  if (filters.order) params.append('order', filters.order)
  if (filters.page) params.append('page', String(filters.page))
  if (filters.limit) params.append('limit', String(filters.limit))
  
  const response = await api.get<EvrakListResponse>(`/evraklar?${params.toString()}`)
  return response.data
}

/**
 * Tek evrak detayı getir
 */
export async function getEvrak(id: number): Promise<EvrakDetay> {
  const response = await api.get<EvrakDetay>(`/evraklar/${id}`)
  return response.data
}

/**
 * Yeni evrak oluştur
 */
export async function createEvrak(data: EvrakFormData): Promise<{ message: string; evrak: Evrak }> {
  const response = await api.post<{ message: string; evrak: Evrak }>('/evraklar', {
    ...data,
    tutar: typeof data.tutar === 'string' ? parseFloat(data.tutar) : data.tutar,
    cari_id: data.cari_id || null,
    banka_id: data.banka_id || null,
    para_birimi: data.para_birimi || 'TRY',
    doviz_kuru: data.doviz_kuru || null,
  })
  return response.data
}

/**
 * Evrak güncelle
 */
export async function updateEvrak(id: number, data: EvrakFormData): Promise<{ message: string; evrak: Evrak }> {
  const response = await api.put<{ message: string; evrak: Evrak }>(`/evraklar/${id}`, {
    ...data,
    tutar: typeof data.tutar === 'string' ? parseFloat(data.tutar) : data.tutar,
    cari_id: data.cari_id || null,
    banka_id: data.banka_id || null,
    para_birimi: data.para_birimi || 'TRY',
    doviz_kuru: data.doviz_kuru || null,
  })
  return response.data
}

/**
 * Evrak sil (admin only)
 */
export async function deleteEvrak(id: number): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(`/evraklar/${id}`)
  return response.data
}

/**
 * Evrak durumunu güncelle
 */
export async function updateEvrakDurum(
  id: number, 
  durum: EvrakDurumu, 
  aciklama?: string
): Promise<DurumUpdateResponse> {
  const response = await api.patch<DurumUpdateResponse>(`/evraklar/${id}/durum`, {
    durum,
    aciklama: aciklama || null,
  })
  return response.data
}

/**
 * Evrak hareket geçmişi getir
 */
export async function getEvrakHareketler(id: number): Promise<{
  evrak: EvrakDetay
  hareketler: EvrakHareket[]
}> {
  const response = await api.get<{ evrak: EvrakDetay; hareketler: EvrakHareket[] }>(
    `/evraklar/${id}/hareketler`
  )
  return response.data
}

/**
 * Toplu durum güncelleme
 */
export async function topluDurumGuncelle(
  ids: number[],
  durum: EvrakDurumu,
  aciklama?: string
): Promise<TopluDurumResponse> {
  const response = await api.post<TopluDurumResponse>('/evraklar/toplu-durum', {
    ids,
    durum,
    aciklama: aciklama || null,
  })
  return response.data
}

// ============================================
// Helper Functions
// ============================================

/**
 * Durumun sonraki geçerli durumlarını döndür
 */
export function getGecerliDurumlar(mevcutDurum: EvrakDurumu): EvrakDurumu[] {
  return DURUM_GECISLERI[mevcutDurum] || []
}

/**
 * Durum geçişinin geçerli olup olmadığını kontrol et
 */
export function isDurumGecerli(mevcutDurum: EvrakDurumu, yeniDurum: EvrakDurumu): boolean {
  return DURUM_GECISLERI[mevcutDurum]?.includes(yeniDurum) ?? false
}
