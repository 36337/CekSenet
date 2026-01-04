// ============================================
// ÇekSenet - Krediler Service
// Kredi takip API işlemleri
// ============================================

import api from './api'

// ============================================
// Types
// ============================================

export type KrediTuru = 'tuketici' | 'konut' | 'tasit' | 'ticari' | 'isletme' | 'diger'
export type KrediDurum = 'aktif' | 'kapandi' | 'erken_kapandi'
export type TaksitDurum = 'bekliyor' | 'odendi' | 'gecikti'
export type ParaBirimi = 'TRY' | 'USD' | 'EUR' | 'GBP' | 'CHF'

export interface KrediOzet {
  toplam_taksit: number
  odenen_taksit: number
  kalan_taksit: number
  geciken_taksit: number
  odenen_tutar: number
  kalan_borc: number
  geciken_tutar: number
}

export interface KrediTaksit {
  id: number
  kredi_id: number
  taksit_no: number
  vade_tarihi: string
  tutar: number
  durum: TaksitDurum
  odeme_tarihi: string | null
  odenen_tutar: number | null
  notlar: string | null
  created_at: string
  updated_at: string
}

export interface Kredi {
  id: number
  banka_id: number | null
  banka_adi: string | null
  kredi_turu: KrediTuru
  anapara: number
  faiz_orani: number
  vade_ay: number
  baslangic_tarihi: string
  aylik_taksit: number
  toplam_odeme: number
  para_birimi: ParaBirimi
  notlar: string | null
  durum: KrediDurum
  created_by: number
  created_at: string
  updated_at: string
  // Liste sorgusunda eklenen alanlar
  odenen_taksit_sayisi?: number
  kalan_taksit_sayisi?: number
  geciken_taksit_sayisi?: number
  odenen_toplam?: number
  kalan_borc?: number
}

export interface KrediDetay extends Kredi {
  olusturan_adi: string
  taksitler: KrediTaksit[]
  ozet: KrediOzet
}

export interface KrediFormData {
  banka_id?: number | null
  kredi_turu: KrediTuru
  anapara: number | string
  faiz_orani: number | string
  vade_ay: number | string
  baslangic_tarihi: string
  para_birimi?: ParaBirimi
  notlar?: string
}

export interface KrediUpdateData {
  banka_id?: number | null
  notlar?: string
}

