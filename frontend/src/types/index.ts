// ============================================
// ÇekSenet - Type Definitions
// ============================================

// User Types
export interface User {
  id: number
  username: string
  ad_soyad: string
  rol: 'admin' | 'normal'
  aktif: boolean
  created_at: string
  updated_at: string
  last_login?: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  success: boolean
  message: string
  token: string
  user: User
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Cari Types
export interface Cari {
  id: number
  unvan: string
  tip: 'musteri' | 'tedarikci'
  yetkili_kisi?: string
  telefon?: string
  email?: string
  adres?: string
  vergi_dairesi?: string
  vergi_no?: string
  notlar?: string
  aktif: boolean
  created_at: string
  updated_at: string
  evrak_sayisi?: number
  toplam_tutar?: number
}

// Evrak Types
export type EvrakTipi = 'cek' | 'senet'
export type EvrakDurumu = 'portfoy' | 'ciro' | 'tahsil' | 'odendi' | 'protestolu' | 'iade'

export interface Evrak {
  id: number
  evrak_no: string
  evrak_tipi: EvrakTipi
  tutar: number
  vade_tarihi: string
  durum: EvrakDurumu
  cari_id: number
  cari_unvan?: string
  banka_sube?: string
  keside_tarihi?: string
  keside_yeri?: string
  keşideci?: string
  bordro_no?: string
  notlar?: string
  created_by: number
  created_at: string
  updated_at: string
}

export interface EvrakHareket {
  id: number
  evrak_id: number
  eski_durum: EvrakDurumu | null
  yeni_durum: EvrakDurumu
  aciklama?: string
  islem_tarihi: string
  kullanici_id: number
  kullanici_adi?: string
}

// Dashboard Types
export interface DashboardKart {
  id: string
  baslik: string
  adet: number
  tutar: number
  renk: 'blue' | 'amber' | 'red' | 'green' | 'violet' | 'orange'
  ikon: string
}

export interface DurumDagilimi {
  durum: string
  label: string
  adet: number
  tutar: number
  renk: string
}

export interface AylikDagilim {
  ay: string
  ayLabel: string
  adet: number
  tutar: number
}

export interface SonHareket {
  id: number
  evrak_id: number
  evrak_no: string
  evrak_tipi: EvrakTipi
  tutar: number
  kesideci: string
  eski_durum: string | null
  yeni_durum: string
  aciklama: string | null
  created_at: string
  islem_yapan: string
  cari_adi: string
}

export interface VadeUyariEvrak {
  id: number
  evrak_no: string
  evrak_tipi: EvrakTipi
  tutar: number
  vade_tarihi: string
  durum: string
  kesideci: string
  cari_id: number
  cari_adi: string
  cari_telefon: string | null
  gecikme_gun?: number
}

export interface VadeUyarilari {
  bugun: VadeUyariEvrak[]
  buHafta: VadeUyariEvrak[]
  gecikmis: VadeUyariEvrak[]
  ozet: {
    bugun: { adet: number; tutar: number }
    buHafta: { adet: number; tutar: number }
    gecikmis: { adet: number; tutar: number }
  }
}

export interface TopCari {
  id: number
  ad_soyad: string
  tip: 'musteri' | 'tedarikci'
  evrak_adet: number
  toplam_tutar: number
  aktif_evrak_adet: number
  aktif_tutar: number
  karsiliksiz_adet: number
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Settings Types
export interface AppSettings {
  sirket_adi?: string
  sirket_telefon?: string
  sirket_adres?: string
  varsayilan_para_birimi?: string
  kurulum_tarihi?: string
}

export interface SetupStatus {
  isSetupComplete: boolean
  adminExists: boolean
}

// Filter Types
export interface EvrakFilters {
  evrak_tipi?: EvrakTipi
  durum?: EvrakDurumu
  cari_id?: number
  vade_baslangic?: string
  vade_bitis?: string
  tutar_min?: number
  tutar_max?: number
  arama?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
