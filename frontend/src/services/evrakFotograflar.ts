// ============================================
// ÇekSenet - Evrak Fotoğrafları Service
// Fotoğraf yükleme, listeleme, silme API işlemleri
// ============================================

import api from './api'

// ============================================
// Types
// ============================================

export interface EvrakFotograf {
  id: number
  evrak_id: number
  dosya_adi: string
  dosya_yolu: string
  thumbnail_yolu: string | null
  boyut: number | null
  mimetype: string | null
  genislik: number | null
  yukseklik: number | null
  created_at: string
  created_by: number | null
  yukleyen_adi: string | null
}

export interface FotografListResponse {
  evrak_id: number
  toplam: number
  fotograflar: EvrakFotograf[]
}

export interface FotografUploadResponse {
  message: string
  yuklenen: number
  hatali: number
  fotograflar: EvrakFotograf[]
  hatalar?: Array<{ dosya: string; hata: string }>
}

export interface FotografDeleteResponse {
  message: string
  silinen: {
    id: number
    dosya_adi: string
  }
}

export interface UploadProgress {
  loaded: number
  total: number
  percent: number
}

// ============================================
// Helper Functions
// ============================================

/**
 * Dosya boyutunu okunabilir formata çevir
 * @param bytes Byte cinsinden boyut
 * @returns Formatlanmış boyut (örn: "2.5 MB")
 */
export function formatFileSize(bytes: number | null): string {
  if (!bytes || bytes === 0) return '0 B'
  
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`
}

/**
 * Fotoğrafın tam URL'ini oluştur
 * @param foto Fotoğraf objesi
 * @param thumbnail Thumbnail mı yoksa orijinal mi
 * @returns Tam URL
 */
export function getFotografUrl(foto: EvrakFotograf, thumbnail: boolean = false): string {
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || ''
  const path = thumbnail && foto.thumbnail_yolu ? foto.thumbnail_yolu : foto.dosya_yolu
  
  // Path zaten /uploads veya uploads ile başlıyorsa
  if (path.startsWith('/uploads')) {
    return `${baseUrl}${path}`
  }
  
  if (path.startsWith('uploads')) {
    return `${baseUrl}/${path}`
  }
  
  // Hiçbiri değilse /uploads ekle
  return `${baseUrl}/uploads/${path}`
}

/**
 * Dosya tipinin resim olup olmadığını kontrol et
 * @param file File objesi
 * @returns Geçerli resim tipi mi
 */
export function isValidImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  return validTypes.includes(file.type)
}

/**
 * Dosya boyutunun limite uygun olup olmadığını kontrol et
 * @param file File objesi
 * @param maxSizeMB Maksimum boyut (MB)
 * @returns Boyut uygun mu
 */
export function isValidFileSize(file: File, maxSizeMB: number = 10): boolean {
  return file.size <= maxSizeMB * 1024 * 1024
}

/**
 * Dosya validasyonu yap
 * @param file File objesi
 * @returns Hata mesajı veya null
 */
export function validateFile(file: File): string | null {
  if (!isValidImageType(file)) {
    return `"${file.name}" desteklenmeyen dosya tipi. Sadece JPG, PNG ve WEBP kabul edilir.`
  }
  
  if (!isValidFileSize(file)) {
    return `"${file.name}" çok büyük. Maksimum dosya boyutu 10 MB.`
  }
  
  return null
}

// ============================================
// API Functions
// ============================================

/**
 * Evraka ait fotoğrafları getir
 * @param evrakId Evrak ID
 * @returns Fotoğraf listesi
 */
export async function getFotograflar(evrakId: number): Promise<FotografListResponse> {
  const response = await api.get<FotografListResponse>(`/evraklar/${evrakId}/fotograflar`)
  return response.data
}

/**
 * Evraka fotoğraf yükle
 * @param evrakId Evrak ID
 * @param files Yüklenecek dosyalar
 * @param onProgress İsteğe bağlı progress callback
 * @returns Yükleme sonucu
 */
export async function uploadFotograflar(
  evrakId: number,
  files: File[],
  onProgress?: (progress: UploadProgress) => void
): Promise<FotografUploadResponse> {
  // Client-side validation
  const validationErrors: string[] = []
  const validFiles: File[] = []
  
  for (const file of files) {
    const error = validateFile(file)
    if (error) {
      validationErrors.push(error)
    } else {
      validFiles.push(file)
    }
  }
  
  if (validFiles.length === 0) {
    throw new Error(
      validationErrors.length > 0
        ? validationErrors.join('\n')
        : 'Yüklenecek geçerli dosya bulunamadı'
    )
  }
  
  // FormData oluştur
  const formData = new FormData()
  for (const file of validFiles) {
    formData.append('fotograflar', file)
  }
  
  // Upload request
  const response = await api.post<FotografUploadResponse>(
    `/evraklar/${evrakId}/fotograflar`,
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
  
  // Client-side validation hataları varsa response'a ekle
  if (validationErrors.length > 0) {
    const existingErrors = response.data.hatalar || []
    response.data.hatalar = [
      ...existingErrors,
      ...validationErrors.map((hata) => ({ dosya: 'Validation', hata })),
    ]
    response.data.hatali += validationErrors.length
  }
  
  return response.data
}

/**
 * Tek dosya yükle (sıralı yükleme için)
 * @param evrakId Evrak ID
 * @param file Yüklenecek dosya
 * @param onProgress Progress callback
 * @returns Yükleme sonucu
 */
export async function uploadTekFotograf(
  evrakId: number,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<EvrakFotograf> {
  const result = await uploadFotograflar(evrakId, [file], onProgress)
  
  if (result.fotograflar.length === 0) {
    const errorMsg = result.hatalar?.[0]?.hata || 'Dosya yüklenemedi'
    throw new Error(errorMsg)
  }
  
  return result.fotograflar[0]
}

/**
 * Fotoğraf sil
 * @param evrakId Evrak ID
 * @param fotografId Fotoğraf ID
 * @returns Silme sonucu
 */
export async function deleteFotograf(
  evrakId: number,
  fotografId: number
): Promise<FotografDeleteResponse> {
  const response = await api.delete<FotografDeleteResponse>(
    `/evraklar/${evrakId}/fotograflar/${fotografId}`
  )
  return response.data
}

/**
 * Evrakın fotoğrafı var mı kontrol et
 * @param evrakId Evrak ID
 * @returns Fotoğraf var mı
 */
export async function hasFotograflar(evrakId: number): Promise<boolean> {
  try {
    const result = await getFotograflar(evrakId)
    return result.toplam > 0
  } catch {
    return false
  }
}
