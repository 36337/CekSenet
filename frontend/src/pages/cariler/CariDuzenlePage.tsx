// ============================================
// ÇekSenet - Cari Düzenleme Sayfası
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
  getCari,
  updateCari,
  CARI_TIP_LABELS,
  type CariFormData,
  type CariWithStats,
} from '@/services'

// ============================================
// Types
// ============================================

interface FormErrors {
  ad_soyad?: string
  tip?: string
  telefon?: string
  email?: string
  adres?: string
  vergi_no?: string
  notlar?: string
  general?: string
}

// ============================================
// Component
// ============================================

export function CariDuzenlePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const cariId = parseInt(id || '0')

  // Original data for concurrent edit check
  const [originalCari, setOriginalCari] = useState<CariWithStats | null>(null)
  const [originalUpdatedAt, setOriginalUpdatedAt] = useState<string>('')

  // Form state
  const [formData, setFormData] = useState<CariFormData>({
    ad_soyad: '',
    tip: 'musteri',
    telefon: '',
    email: '',
    adres: '',
    vergi_no: '',
    notlar: '',
  })

  // UI state
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Concurrent edit dialog
  const [showConcurrentEditDialog, setShowConcurrentEditDialog] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(false)

  // ============================================
  // Load Cari Data
  // ============================================

  useEffect(() => {
    async function loadCari() {
      if (!cariId) {
        setLoadError('Geçersiz cari ID')
        setIsLoading(false)
        return
      }

      try {
        const cari = await getCari(cariId)
        setOriginalCari(cari)
        setOriginalUpdatedAt(cari.updated_at)

        // Populate form
        setFormData({
          ad_soyad: cari.ad_soyad,
          tip: cari.tip,
          telefon: cari.telefon || '',
          email: cari.email || '',
          adres: cari.adres || '',
          vergi_no: cari.vergi_no || '',
          notlar: cari.notlar || '',
        })
      } catch (err: any) {
        setLoadError(err?.message || 'Cari yüklenemedi')
      } finally {
        setIsLoading(false)
      }
    }
    loadCari()
  }, [cariId])

  // ============================================
  // Validation
  // ============================================

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Ad Soyad
    if (!formData.ad_soyad.trim()) {
      newErrors.ad_soyad = 'Ad soyad / firma adı gerekli'
    } else if (formData.ad_soyad.length < 2) {
      newErrors.ad_soyad = 'En az 2 karakter olmalı'
    } else if (formData.ad_soyad.length > 200) {
      newErrors.ad_soyad = 'En fazla 200 karakter olabilir'
    }

    // Tip
    if (!formData.tip) {
      newErrors.tip = 'Cari tipi seçiniz'
    }

    // Telefon (opsiyonel ama format kontrolü)
    if (formData.telefon && formData.telefon.length > 20) {
      newErrors.telefon = 'En fazla 20 karakter olabilir'
    }

    // Email (opsiyonel ama format kontrolü)
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Geçerli bir e-posta adresi giriniz'
      } else if (formData.email.length > 100) {
        newErrors.email = 'En fazla 100 karakter olabilir'
      }
    }

    // Adres (opsiyonel ama max 500 karakter)
    if (formData.adres && formData.adres.length > 500) {
      newErrors.adres = 'En fazla 500 karakter olabilir'
    }

    // Vergi No (opsiyonel ama max 20 karakter)
    if (formData.vergi_no && formData.vergi_no.length > 20) {
      newErrors.vergi_no = 'En fazla 20 karakter olabilir'
    }

    // Notlar (opsiyonel ama max 1000 karakter)
    if (formData.notlar && formData.notlar.length > 1000) {
      newErrors.notlar = 'En fazla 1000 karakter olabilir'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ============================================
  // Check Concurrent Edit
  // ============================================

  const checkConcurrentEdit = async (): Promise<boolean> => {
    try {
      const currentCari = await getCari(cariId)
      if (currentCari.updated_at !== originalUpdatedAt) {
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
      [name]: value,
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
      // Boş string'leri undefined'a çevir (backend için)
      const submitData: CariFormData = {
        ad_soyad: formData.ad_soyad.trim(),
        tip: formData.tip,
        telefon: formData.telefon?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        adres: formData.adres?.trim() || undefined,
        vergi_no: formData.vergi_no?.trim() || undefined,
        notlar: formData.notlar?.trim() || undefined,
      }

      await updateCari(cariId, submitData)
      navigate(`/cariler/${cariId}`, {
        state: { message: 'Cari başarıyla güncellendi' },
      })
    } catch (err: any) {
      const message = err?.message || 'Cari güncellenirken bir hata oluştu'
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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <span className="ml-3 text-zinc-600 dark:text-zinc-400">Cari yükleniyor...</span>
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
          <Button className="mt-4" onClick={() => navigate('/cariler')}>
            Carilere Dön
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
        <Button plain onClick={() => navigate(`/cariler/${cariId}`)} className="mb-4">
          <ArrowLeftIcon className="h-5 w-5" />
          Detaya Dön
        </Button>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <PencilSquareIcon className="h-6 w-6" />
          </div>
          <div>
            <Heading>Cari Düzenle</Heading>
            <Text className="mt-1">{originalCari?.ad_soyad}</Text>
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
            {/* Ad Soyad & Tip */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <Label>Ad Soyad / Firma Adı *</Label>
                <Input
                  name="ad_soyad"
                  type="text"
                  value={formData.ad_soyad}
                  onChange={handleChange}
                  placeholder="Örn: Ahmet Yılmaz veya ABC Ltd. Şti."
                  invalid={!!errors.ad_soyad}
                />
                {errors.ad_soyad && <ErrorMessage>{errors.ad_soyad}</ErrorMessage>}
              </Field>

              <Field>
                <Label>Cari Tipi *</Label>
                <Select
                  name="tip"
                  value={formData.tip}
                  onChange={handleChange}
                  invalid={!!errors.tip}
                >
                  {Object.entries(CARI_TIP_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                {errors.tip && <ErrorMessage>{errors.tip}</ErrorMessage>}
              </Field>
            </div>

            {/* Telefon & Email */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <Label>Telefon</Label>
                <Input
                  name="telefon"
                  type="tel"
                  value={formData.telefon || ''}
                  onChange={handleChange}
                  placeholder="Örn: 0532 123 45 67"
                  invalid={!!errors.telefon}
                />
                {errors.telefon && <ErrorMessage>{errors.telefon}</ErrorMessage>}
              </Field>

              <Field>
                <Label>E-posta</Label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  placeholder="Örn: info@firma.com"
                  invalid={!!errors.email}
                />
                {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
              </Field>
            </div>

            {/* Vergi No */}
            <Field>
              <Label>Vergi No</Label>
              <Input
                name="vergi_no"
                type="text"
                value={formData.vergi_no || ''}
                onChange={handleChange}
                placeholder="Örn: 1234567890"
                invalid={!!errors.vergi_no}
              />
              {errors.vergi_no && <ErrorMessage>{errors.vergi_no}</ErrorMessage>}
              <Description>Şirketler için vergi numarası</Description>
            </Field>

            {/* Adres */}
            <Field>
              <Label>Adres</Label>
              <Textarea
                name="adres"
                value={formData.adres || ''}
                onChange={handleChange}
                rows={2}
                placeholder="Örn: Atatürk Cad. No:123 Kadıköy/İstanbul"
                invalid={!!errors.adres}
              />
              {errors.adres && <ErrorMessage>{errors.adres}</ErrorMessage>}
            </Field>

            {/* Notlar */}
            <Field>
              <Label>Notlar</Label>
              <Textarea
                name="notlar"
                value={formData.notlar || ''}
                onChange={handleChange}
                rows={3}
                placeholder="Cari hakkında ek bilgiler..."
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
            onClick={() => navigate(`/cariler/${cariId}`)}
            disabled={isSubmitting}
          >
            İptal
          </Button>
          <Button type="submit" color="emerald" disabled={isSubmitting}>
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
            Değişikliklerinizi yine de kaydetmek isterseniz diğer kullanıcının değişiklikleri
            kaybolacaktır. Sayfayı yenileyerek güncel verileri görebilirsiniz.
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

export default CariDuzenlePage
