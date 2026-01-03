// ============================================
// ÇekSenet - Fotoğraf Yükle Bileşeni
// Drag & drop, progress bar, mobil kamera desteği
// ============================================

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  PhotoIcon,
  CameraIcon,
  XMarkIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import {
  uploadTekFotograf,
  validateFile,
  formatFileSize,
  type EvrakFotograf,
  type UploadProgress,
} from '@/services'

// ============================================
// Types
// ============================================

interface FotografYukleProps {
  evrakId: number
  onUploadComplete: (fotograflar: EvrakFotograf[]) => void
  disabled?: boolean
  maxFiles?: number
}

interface FileWithStatus {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
  result?: EvrakFotograf
  preview?: string
}

// ============================================
// Component
// ============================================

export function FotografYukle({
  evrakId,
  onUploadComplete,
  disabled = false,
  maxFiles = 10,
}: FotografYukleProps) {
  // State
  const [files, setFiles] = useState<FileWithStatus[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // ============================================
  // Helpers
  // ============================================

  const generateId = () => Math.random().toString(36).substring(2, 9)

  const createFilePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.readAsDataURL(file)
    })
  }

  // ============================================
  // File Handling
  // ============================================

  const addFiles = useCallback(async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    
    // Maksimum dosya kontrolü
    const remainingSlots = maxFiles - files.length
    if (remainingSlots <= 0) {
      alert(`En fazla ${maxFiles} dosya yükleyebilirsiniz.`)
      return
    }
    
    const filesToAdd = fileArray.slice(0, remainingSlots)
    
    // Her dosya için status objesi oluştur
    const newFileStatuses: FileWithStatus[] = []
    
    for (const file of filesToAdd) {
      const validationError = validateFile(file)
      const preview = validationError ? undefined : await createFilePreview(file)
      
      newFileStatuses.push({
        id: generateId(),
        file,
        status: validationError ? 'error' : 'pending',
        progress: 0,
        error: validationError || undefined,
        preview,
      })
    }
    
    setFiles((prev) => [...prev, ...newFileStatuses])
  }, [files.length, maxFiles])

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setFiles([])
  }, [])

  // ============================================
  // Upload Logic
  // ============================================

  const uploadFiles = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending')
    
    if (pendingFiles.length === 0) return
    
    setIsUploading(true)
    const uploadedPhotos: EvrakFotograf[] = []
    
    // Sıralı yükleme
    for (const fileStatus of pendingFiles) {
      // Status'u uploading yap
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileStatus.id ? { ...f, status: 'uploading' as const, progress: 0 } : f
        )
      )
      
      try {
        const result = await uploadTekFotograf(
          evrakId,
          fileStatus.file,
          (progress: UploadProgress) => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileStatus.id ? { ...f, progress: progress.percent } : f
              )
            )
          }
        )
        
        // Başarılı
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileStatus.id
              ? { ...f, status: 'success' as const, progress: 100, result }
              : f
          )
        )
        
        uploadedPhotos.push(result)
        
      } catch (err) {
        // Hatalı
        const errorMessage = err instanceof Error ? err.message : 'Yükleme başarısız'
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileStatus.id
              ? { ...f, status: 'error' as const, error: errorMessage }
              : f
          )
        )
      }
    }
    
    setIsUploading(false)
    
    // Başarılı yüklemeleri bildir
    if (uploadedPhotos.length > 0) {
      onUploadComplete(uploadedPhotos)
    }
  }, [files, evrakId, onUploadComplete])

  // ============================================
  // Drag & Drop Handlers
  // ============================================

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !isUploading) {
      setIsDragging(true)
    }
  }, [disabled, isUploading])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (disabled || isUploading) return
    
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles)
    }
  }, [disabled, isUploading, addFiles])

  // ============================================
  // Input Handlers
  // ============================================

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleCameraCapture = useCallback(() => {
    cameraInputRef.current?.click()
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      addFiles(selectedFiles)
    }
    // Input'u resetle (aynı dosyayı tekrar seçebilmek için)
    e.target.value = ''
  }, [addFiles])

  // ============================================
  // Computed Values
  // ============================================

  const pendingCount = files.filter((f) => f.status === 'pending').length
  const hasFiles = files.length > 0
  const canUpload = pendingCount > 0 && !isUploading && !disabled

  // ============================================
  // Render
  // ============================================

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative rounded-lg border-2 border-dashed p-6 text-center transition-colors
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-zinc-300 hover:border-zinc-400'
          }
          ${disabled || isUploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        `}
        onClick={() => !disabled && !isUploading && handleFileSelect()}
      >
        <PhotoIcon className="mx-auto h-12 w-12 text-zinc-400" />
        <p className="mt-2 text-sm font-medium text-zinc-700">
          {isDragging ? 'Dosyaları bırakın' : 'Fotoğrafları sürükleyip bırakın'}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          veya dosya seçmek için tıklayın
        </p>
        <p className="mt-2 text-xs text-zinc-400">
          JPG, PNG, WEBP • Maks. 10 MB • En fazla {maxFiles} dosya
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          outline
          onClick={handleFileSelect}
          disabled={disabled || isUploading}
        >
          <PhotoIcon className="h-5 w-5" />
          Dosya Seç
        </Button>
        
        {/* Mobil kamera butonu */}
        <Button
          type="button"
          outline
          onClick={handleCameraCapture}
          disabled={disabled || isUploading}
          className="sm:hidden"
        >
          <CameraIcon className="h-5 w-5" />
          Kamera
        </Button>
        
        {canUpload && (
          <Button
            type="button"
            color="blue"
            onClick={uploadFiles}
          >
            <ArrowPathIcon className="h-5 w-5" />
            {pendingCount} Dosya Yükle
          </Button>
        )}
        
        {hasFiles && !isUploading && (
          <Button
            type="button"
            outline
            onClick={clearAll}
          >
            Temizle
          </Button>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* File List */}
      {hasFiles && (
        <div className="space-y-2">
          {files.map((fileStatus) => (
            <FileItem
              key={fileStatus.id}
              fileStatus={fileStatus}
              onRemove={() => removeFile(fileStatus.id)}
              isUploading={isUploading}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// FileItem Sub-component
// ============================================

interface FileItemProps {
  fileStatus: FileWithStatus
  onRemove: () => void
  isUploading: boolean
}

function FileItem({ fileStatus, onRemove, isUploading }: FileItemProps) {
  const { file, status, progress, error, preview } = fileStatus

  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3">
      {/* Preview */}
      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-zinc-100">
        {preview ? (
          <img
            src={preview}
            alt={file.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PhotoIcon className="h-6 w-6 text-zinc-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-700">
          {file.name}
        </p>
        <p className="text-xs text-zinc-500">
          {formatFileSize(file.size)}
        </p>
        
        {/* Progress Bar */}
        {status === 'uploading' && (
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        
        {/* Error Message */}
        {status === 'error' && error && (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        )}
      </div>

      {/* Status Icon */}
      <div className="flex-shrink-0">
        {status === 'pending' && (
          <button
            type="button"
            onClick={onRemove}
            disabled={isUploading}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-50"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
        
        {status === 'uploading' && (
          <ArrowPathIcon className="h-5 w-5 animate-spin text-blue-500" />
        )}
        
        {status === 'success' && (
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
        )}
        
        {status === 'error' && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}

export default FotografYukle
