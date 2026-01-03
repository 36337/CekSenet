// ============================================
// ÇekSenet - Import Service
// Excel'den toplu evrak import API işlemleri
// ============================================

import api from './api'

// ============================================
// Types
// ============================================

/**
 * Parse edilmiş tek satır verisi
 */
export interface ParsedRow {
  satir: number
  evrak_tipi: 'cek' | 'senet' | string
  evrak_no: string
  tutar: number | null
  para_birimi: string
  doviz_kuru: number | null
  evrak_tarihi: string | null
  vade_tarihi: string | null
  banka_adi: string | null
  kesideci: string | null
  cari_adi: string | null
  cari_id: number | null
  durum: string
  notlar: string | null
  hatalar: string[]
  uyarilar: string[]
  gecerli: boolean
}

/**
 * Parse özet bilgisi
 */
export interface ParseSummary {
  toplam: number
  gecerli: number
  hatali: number
  uyarili: number
}

/**
 * Parse response
 */
export interface ParseResponse {
  success: boolean
  data: ParsedRow[]
  ozet: ParseSummary
  error?: string
}

/**
 * Import hata detayı
 */
export interface ImportError {
  satir: number
  hata: string
}

/**
 * Import sonuç bilgisi
 */
export interface ImportResult {
  basarili: number
  basarisiz: number
  hatalar: ImportError[]
}

/**
 * Import response
 */
export interface ImportResponse {
  success: boolean
  sonuc: ImportResult
  error?: string
}

/**
 * Info response (yardım bilgisi)
 */
export interface ImportInfo {
  success: boolean
  info: {
    desteklenen_formatlar: string[]
    max_dosya_boyutu: string
    zorunlu_alanlar: string[]
    opsiyonel_alanlar: string[]
    evrak_tipleri: string[]
    durum_secenekleri: string[]
    para_birimleri: string[]
    tarih_formatlari: string[]
    notlar: string[]
  }
}

/**
 * Upload progress bilgisi
 */
export interface UploadProgress {
  loaded: number
  total: number
  percent: number
}

// ============================================
// Validation Helpers
// ============================================

/**
 * Dosya tipinin Excel olup olmadığını kontrol et
 */
export function isValidExcelType(file: File): boolean {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ]
  const validExtensions = ['.xlsx', '.xls']
  
  // MIME type kontrolü
  if (validTypes.includes(file.type)) {
    return true
  }
  
  // Extension kontrolü (bazı sistemlerde MIME type yanlış olabilir)
  const fileName = file.name.toLowerCase()
  return validExtensions.some(ext => fileName.endsWith(ext))
}

/**
 * Dosya boyutunun limite uygun olup olmadığını kontrol et
 */
export function isValidFileSize(file: File, maxSizeMB: number = 5): boolean {
  return file.size <= maxSizeMB * 1024 * 1024
}

/**
 * Dosya validasyonu yap
 */
export function validateExcelFile(file: File): string | null {
  if (!isValidExcelType(file)) {
    return `"${file.name}" desteklenmeyen dosya tipi. Sadece .xlsx ve .xls dosyaları kabul edilir.`
  }
  
  if (!isValidFileSize(file)) {
    return `"${file.name}" çok büyük. Maksimum dosya boyutu 5 MB.`
  }
  
  return null
}

/**
 * Dosya boyutunu okunabilir formata çevir
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`
}

// ============================================
// API Functions
// ============================================

/**
 * Import template dosyasını indir
 * Template bir blob olarak döner, tarayıcıda otomatik indirilir
 */
export async function downloadTemplate(): Promise<void> {
  const response = await api.get('/import/evraklar/template', {
    responseType: 'blob',
  })
  
  // Blob'u indir
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'evrak-import-template.xlsx'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Excel dosyasını yükle ve parse et
 * @param file Yüklenecek Excel dosyası
 * @param onProgress İsteğe bağlı progress callback
 * @returns Parse edilmiş satırlar ve özet
 */
export async function parseExcelFile(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<ParseResponse> {
  // Client-side validation
  const validationError = validateExcelFile(file)
  if (validationError) {
    throw new Error(validationError)
  }
  
  // FormData oluştur
  const formData = new FormData()
  formData.append('file', file)
  
  // Upload request
  const response = await api.post<ParseResponse>(
    '/import/evraklar/parse',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percent: Math.round((progressEvent.loaded * 100) / progressEvent.total),
          })
        }
      },
    }
  )
  
  return response.data
}

/**
 * Seçilen satırları veritabanına kaydet
 * @param satirlar Import edilecek satırlar (parse'dan dönen, seçilmiş olanlar)
 * @returns Import sonucu
 */
export async function importEvraklar(satirlar: ParsedRow[]): Promise<ImportResponse> {
  // Sadece geçerli satırları gönder
  const gecerliSatirlar = satirlar.filter(s => s.gecerli)
  
  if (gecerliSatirlar.length === 0) {
    throw new Error('Import edilecek geçerli satır bulunamadı')
  }
  
  const response = await api.post<ImportResponse>('/import/evraklar/import', {
    satirlar: gecerliSatirlar,
  })
  
  return response.data
}

/**
 * Import yardım bilgisini getir
 * @returns Desteklenen formatlar, alanlar vb. bilgiler
 */
export async function getImportInfo(): Promise<ImportInfo> {
  const response = await api.get<ImportInfo>('/import/evraklar/info')
  return response.data
}

// ============================================
// Helper Functions for UI
// ============================================

/**
 * Satırın durumunu belirle (CSS class için)
 */
export function getRowStatus(row: ParsedRow): 'valid' | 'warning' | 'error' {
  if (!row.gecerli || row.hatalar.length > 0) {
    return 'error'
  }
  if (row.uyarilar.length > 0) {
    return 'warning'
  }
  return 'valid'
}

/**
 * Satır durumuna göre renk class'ı döndür
 */
export function getRowColorClass(row: ParsedRow): string {
  const status = getRowStatus(row)
  switch (status) {
    case 'error':
      return 'bg-red-50 border-red-200'
    case 'warning':
      return 'bg-yellow-50 border-yellow-200'
    case 'valid':
      return 'bg-green-50 border-green-200'
    default:
      return ''
  }
}

/**
 * Satır durumuna göre badge rengi döndür
 */
export function getRowBadgeColor(row: ParsedRow): 'red' | 'yellow' | 'green' {
  const status = getRowStatus(row)
  switch (status) {
    case 'error':
      return 'red'
    case 'warning':
      return 'yellow'
    case 'valid':
      return 'green'
    default:
      return 'green'
  }
}

/**
 * Satır durumuna göre durum metni döndür
 */
export function getRowStatusText(row: ParsedRow): string {
  const status = getRowStatus(row)
  switch (status) {
    case 'error':
      return 'Hatalı'
    case 'warning':
      return 'Uyarı'
    case 'valid':
      return 'Geçerli'
    default:
      return ''
  }
}
