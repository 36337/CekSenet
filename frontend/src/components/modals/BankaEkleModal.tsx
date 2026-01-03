// ============================================
// ÇekSenet - Banka Ekle Modal
// Yeni banka ekleme dialog'u
// ============================================

import { useState } from 'react'
import { Dialog, DialogTitle, DialogBody, DialogActions } from '@/components/ui/dialog'
import { Field, Label, ErrorMessage } from '@/components/ui/fieldset'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createBanka, type Banka } from '@/services'

// ============================================
// Types
// ============================================

interface BankaEkleModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (banka: Banka) => void
}

// ============================================
// Component
// ============================================

export function BankaEkleModal({ isOpen, onClose, onSuccess }: BankaEkleModalProps) {
  const [bankaAdi, setBankaAdi] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ============================================
  // Handlers
  // ============================================

  const handleClose = () => {
    // Reset state on close
    setBankaAdi('')
    setError('')
    setIsSubmitting(false)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const trimmedAd = bankaAdi.trim()
    if (!trimmedAd) {
      setError('Banka adı gerekli')
      return
    }
    if (trimmedAd.length < 2) {
      setError('Banka adı en az 2 karakter olmalı')
      return
    }
    if (trimmedAd.length > 100) {
      setError('Banka adı en fazla 100 karakter olabilir')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const result = await createBanka({ ad: trimmedAd })
      onSuccess(result.banka)
      handleClose()
    } catch (err: any) {
      // Duplicate banka hatası kontrolü
      if (err?.message?.includes('UNIQUE constraint') || err?.message?.includes('zaten mevcut')) {
        setError('Bu isimde bir banka zaten mevcut')
      } else {
        setError(err?.message || 'Banka eklenirken bir hata oluştu')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============================================
  // Render
  // ============================================

  return (
    <Dialog open={isOpen} onClose={handleClose} size="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle>Yeni Banka Ekle</DialogTitle>
        
        <DialogBody>
          <Field>
            <Label>Banka Adı *</Label>
            <Input
              name="banka_adi"
              type="text"
              value={bankaAdi}
              onChange={(e) => {
                setBankaAdi(e.target.value)
                if (error) setError('')
              }}
              placeholder="Örn: Türkiye Bankası"
              autoFocus
              invalid={!!error}
            />
            {error && <ErrorMessage>{error}</ErrorMessage>}
          </Field>
        </DialogBody>

        <DialogActions>
          <Button
            type="button"
            outline
            onClick={handleClose}
            disabled={isSubmitting}
          >
            İptal
          </Button>
          <Button
            type="submit"
            color="blue"
            disabled={isSubmitting || !bankaAdi.trim()}
          >
            {isSubmitting ? 'Ekleniyor...' : 'Ekle'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default BankaEkleModal
