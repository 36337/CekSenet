// ============================================
// ÇekSenet - Evrak Düzenleme Sayfası
// ============================================

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldGroup, Label, Description, ErrorMessage } from '@/components/ui/fieldset'
import { Dialog, DialogTitle, DialogDescription, DialogBody, DialogActions } from '@/components/ui/dialog'
import { ArrowLeftIcon, PencilSquareIcon, ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import {
  getEvrak,
  updateEvrak,
  getCarilerForSelect,
  DURUM_LABELS,
  EVRAK_TIPI_LABELS,
  type EvrakFormData,
  type EvrakDetay,
} from '@/services'

// ============================================
// Types
// ============================================

interface FormErrors {
  evrak_tipi?: string
  evrak_no?: string
  tutar?: string
  vade_tarihi?: string
  kesideci?: string
  banka_adi?: string
  cari_id?: string
  notlar?: string
  general?: string
}

interface CariOption {
  id: number
  ad_soyad: string
  tip: 'musteri' | 'tedarikci'
}

// ============================================
// Component
// ============================================

export function EvrakDuzenlePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const evrakId = parseInt(id || '0')

  // Original data for concurrent edit check
  const [originalEvrak, setOriginalEvrak] = useState<EvrakDetay | null>(null)
  const [originalUpdatedAt, setOriginalUpdatedAt] = useState<string>('')

  // Form state
  const [formData, setFormData] = useState<EvrakFormData>({
    evrak_tipi: 'cek',
    evrak_no: '',
    tutar: '',
    vade_tarihi: '',
    banka_adi: '',
    kesideci: '',
    cari_id: null,
    durum: 'portfoy',
    notlar: '',
  })

  // UI state
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cariler, setCariler] = useState<CariOption[]>([])
  const [isLoadingCariler, setIsLoadingCariler] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Concurrent edit dialog
  const [showConcurrentEditDialog, setShowConcurrentEditDialog] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(false)

  // ============================================
  // Load Evrak Data
  // ============================================

  useEffect(() => {
    async function loadEvrak() {
      if (!evrakId) {
        setLoadError('Geçersiz evrak ID')
        setIsLoading(false)
        return
      }

      try {
        const evrak = await getEvrak(evrakId)
        setOriginalEvrak(evrak)
        setOriginalUpdatedAt(evrak.updated_at)
        
        // Populate form
        setFormData({
          evrak_tipi: evrak.evrak_tipi,
          evrak_no: evrak.evrak_no,
          tutar: evrak.tutar.toString(),
          vade_tarihi: evrak.vade_tarihi,
          banka_adi: evrak.banka_adi || '',
          kesideci: evrak.kesideci,
          cari_id: evrak.cari_id,
          durum: evrak.durum,
          notlar: evrak.notlar || '',
        })
      } catch (err: any) {
        setLoadError(err?.message || 'Evrak yüklenemedi')
      } finally {
        setIsLoading(false)
      }
    }
    loadEvrak()
  }, [evrakId])

  // ============================================
  // Load Cariler for Select
  // ============================================

  useEffect(() => {
    async function loadCariler() {
      try {
        const data = await getCarilerForSelect()
        setCariler(data)
      } catch (err) {
        console.error('Cariler yüklenemedi:', err)
      } finally {
        setIsLoadingCariler(false)
      }
    }
    loadCariler()
  }, [])

  // ============================================
  // Validation
  // ============================================

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Evrak tipi
    if (!formData.evrak_tipi) {
      newErrors.evrak_tipi = 'Evrak tipi seçiniz'
    }

    // Evrak no
    if (!formData.evrak_no.trim()) {
      newErrors.evrak_no = 'Evrak no gerekli'
    } else if (formData.evrak_no.length > 50) {
      newErrors.evrak_no = 'Evrak no en fazla 50 karakter olabilir'
    }

    // Tutar
    const tutarNum = typeof formData.tutar === 'string' 
      ? parseFloat(formData.tutar) 
      : formData.tutar
    if (!formData.tutar || isNaN(tutarNum)) {
      newErrors.tutar = 'Geçerli bir tutar giriniz'
    } else if (tutarNum <= 0) {
      newErrors.tutar = 'Tutar 0\'dan büyük olmalı'
    }

    // Vade tarihi
    if (!formData.vade_tarihi) {
      newErrors.vade_tarihi = 'Vade tarihi seçiniz'
    }

    // Keşideci
    if (!formData.kesideci.trim()) {
      newErrors.kesideci = 'Keşideci gerekli'
    } else if (formData.kesideci.length < 2) {
      newErrors.kesideci = 'Keşideci en az 2 karakter olmalı'
    } else if (formData.kesideci.length > 200) {
      newErrors.kesideci = 'Keşideci en fazla 200 karakter olabilir'
    }

    // Banka adı (opsiyonel ama max 100 karakter)
    if (formData.banka_adi && formData.banka_adi.length > 100) {
      newErrors.banka_adi = 'Banka adı en fazla 100 karakter olabilir'
    }

    // Notlar (opsiyonel ama max 1000 karakter)
    if (formData.notlar && formData.notlar.length > 1000) {
      newErrors.notlar = 'Notlar en fazla 1000 karakter olabilir'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ============================================
  // Check Concurrent Edit
  // ============================================

  const checkConcurrentEdit = async (): Promise<boolean> => {
    try {
      const currentEvrak = await getEvrak(evrakId)
      if (currentEvrak.updated_at !== originalUpdatedAt) {
        // Someone else has modified the record
        setShowConcurrentEditDialog(true)
        return false
      }
      return true
    } catch {
      // If we can't check, allow the submit
      return true
    }
  }

  // ============================================
  // Handlers
  // ============================================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'cari_id' ? (value ? parseInt(value) : null) : value,
    }))
    
    // Clear field error on change
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    // Check for concurrent edit (unless force submit)
    if (!pendingSubmit) {
      const canProceed = await checkConcurrentEdit()
      if (!canProceed) {
        setIsSubmitting(false)
        return
      }
    }

    try {
      await updateEvrak(evrakId, formData)
      navigate(`/evraklar/${evrakId}`, { 
        state: { message: 'Evrak başarıyla güncellendi' } 
      })
    } catch (err: any) {
      const message = err?.message || 'Evrak güncellenirken bir hata oluştu'
      setErrors({ general: message })
    } finally {
      setIsSubmitting(false)
      setPendingSubmit(false)
    }
  }

  const handleForceSubmit = () => {
    setShowConcurrentEditDialog(false)
    setPendingSubmit(true)
    // Trigger submit again
    const form = document.querySelector('form')
    if (form) {
      form.requestSubmit()
    }
  }

  const handleRefresh = () => {
    setShowConcurrentEditDialog(false)
    window.location.reload()
  }

  // ============================================
  // Loading & Error States
  // ============================================

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <span className="ml-3 text-zinc-600 dark:text-zinc-400">Evrak yükleniyor...</span>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Hata</h3>
          <p className="mt-2 text-red-600 dark:text-red-300">{loadError}</p>
          <Button className="mt-4" onClick={() => navigate('/evraklar')}>
            Evraklara Dön
          </Button>
        </div>
      </div>
    )
  }

  // ============================================
  // Render
  // ============================================

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Button plain onClick={() => navigate(`/evraklar/${evrakId}`)} className="mb-4">
          <ArrowLeftIcon className="h-5 w-5" />
          Detaya Dön
        </Button>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <PencilSquareIcon className="h-6 w-6" />
          </div>
          <div>
            <Heading>Evrak Düzenle</Heading>
            <Text className="mt-1">{originalEvrak?.evrak_no}</Text>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General Error */}
        {errors.general && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {errors.general}
          </div>
        )}

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <FieldGroup>
            {/* Evrak Tipi & Durum */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <Label>Evrak Tipi *</Label>
                <Select
                  name="evrak_tipi"
                  value={formData.evrak_tipi}
                  onChange={handleChange}
                  invalid={!!errors.evrak_tipi}
                >
                  {Object.entries(EVRAK_TIPI_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                {errors.evrak_tipi && <ErrorMessage>{errors.evrak_tipi}</ErrorMessage>}
              </Field>

              <Field>
                <Label>Durum</Label>
                <Select
                  name="durum"
                  value={formData.durum}
                  onChange={handleChange}
                  disabled
                >
                  {Object.entries(DURUM_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                <Description>Durum değişikliği için "Durum Değiştir" butonunu kullanın</Description>
              </Field>
            </div>

            {/* Evrak No & Tutar */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <Label>Evrak No *</Label>
                <Input
                  name="evrak_no"
                  type="text"
                  value={formData.evrak_no}
                  onChange={handleChange}
                  placeholder="Örn: ÇK-2025-001"
                  invalid={!!errors.evrak_no}
                />
                {errors.evrak_no && <ErrorMessage>{errors.evrak_no}</ErrorMessage>}
              </Field>

              <Field>
                <Label>Tutar (₺) *</Label>
                <Input
                  name="tutar"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.tutar}
                  onChange={handleChange}
                  placeholder="0.00"
                  invalid={!!errors.tutar}
                />
                {errors.tutar && <ErrorMessage>{errors.tutar}</ErrorMessage>}
              </Field>
            </div>

            {/* Vade Tarihi & Banka */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <Label>Vade Tarihi *</Label>
                <Input
                  name="vade_tarihi"
                  type="date"
                  value={formData.vade_tarihi}
                  onChange={handleChange}
                  invalid={!!errors.vade_tarihi}
                />
                {errors.vade_tarihi && <ErrorMessage>{errors.vade_tarihi}</ErrorMessage>}
              </Field>

              <Field>
                <Label>Banka Adı</Label>
                <Input
                  name="banka_adi"
                  type="text"
                  value={formData.banka_adi || ''}
                  onChange={handleChange}
                  placeholder="Örn: Garanti Bankası"
                  invalid={!!errors.banka_adi}
                />
                {errors.banka_adi && <ErrorMessage>{errors.banka_adi}</ErrorMessage>}
                <Description>Çekler için banka bilgisi</Description>
              </Field>
            </div>

            {/* Keşideci & Cari */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <Label>Keşideci *</Label>
                <Input
                  name="kesideci"
                  type="text"
                  value={formData.kesideci}
                  onChange={handleChange}
                  placeholder="Çeki/senedi veren kişi veya firma"
                  invalid={!!errors.kesideci}
                />
                {errors.kesideci && <ErrorMessage>{errors.kesideci}</ErrorMessage>}
              </Field>

              <Field>
                <Label>Cari Hesap</Label>
                <Select
                  name="cari_id"
                  value={formData.cari_id || ''}
                  onChange={handleChange}
                  disabled={isLoadingCariler}
                >
                  <option value="">
                    {isLoadingCariler ? 'Yükleniyor...' : 'Cari seçiniz (opsiyonel)'}
                  </option>
                  {cariler.map((cari) => (
                    <option key={cari.id} value={cari.id}>
                      {cari.ad_soyad} ({cari.tip === 'musteri' ? 'Müşteri' : 'Tedarikçi'})
                    </option>
                  ))}
                </Select>
                <Description>İlişkili cari hesap</Description>
              </Field>
            </div>

            {/* Notlar */}
            <Field>
              <Label>Notlar</Label>
              <Textarea
                name="notlar"
                value={formData.notlar || ''}
                onChange={handleChange}
                rows={3}
                placeholder="Evrak hakkında ek bilgiler..."
                invalid={!!errors.notlar}
              />
              {errors.notlar && <ErrorMessage>{errors.notlar}</ErrorMessage>}
            </Field>
          </FieldGroup>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            outline
            onClick={() => navigate(`/evraklar/${evrakId}`)}
            disabled={isSubmitting}
          >
            İptal
          </Button>
          <Button
            type="submit"
            color="blue"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </Button>
        </div>
      </form>

      {/* Concurrent Edit Warning Dialog */}
      <Dialog open={showConcurrentEditDialog} onClose={() => setShowConcurrentEditDialog(false)}>
        <DialogTitle>
          <div className="flex items-center gap-2 text-amber-600">
            <ExclamationTriangleIcon className="h-6 w-6" />
            Kayıt Değiştirilmiş
          </div>
        </DialogTitle>
        <DialogDescription>
          Bu kayıt siz düzenlemeye başladıktan sonra başka bir kullanıcı tarafından değiştirilmiş.
        </DialogDescription>
        <DialogBody>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Değişikliklerinizi yine de kaydetmek isterseniz diğer kullanıcının değişiklikleri kaybolacaktır.
            Sayfayı yenileyerek güncel verileri görebilirsiniz.
          </p>
        </DialogBody>
        <DialogActions>
          <Button outline onClick={handleRefresh}>
            Sayfayı Yenile
          </Button>
          <Button color="amber" onClick={handleForceSubmit}>
            Yine de Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default EvrakDuzenlePage
