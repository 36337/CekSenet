// ============================================
// ÇekSenet - Evrak Ekleme Sayfası
// ============================================

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldGroup, Label, Description, ErrorMessage } from '@/components/ui/fieldset'
import { ArrowLeftIcon, DocumentPlusIcon } from '@heroicons/react/20/solid'
import {
  createEvrak,
  getCarilerForSelect,
  DURUM_LABELS,
  EVRAK_TIPI_LABELS,
  type EvrakFormData,
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

export function EvrakEklePage() {
  const navigate = useNavigate()

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cariler, setCariler] = useState<CariOption[]>([])
  const [isLoadingCariler, setIsLoadingCariler] = useState(true)

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

    try {
      await createEvrak(formData)
      navigate('/evraklar', { 
        state: { message: 'Evrak başarıyla oluşturuldu' } 
      })
    } catch (err: any) {
      const message = err?.message || 'Evrak oluşturulurken bir hata oluştu'
      setErrors({ general: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============================================
  // Render
  // ============================================

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Button plain onClick={() => navigate('/evraklar')} className="mb-4">
          <ArrowLeftIcon className="h-5 w-5" />
          Evraklara Dön
        </Button>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <DocumentPlusIcon className="h-6 w-6" />
          </div>
          <div>
            <Heading>Yeni Evrak</Heading>
            <Text className="mt-1">Yeni çek veya senet ekleyin</Text>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General Error */}
        {errors.general && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {errors.general}
          </div>
        )}

        <div className="rounded-lg border border-zinc-200 bg-white p-6">
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
                >
                  {Object.entries(DURUM_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                <Description>Varsayılan: Portföy</Description>
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
            onClick={() => navigate('/evraklar')}
            disabled={isSubmitting}
          >
            İptal
          </Button>
          <Button
            type="submit"
            color="blue"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Kaydediliyor...' : 'Evrak Ekle'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default EvrakEklePage