export interface KrediFilters {
  durum?: KrediDurum
  kredi_turu?: KrediTuru
  banka_id?: number
  sort?: 'baslangic_tarihi' | 'anapara' | 'created_at' | 'aylik_taksit'
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface KrediListResponse {
  data: Kredi[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface KrediGenelOzet {
  toplam_kredi: number
  aktif_kredi: number
  toplam_anapara: number
  toplam_odeme: number
  kalan_borc: number
  bu_ay_taksit_adet: number
  bu_ay_taksit_tutar: number
  geciken_taksit_adet: number
  geciken_taksit_tutar: number
}

export interface TaksitOdemeData {
  odeme_tarihi?: string
  odenen_tutar?: number
  notlar?: string
}

export interface TaksitOdemeResponse {
  message: string
  taksit: KrediTaksit
  kredi_durumu: KrediDurum
  ozet: KrediOzet
}

export interface ErkenOdemeData {
  odeme_tarihi?: string
  notlar?: string
}

export interface ErkenOdemeResponse {
  message: string
  odenen_taksit_sayisi: number
  odenen_tutar: number
  kredi: KrediDetay
}

export interface BuAyTaksitlerResponse {
  ay: string
  toplam_adet: number
  toplam_tutar: number
  taksitler: (KrediTaksit & { banka_adi?: string; kredi_turu?: KrediTuru })[]
}

export interface GecikenTaksitlerResponse {
  ozet: {
    toplam_adet: number
    toplam_tutar: number
  }
  taksitler: (KrediTaksit & { banka_adi?: string; kredi_turu?: KrediTuru })[]
}

export interface YaklasanTaksitlerResponse {
  gun_sayisi: number
  toplam_adet: number
  toplam_tutar: number
  taksitler: (KrediTaksit & { banka_adi?: string; kredi_turu?: KrediTuru })[]
}

// ============================================
// Sabitler
// ============================================

export const KREDI_TURU_LABELS: Record<KrediTuru, string> = {
  tuketici: 'Tüketici Kredisi',
  konut: 'Konut Kredisi',
  tasit: 'Taşıt Kredisi',
  ticari: 'Ticari Kredi',
  isletme: 'İşletme Kredisi',
  diger: 'Diğer',
}

export const KREDI_DURUM_LABELS: Record<KrediDurum, string> = {
  aktif: 'Aktif',
  kapandi: 'Kapandı',
  erken_kapandi: 'Erken Kapandı',
}

export const KREDI_DURUM_COLORS: Record<KrediDurum, string> = {
  aktif: 'green',
  kapandi: 'zinc',
  erken_kapandi: 'blue',
}

export const TAKSIT_DURUM_LABELS: Record<TaksitDurum, string> = {
  bekliyor: 'Bekliyor',
  odendi: 'Ödendi',
  gecikti: 'Gecikti',
}

export const TAKSIT_DURUM_COLORS: Record<TaksitDurum, string> = {
  bekliyor: 'yellow',
  odendi: 'green',
  gecikti: 'red',
}

export const PARA_BIRIMI_LABELS: Record<ParaBirimi, string> = {
  TRY: '₺ Türk Lirası',
  USD: '$ Amerikan Doları',
  EUR: '€ Euro',
  GBP: '£ İngiliz Sterlini',
  CHF: '₣ İsviçre Frangı',
}

export const PARA_BIRIMI_SYMBOLS: Record<ParaBirimi, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CHF: '₣',
}

// ============================================
// Yardımcı Fonksiyonlar
// ============================================

/**
 * Aylık taksit tutarını hesapla (anuity formülü)
 * Frontend'de canlı önizleme için kullanılır
 */
export function hesaplaTaksit(anapara: number, yillikFaiz: number, vadeAy: number): number {
  const aylikFaiz = yillikFaiz / 100 / 12
  
  // Faizsiz kredi
  if (aylikFaiz === 0) {
    return Math.round((anapara / vadeAy) * 100) / 100
  }
  
  // Anuity formülü: P * [r(1+r)^n] / [(1+r)^n - 1]
  const taksit = anapara * 
    (aylikFaiz * Math.pow(1 + aylikFaiz, vadeAy)) / 
    (Math.pow(1 + aylikFaiz, vadeAy) - 1)
  
  return Math.round(taksit * 100) / 100
}

/**
 * Toplam ödeme tutarını hesapla
 */
export function hesaplaToplamOdeme(aylikTaksit: number, vadeAy: number): number {
  return Math.round(aylikTaksit * vadeAy * 100) / 100
}

/**
 * Toplam faiz tutarını hesapla
 */
export function hesaplaToplamFaiz(anapara: number, toplamOdeme: number): number {
  return Math.round((toplamOdeme - anapara) * 100) / 100
}

/**
 * Para birimi ile formatla
 */
export function formatKrediTutar(tutar: number, paraBirimi: ParaBirimi = 'TRY'): string {
  const symbol = PARA_BIRIMI_SYMBOLS[paraBirimi]
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(tutar)
  
  // TRY için sembol sonda, diğerleri için başta
  if (paraBirimi === 'TRY') {
    return `${formatted} ${symbol}`
  }
  return `${symbol}${formatted}`
}

/**
 * Tarih formatlama
 */
export function formatKrediTarih(tarih: string): string {
  return new Date(tarih).toLocaleDateString('tr-TR')
}

/**
 * İlerleme yüzdesi hesapla
 */
export function hesaplaIlerleme(odenenTaksit: number, toplamTaksit: number): number {
  if (toplamTaksit === 0) return 0
  return Math.round((odenenTaksit / toplamTaksit) * 100)
}

// ============================================
// API Fonksiyonları - Kredi
// ============================================

/**
 * Kredi listesi getir (filtreleme, sayfalama)
 */
export async function getKrediler(filters: KrediFilters = {}): Promise<KrediListResponse> {
  const params = new URLSearchParams()
  
  if (filters.durum) params.append('durum', filters.durum)
  if (filters.kredi_turu) params.append('kredi_turu', filters.kredi_turu)
  if (filters.banka_id) params.append('banka_id', String(filters.banka_id))
  if (filters.sort) params.append('sort', filters.sort)
  if (filters.order) params.append('order', filters.order)
  if (filters.page) params.append('page', String(filters.page))
  if (filters.limit) params.append('limit', String(filters.limit))
  
  const response = await api.get<KrediListResponse>(`/krediler?${params.toString()}`)
  return response.data
}

/**
 * Tek kredi detayı (taksitlerle)
 */
export async function getKredi(id: number): Promise<KrediDetay> {
  const response = await api.get<KrediDetay>(`/krediler/${id}`)
  return response.data
}

/**
 * Kredi genel özeti (Dashboard için)
 */
export async function getKrediOzet(): Promise<KrediGenelOzet> {
  const response = await api.get<KrediGenelOzet>('/krediler/ozet')
  return response.data
}

/**
 * Yeni kredi oluştur
 */
export async function createKredi(data: KrediFormData): Promise<{ message: string; kredi: KrediDetay }> {
  const response = await api.post<{ message: string; kredi: KrediDetay }>('/krediler', {
    ...data,
    anapara: typeof data.anapara === 'string' ? parseFloat(data.anapara) : data.anapara,
    faiz_orani: typeof data.faiz_orani === 'string' ? parseFloat(data.faiz_orani) : data.faiz_orani,
    vade_ay: typeof data.vade_ay === 'string' ? parseInt(data.vade_ay) : data.vade_ay,
    banka_id: data.banka_id || null,
    para_birimi: data.para_birimi || 'TRY',
  })
  return response.data
}

/**
 * Kredi güncelle (sadece notlar ve banka)
 */
export async function updateKredi(id: number, data: KrediUpdateData): Promise<{ message: string; kredi: KrediDetay }> {
  const response = await api.put<{ message: string; kredi: KrediDetay }>(`/krediler/${id}`, {
    banka_id: data.banka_id || null,
    notlar: data.notlar || null,
  })
  return response.data
}

/**
 * Kredi sil (admin only)
 */
export async function deleteKredi(id: number): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(`/krediler/${id}`)
  return response.data
}

// ============================================
// API Fonksiyonları - Taksit
// ============================================

/**
 * Krediye ait taksit listesi
 */
export async function getTaksitler(krediId: number): Promise<{
  kredi_id: number
  toplam: number
  ozet: KrediOzet
  taksitler: KrediTaksit[]
}> {
  const response = await api.get<{
    kredi_id: number
    toplam: number
    ozet: KrediOzet
    taksitler: KrediTaksit[]
  }>(`/krediler/${krediId}/taksitler`)
  return response.data
}

/**
 * Tek taksit öde
 */
export async function taksitOde(
  krediId: number,
  taksitId: number,
  data: TaksitOdemeData = {}
): Promise<TaksitOdemeResponse> {
  const response = await api.patch<TaksitOdemeResponse>(
    `/krediler/${krediId}/taksitler/${taksitId}/ode`,
    {
      odeme_tarihi: data.odeme_tarihi || null,
      odenen_tutar: data.odenen_tutar || null,
      notlar: data.notlar || null,
    }
  )
  return response.data
}

/**
 * Taksit ödemesini iptal et
 */
export async function taksitIptal(krediId: number, taksitId: number): Promise<TaksitOdemeResponse> {
  const response = await api.patch<TaksitOdemeResponse>(
    `/krediler/${krediId}/taksitler/${taksitId}/iptal`
  )
  return response.data
}

/**
 * Erken ödeme (kalan tüm taksitleri öde)
 */
export async function erkenOdeme(krediId: number, data: ErkenOdemeData = {}): Promise<ErkenOdemeResponse> {
  const response = await api.post<ErkenOdemeResponse>(`/krediler/${krediId}/erken-odeme`, {
    odeme_tarihi: data.odeme_tarihi || null,
    notlar: data.notlar || null,
  })
  return response.data
}

// ============================================
// API Fonksiyonları - Taksit Listeleri
// ============================================

/**
 * Bu ay ödenecek taksitler
 */
export async function getBuAyTaksitler(): Promise<BuAyTaksitlerResponse> {
  const response = await api.get<BuAyTaksitlerResponse>('/krediler/taksitler/bu-ay')
  return response.data
}

/**
 * Geciken taksitler
 */
export async function getGecikenTaksitler(): Promise<GecikenTaksitlerResponse> {
  const response = await api.get<GecikenTaksitlerResponse>('/krediler/taksitler/geciken')
  return response.data
}

/**
 * Yaklaşan taksitler
 */
export async function getYaklasanTaksitler(gunSayisi: number = 7): Promise<YaklasanTaksitlerResponse> {
  const response = await api.get<YaklasanTaksitlerResponse>(
    `/krediler/taksitler/yaklasan?gun=${gunSayisi}`
  )
  return response.data
}
