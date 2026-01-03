// ============================================
// ÇekSenet - Fotoğraf Galeri Bileşeni
// Thumbnail grid, lightbox, silme işlemi
// ============================================

import { useState, useCallback } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'

import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogActions,
} from '@/components/ui/dialog'
import {
  PhotoIcon,
  TrashIcon,
  ArrowPathIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'
import {
  deleteFotograf,
  getFotografUrl,
  formatFileSize,
  type EvrakFotograf,
} from '@/services'

// ============================================
// Types
// ============================================

interface FotografGaleriProps {
  evrakId: number
  fotograflar: EvrakFotograf[]
  onDelete?: (fotografId: number) => void
  isLoading?: boolean
  showDeleteButton?: boolean
}

// ============================================
// Component
// ============================================

export function FotografGaleri({
  evrakId,
  fotograflar,
  onDelete,
  isLoading = false,
  showDeleteButton = true,
}: FotografGaleriProps) {
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingFoto, setDeletingFoto] = useState<EvrakFotograf | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // ============================================
  // Lightbox Handlers
  // ============================================

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }, [])

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false)
  }, [])

  // Lightbox slides oluştur
  const slides = fotograflar.map((foto) => ({
    src: getFotografUrl(foto, false), // Orijinal boyut
    alt: foto.dosya_adi,
    width: foto.genislik || undefined,
    height: foto.yukseklik || undefined,
  }))

  // ============================================
  // Delete Handlers
  // ============================================

  const handleDeleteClick = useCallback((foto: EvrakFotograf, e: React.MouseEvent) => {
    e.stopPropagation() // Lightbox açılmasını engelle
    setDeletingFoto(foto)
    setDeleteError(null)
    setDeleteModalOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingFoto) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await deleteFotograf(evrakId, deletingFoto.id)
      
      // Parent'a bildir
      onDelete?.(deletingFoto.id)
      
      // Modal'ı kapat
      setDeleteModalOpen(false)
      setDeletingFoto(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Silme işlemi başarısız'
      setDeleteError(message)
    } finally {
      setIsDeleting(false)
    }
  }, [evrakId, deletingFoto, onDelete])

  const handleDeleteCancel = useCallback(() => {
    setDeleteModalOpen(false)
    setDeletingFoto(null)
    setDeleteError(null)
  }, [])

  // ============================================
  // Render - Loading
  // ============================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  // ============================================
  // Render - Empty State
  // ============================================

  if (fotograflar.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-zinc-200 py-12 text-center">
        <PhotoIcon className="mx-auto h-12 w-12 text-zinc-300" />
        <Text className="mt-2 text-zinc-500">
          Henüz fotoğraf eklenmemiş
        </Text>
      </div>
    )
  }

  // ============================================
  // Render - Gallery
  // ============================================

  return (
    <>
      {/* Thumbnail Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {fotograflar.map((foto, index) => (
          <FotografThumbnail
            key={foto.id}
            foto={foto}
            onClick={() => openLightbox(index)}
            onDelete={showDeleteButton ? (e) => handleDeleteClick(foto, e) : undefined}
          />
        ))}
      </div>

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={closeLightbox}
        index={lightboxIndex}
        slides={slides}
        carousel={{ finite: fotograflar.length <= 1 }}
        controller={{ closeOnBackdropClick: true }}
        styles={{
          container: { backgroundColor: 'rgba(0, 0, 0, 0.9)' },
        }}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onClose={handleDeleteCancel} size="sm">
        <DialogTitle>Fotoğrafı Sil</DialogTitle>
        <DialogDescription>
          Bu fotoğrafı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
        </DialogDescription>

        <DialogBody>
          {deleteError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {deleteError}
            </div>
          )}

          {deletingFoto && (
            <div className="mt-4 flex items-center gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <img
                src={getFotografUrl(deletingFoto, true)}
                alt={deletingFoto.dosya_adi}
                className="h-16 w-16 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-700">
                  {deletingFoto.dosya_adi}
                </p>
                <p className="text-xs text-zinc-500">
                  {formatFileSize(deletingFoto.boyut)}
                </p>
              </div>
            </div>
          )}
        </DialogBody>

        <DialogActions>
          <Button
            type="button"
            outline
            onClick={handleDeleteCancel}
            disabled={isDeleting}
          >
            İptal
          </Button>
          <Button
            type="button"
            color="red"
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                Siliniyor...
              </>
            ) : (
              <>
                <TrashIcon className="h-5 w-5" />
                Sil
              </>
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

// ============================================
// FotografThumbnail Sub-component
// ============================================

interface FotografThumbnailProps {
  foto: EvrakFotograf
  onClick: () => void
  onDelete?: (e: React.MouseEvent) => void
}

function FotografThumbnail({ foto, onClick, onDelete }: FotografThumbnailProps) {
  const [imageError, setImageError] = useState(false)
  const thumbnailUrl = getFotografUrl(foto, true)

  return (
    <div
      className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 transition-all hover:border-zinc-300 hover:shadow-md"
      onClick={onClick}
    >
      {/* Image */}
      {imageError ? (
        <div className="flex h-full w-full items-center justify-center">
          <PhotoIcon className="h-8 w-8 text-zinc-400" />
        </div>
      ) : (
        <img
          src={thumbnailUrl}
          alt={foto.dosya_adi}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      )}

      {/* Hover Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
        <EyeIcon className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      {/* Delete Button */}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute right-1 top-1 rounded-full bg-white/90 p-1.5 text-zinc-500 opacity-0 shadow-sm transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
          title="Fotoğrafı sil"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      )}

      {/* File Info (on hover) */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <p className="truncate text-xs text-white">
          {foto.dosya_adi}
        </p>
        {foto.boyut && (
          <p className="text-xs text-white/70">
            {formatFileSize(foto.boyut)}
          </p>
        )}
      </div>
    </div>
  )
}

export default FotografGaleri
