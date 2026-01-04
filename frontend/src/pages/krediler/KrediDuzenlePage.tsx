// ============================================
// ÇekSenet - Kredi Düzenleme Sayfası
// Not: Kredilerde sadece banka ve notlar düzenlenebilir
// Anapara, faiz, vade değiştirilemez (taksitler zaten oluşturulmuş)
// ============================================

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Field, FieldGroup, Label, Description, ErrorMessage } from '@/components/ui/fieldset'
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  InformationCircleIcon,
} from '@heroicons/react/20/solid'
import { BankaEkleModal } from '@/components/modals'
import {
  getKredi,
  updateKredi,
  getBankalarForSelect,
  KREDI_TURU_LABELS,
  KREDI_DURUM_LABELS,
  KREDI_DURUM_COLORS,
  formatKrediTutar,
  formatKrediTarih,
  type KrediDetay,
  type KrediUpdateData,
  type Banka,
} from '@/services'

// ============================================
// Types
// ============================================

interface FormErrors {
  banka_id?: string
  notlar?: string
  general?: string
}

// ============================================
// Component
// ============================================

export function KrediDuzenlePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const krediId = parseInt(id || '0')

  // Kredi data
  const [kredi, setKredi] = useState<KrediDetay | null>(null)

  // Form state (sadece düzenlenebilir alanlar)
  const [formData, setFormData] = useState<KrediUpdateData>({
    banka_id: null,
    notlar: '',
  })

  // UI state
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Banka state
  const [bankalar, setBankalar] = useState<Banka[]>([])
  const [isLoadingBankalar, setIsLoadingBankalar] = useState(true)
  const [isBankaModalOpen, setIsBankaModalOpen] = useState(false)

  // ============================================
  // Load Kredi Data
  // ============================================

  useEffect(() => {
    async function loadKredi() {
      if (!krediId) {
        setLoadError('Geçersiz kredi ID')
        setIsLoading(false)
        return
      }

      try {
        const data = await getKredi(krediId)
        setKredi(data)

        // Populate form with editable fields
        setFormData({
          banka_id: data.banka_id || null,
          notlar: data.notlar || '',
        })
      } catch (err: any) {
        setLoadError(err?.message || 'Kredi yüklenemedi')
      } finally {
        setIsLoading(false)
      }
    }
    loadKredi()
  }, [krediId])

  // ============================================
  // Load Bankalar
  // ============================================

  useEffect(() => {
    async function loadBankalar() {
      try {
        const data = await getBankalarForSelect()
        setBankalar(data)
      } catch (err) {
        console.error('Bankalar yüklenemedi:', err)
      } finally {
        setIsLoadingBankalar(false)
      }
    }
    loadBankalar()
  }, [])

  // ============================================
  // Validation
  // ============================================

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Notlar
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
    e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target

    if (name === 'banka_id') {
      setFormData(prev => ({
        ...prev,
        banka_id: value ? parseInt(value) : null,
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }))
    }

    // Clear field error on change
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleBankaEklendi = (banka: Banka) => {
    setBankalar(prev => [...prev, banka].sort((a, b) => a.ad.localeCompare(b.ad, 'tr')))
    setFormData(prev => ({ ...prev, banka_id: banka.id }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      await updateKredi(krediId, formData)
      navigate(`/krediler/${krediId}`, {
        state: { message: 'Kredi başarıyla güncellendi' }
      })
    } catch (err: any) {
      const message = err?.message || 'Kredi güncellenirken bir hata oluştu'
      setErrors({ general: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============================================
  // Loading & Error States
  // ============================================

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <span className="ml-3 text-zinc-600">Kredi yükleniyor...</span>
        </div>
      </div>
    )
  }

  if (loadError || !kredi) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h3 className="text-lg font-semibold text-red-700">Hata</h3>
          <p className="mt-2 text-red-600">{loadError || 'Kredi bulunamadı'}</p>
          <Button className="mt-4" onClick={() => navigate('/krediler')}>
            Kredilere Dön
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
        <Button plain onClick={() => navigate(`/krediler/${krediId}`)} className="mb-4">
          <ArrowLeftIcon className="h-5 w-5" />
          Detaya Dön
        </Button>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
            <PencilSquareIcon className="h-6 w-6" />
          </div>
          <div>
            <Heading>Kredi Düzenle</Heading>
            <Text className="mt-1">
              {kredi.banka_adi || 'Banka belirtilmemiş'} - {KREDI_TURU_LABELS[kredi.kredi_turu]}
            </Text>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Error */}
        {errors.general && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {errors.general}
          </div>
        )}

        {/* Read-only Kredi Bilgileri */}
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <InformationCircleIcon className="h-5 w-5 text-zinc-500" />
            <Text className="font-medium text-zinc-700">Kredi Bilgileri (Salt Okunur)</Text>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <Text className="text-xs text-zinc-500">Kredi Türü</Text>
              <Text className="font-medium">{KREDI_TURU_LABELS[kredi.kredi_turu]}</Text>
            </div>
            <div>
              <Text className="text-xs text-zinc-500">Anapara</Text>
              <Text className="font-medium">{formatKrediTutar(kredi.anapara, kredi.para_birimi)}</Text>
            </div>
            <div>
              <Text className="text-xs text-zinc-500">Faiz Oranı</Text>
              <Text className="font-medium">%{kredi.faiz_orani.toFixed(2)}</Text>
            </div>
            <div>
              <Text className="text-xs text-zinc-500">Vade</Text>
              <Text className="font-medium">{kredi.vade_ay} ay</Text>
            </div>
            <div>
              <Text className="text-xs text-zinc-500">Aylık Taksit</Text>
              <Text className="font-medium">{formatKrediTutar(kredi.aylik_taksit, kredi.para_birimi)}</Text>
            </div>
            <div>
              <Text className="text-xs text-zinc-500">Başlangıç</Text>
              <Text className="font-medium">{formatKrediTarih(kredi.baslangic_tarihi)}</Text>
            </div>
            <div>
              <Text className="text-xs text-zinc-500">Durum</Text>
              <Badge color={KREDI_DURUM_COLORS[kredi.durum] as any}>
                {KREDI_DURUM_LABELS[kredi.durum]}
              </Badge>
            </div>
            <div>
              <Text className="text-xs text-zinc-500">Toplam Ödeme</Text>
              <Text className="font-medium">{formatKrediTutar(kredi.toplam_odeme, kredi.para_birimi)}</Text>
            </div>
            <div>
              <Text className="text-xs text-zinc-500">Kalan Borç</Text>
              <Text className="font-medium">{formatKrediTutar(kredi.ozet.kalan_borc, kredi.para_birimi)}</Text>
            </div>
          </div>
          <Text className="mt-4 text-xs text-zinc-500">
            * Anapara, faiz ve vade bilgileri değiştirilemez. Taksitler bu değerlere göre oluşturulmuştur.
          </Text>
        </div>

        {/* Düzenlenebilir Alanlar */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <Text className="mb-4 font-medium text-zinc-900">Düzenlenebilir Bilgiler</Text>
          <FieldGroup>
            {/* Banka */}
            <Field>
              <Label>Banka</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    name="banka_id"
                    value={formData.banka_id || ''}
                    onChange={handleChange}
                    disabled={isLoadingBankalar}
                  >
                    <option value="">
                      {isLoadingBankalar ? 'Yükleniyor...' : 'Banka seçiniz (opsiyonel)'}
                    </option>
                    {bankalar.map(banka => (
                      <option key={banka.id} value={banka.id}>
                        {banka.ad}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  type="button"
                  outline
                  onClick={() => setIsBankaModalOpen(true)}
                  title="Yeni banka ekle"
                >
                  +
                </Button>
              </div>
              {errors.banka_id && <ErrorMessage>{errors.banka_id}</ErrorMessage>}
              <Description>Kredinin alındığı banka</Description>
            </Field>

            {/* Notlar */}
            <Field>
              <Label>Notlar</Label>
              <Textarea
                name="notlar"
                value={formData.notlar || ''}
                onChange={handleChange}
                rows={4}
                placeholder="Kredi hakkında ek bilgiler..."
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
            onClick={() => navigate(`/krediler/${krediId}`)}
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

      {/* Banka Ekle Modal */}
      <BankaEkleModal
        isOpen={isBankaModalOpen}
        onClose={() => setIsBankaModalOpen(false)}
        onSuccess={handleBankaEklendi}
      />
    </div>
  )
}

export default KrediDuzenlePage
