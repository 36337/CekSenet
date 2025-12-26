// ============================================
// ÇekSenet - Reports Service
// Rapor API çağrıları
// ============================================

import api from './api'
import type { EvrakTipi, EvrakDurumu, CariTip } from '@/types'

// ============================================
// Types
// ============================================

// Tarih Aralığı Raporu
export interface TarihAraligiFiltre {
  baslangic: string  // YYYY-MM-DD
  bitis: string      // YYYY-MM-DD
  tarih_tipi?: 'vade' | 'kayit'
  durum?: string     // Virgülle ayrılmış: 'portfoy,bankada'
  evrak_tipi?: EvrakTipi
}

export interface AdetTutar {
  adet: number
  tutar: number
}

export interface RaporOzet {
  toplam: AdetTutar
  cek: AdetTutar
  senet: AdetTutar
  durumlar: {
    portfoy: AdetTutar
    bankada: AdetTutar
    tahsil: AdetTutar
    ciro: AdetTutar
    karsiliksiz: AdetTutar
  }
}

export interface RaporEvrak {
  id: number
  evrak_no: string
  evrak_tipi: EvrakTipi
  tutar: number
  vade_tarihi: string
  durum: EvrakDurumu
  kesideci: string
  banka_adi: string | null
  cari_id: number | null
  cari_adi: string | null
  cari_tip: CariTip | null
  notlar: string | null
  created_at: string
}

export interface TarihAraligiRapor {
  filtreler: {
    baslangic: string
    bitis: string
    tarih_tipi: string
    durum: string | null
    evrak_tipi: string | null
  }
  ozet: RaporOzet
  detay: RaporEvrak[]
}

// Vade Raporu
export interface VadeRaporuFiltre {
  gun?: number       // 1-365, default: 30
  gecikmis_dahil?: boolean  // default: true
}

export interface GunlukVade {
  gun: string
  adet: number
  tutar: number
}

export interface VadeRaporu {
  filtreler: {
    gun: number
    gecikmisDahil: boolean
  }
  ozet: {
    gecikmis: AdetTutar
    bugun: AdetTutar
    buHafta: AdetTutar
    buAy: AdetTutar
    toplam: AdetTutar
  }
  gunluk: GunlukVade[]
  detay: RaporEvrak[]
}

// Cari Raporu
export interface CariRapor {
  cari: {
    id: number
    ad_soyad: string
    tip: CariTip
    telefon: string | null
    email: string | null
    adres: string | null
  }
  ozet: {
    toplam_adet: number
    toplam_tutar: number
    aktif_adet: number
    aktif_tutar: number
    tahsil_adet: number
    tahsil_tutar: number
    karsiliksiz_adet: number
    karsiliksiz_tutar: number
  }
  detay: RaporEvrak[]
}

// Tüm Cariler Raporu
export interface CarilerRaporuFiltre {
  tip?: CariTip
  siralama?: 'tutar' | 'adet' | 'ad'
}

export interface CariOzet {
  id: number
  ad_soyad: string
  tip: CariTip
  toplam_adet: number
  toplam_tutar: number
  aktif_adet: number
  aktif_tutar: number
  tahsil_adet: number
  karsiliksiz_adet: number
}

export interface CarilerRaporu {
  filtreler: {
    tip: string | null
    siralama: string
  }
  ozet: {
    toplam_cari: number
    toplam_evrak: number
    toplam_tutar: number
  }
  cariler: CariOzet[]
}

// ============================================
// API Functions
// ============================================

/**
 * Tarih aralığı bazlı evrak raporu
 */
export async function getTarihAraligiRaporu(filtre: TarihAraligiFiltre): Promise<TarihAraligiRapor> {
  const params = new URLSearchParams()
  params.append('baslangic', filtre.baslangic)
  params.append('bitis', filtre.bitis)
  
  if (filtre.tarih_tipi) {
    params.append('tarih_tipi', filtre.tarih_tipi)
  }
  if (filtre.durum) {
    params.append('durum', filtre.durum)
  }
  if (filtre.evrak_tipi) {
    params.append('evrak_tipi', filtre.evrak_tipi)
  }

  const response = await api.get<TarihAraligiRapor>(`/raporlar/tarih-araligi?${params.toString()}`)
  return response.data
}

/**
 * Vade raporu (önümüzdeki X gün)
 */
