// ============================================
// ÇekSenet - Type Definitions
// Ortak tipler ve sabitler
// ============================================

// ============================================
// User & Auth Types
// ============================================

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

// ============================================
// Evrak & Cari Base Types (Backend ile uyumlu)
// Detaylı tipler için services/evraklar.ts ve services/cariler.ts kullanın
// ============================================

export type EvrakTipi = 'cek' | 'senet'

// Backend'deki geçerli durumlar
export type EvrakDurumu = 'portfoy' | 'bankada' | 'ciro' | 'tahsil' | 'karsiliksiz'

export type CariTip = 'musteri' | 'tedarikci'

// ============================================
// Dashboard Types
// ============================================

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
  tip: CariTip
  evrak_adet: number
  toplam_tutar: number
  aktif_evrak_adet: number
  aktif_tutar: number
  karsiliksiz_adet: number
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============================================
// Settings Types
// ============================================

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