export async function getVadeRaporu(filtre?: VadeRaporuFiltre): Promise<VadeRaporu> {
  const params = new URLSearchParams()
  
  if (filtre?.gun) {
    params.append('gun', filtre.gun.toString())
  }
  if (filtre?.gecikmis_dahil !== undefined) {
    params.append('gecikmis_dahil', filtre.gecikmis_dahil.toString())
  }

  const queryString = params.toString()
  const url = queryString ? `/raporlar/vade?${queryString}` : '/raporlar/vade'
  
  const response = await api.get<VadeRaporu>(url)
  return response.data
}

/**
 * Cari bazlı rapor
 */
export async function getCariRaporu(cariId: number): Promise<CariRapor> {
  const response = await api.get<CariRapor>(`/raporlar/cari/${cariId}`)
  return response.data
}

/**
 * Tüm cariler özet raporu
 */
export async function getCarilerRaporu(filtre?: CarilerRaporuFiltre): Promise<CarilerRaporu> {
  const params = new URLSearchParams()
  
  if (filtre?.tip) {
    params.append('tip', filtre.tip)
  }
  if (filtre?.siralama) {
    params.append('siralama', filtre.siralama)
  }

  const queryString = params.toString()
  const url = queryString ? `/raporlar/cariler?${queryString}` : '/raporlar/cariler'
  
  const response = await api.get<CarilerRaporu>(url)
  return response.data
}

/**
 * Excel dosyası olarak export
 * Dosyayı indirmek için blob olarak döner
 */
export async function downloadExcel(filtre: TarihAraligiFiltre): Promise<Blob> {
  const params = new URLSearchParams()
  params.append('baslangic', filtre.baslangic)
  params.append('bitis', filtre.bitis)
  
  if (filtre.tarih_tipi) {
    params.append('tarih_tipi', filtre.tarih_tipi)
  }
  if (filtre.durum) {
    params.append('durum', filtre.durum)
  }
  if (filtre.evrak_tipi) {
    params.append('evrak_tipi', filtre.evrak_tipi)
  }

  const response = await api.get(`/raporlar/excel?${params.toString()}`, {
    responseType: 'blob'
  })
  
  return response.data
}

/**
 * Excel dosyasını indir ve kaydet
 */
export async function exportToExcel(filtre: TarihAraligiFiltre): Promise<void> {
  const blob = await downloadExcel(filtre)
  
  // Dosya adı oluştur
  const tarih = new Date().toISOString().split('T')[0]
  const dosyaAdi = `evraklar_${filtre.baslangic}_${filtre.bitis}_${tarih}.xlsx`
  
  // Blob'dan URL oluştur ve indir
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = dosyaAdi
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// ============================================
// Helper Functions
// ============================================

/**
 * Tarih formatla: YYYY-MM-DD -> DD.MM.YYYY
 */
export function formatTarih(tarih: string): string {
  if (!tarih) return '-'
  const date = new Date(tarih)
  return date.toLocaleDateString('tr-TR')
}

/**
 * Para formatla: 12345.67 -> 12.345,67 ₺
 */
export function formatPara(tutar: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(tutar)
}

/**
 * Bugünün tarihini YYYY-MM-DD formatında döner
 */
export function getBugun(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Son X günün başlangıç tarihini döner
 */
export function getSonXGun(gun: number): string {
  const tarih = new Date()
  tarih.setDate(tarih.getDate() - gun)
  return tarih.toISOString().split('T')[0]
}

/**
 * Önümüzdeki X günün bitiş tarihini döner
 */
export function getGelecekXGun(gun: number): string {
  const tarih = new Date()
  tarih.setDate(tarih.getDate() + gun)
  return tarih.toISOString().split('T')[0]
}

/**
 * Ayın ilk gününü döner
 */
export function getAyBaslangic(ay?: number, yil?: number): string {
  const tarih = new Date()
  if (ay !== undefined) tarih.setMonth(ay)
  if (yil !== undefined) tarih.setFullYear(yil)
  tarih.setDate(1)
  return tarih.toISOString().split('T')[0]
}

/**
 * Ayın son gününü döner
 */
export function getAySonu(ay?: number, yil?: number): string {
  const tarih = new Date()
  if (ay !== undefined) tarih.setMonth(ay + 1)
  else tarih.setMonth(tarih.getMonth() + 1)
  if (yil !== undefined) tarih.setFullYear(yil)
  tarih.setDate(0) // Önceki ayın son günü
  return tarih.toISOString().split('T')[0]
}
