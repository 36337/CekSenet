// ============================================
// ÇekSenet - Kredi Ekleme Sayfası
// ============================================

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldGroup, Label, Description, ErrorMessage } from '@/components/ui/fieldset'
import {
  ArrowLeftIcon,
  BanknotesIcon,
  CalculatorIcon,
} from '@heroicons/react/20/solid'
import { BankaEkleModal } from '@/components/modals'
import {
  createKredi,
  getBankalarForSelect,
  KREDI_TURU_LABELS,
  PARA_BIRIMI_LABELS,
  PARA_BIRIMI_SYMBOLS,
  hesaplaTaksit,
  hesaplaToplamOdeme,
  hesaplaToplamFaiz,
  formatKrediTutar,
  type KrediFormData,
  type KrediTuru,
  type ParaBirimi,
  type Banka,
} from '@/services'

// ============================================
// Types
// ============================================

interface FormErrors {
  banka_id?: string
  kredi_turu?: string
  anapara?: string
  faiz_orani?: string
  vade_ay?: string
  baslangic_tarihi?: string
  para_birimi?: string
  notlar?: string
  general?: string
}

// ============================================
// Component
// ============================================

export function KrediEklePage() {
  const navigate = useNavigate()

  // Form state
  const [formData, setFormData] = useState<KrediFormData>({
    banka_id: null,
    kredi_turu: 'tuketici',
    anapara: '',
    faiz_orani: '',
    vade_ay: '',
    baslangic_tarihi: new Date().toISOString().split('T')[0],
    para_birimi: 'TRY',
    notlar: '',
  })

  // UI state
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Banka state
  const [bankalar, setBankalar] = useState<Banka[]>([])
  const [isLoadingBankalar, setIsLoadingBankalar] = useState(true)
  const [isBankaModalOpen, setIsBankaModalOpen] = useState(false)

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
  // Canlı Hesaplama
  // ============================================

  const hesaplama = useMemo(() => {
    const anapara = typeof formData.anapara === 'string' 
      ? parseFloat(formData.anapara) 
      : formData.anapara
    const faizOrani = typeof formData.faiz_orani === 'string' 
      ? parseFloat(formData.faiz_orani) 
      : formData.faiz_orani
    const vadeAy = typeof formData.vade_ay === 'string' 
      ? parseInt(formData.vade_ay) 
      : formData.vade_ay

    // Geçersiz değerler için boş dön
    if (!anapara || anapara <= 0 || isNaN(anapara)) return null
    if (faizOrani === undefined || faizOrani < 0 || isNaN(faizOrani)) return null
    if (!vadeAy || vadeAy <= 0 || isNaN(vadeAy)) return null

    const aylikTaksit = hesaplaTaksit(anapara, faizOrani, vadeAy)
    const toplamOdeme = hesaplaToplamOdeme(aylikTaksit, vadeAy)
    const toplamFaiz = hesaplaToplamFaiz(anapara, toplamOdeme)

    return {
      aylikTaksit,
      toplamOdeme,
      toplamFaiz,
    }
  }, [formData.anapara, formData.faiz_orani, formData.vade_ay])

  // ============================================
  // Validation
  // ============================================

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Kredi türü
    if (!formData.kredi_turu) {
      newErrors.kredi_turu = 'Kredi türü seçiniz'
    }

    // Anapara
    const anaparaNum = typeof formData.anapara === 'string' 
      ? parseFloat(formData.anapara) 
      : formData.anapara
    if (!formData.anapara || isNaN(anaparaNum)) {
      newErrors.anapara = 'Geçerli bir anapara tutarı giriniz'
    } else if (anaparaNum <= 0) {
      newErrors.anapara = 'Anapara 0\'dan büyük olmalı'
    }

    // Faiz oranı
    const faizNum = typeof formData.faiz_orani === 'string' 
      ? parseFloat(formData.faiz_orani) 
      : formData.faiz_orani
    if (formData.faiz_orani === '' || formData.faiz_orani === undefined) {
      newErrors.faiz_orani = 'Faiz oranı giriniz'
    } else if (isNaN(faizNum)) {
      newErrors.faiz_orani = 'Geçerli bir faiz oranı giriniz'
    } else if (faizNum < 0) {
      newErrors.faiz_orani = 'Faiz oranı negatif olamaz'
    } else if (faizNum > 200) {
      newErrors.faiz_orani = 'Faiz oranı %200\'den fazla olamaz'
    }

    // Vade
    const vadeNum = typeof formData.vade_ay === 'string' 
      ? parseInt(formData.vade_ay) 
      : formData.vade_ay
    if (!formData.vade_ay || isNaN(vadeNum)) {
      newErrors.vade_ay = 'Vade süresi giriniz'
    } else if (vadeNum <= 0) {
      newErrors.vade_ay = 'Vade en az 1 ay olmalı'
    } else if (vadeNum > 360) {
      newErrors.vade_ay = 'Vade en fazla 360 ay (30 yıl) olabilir'
    }

    // Başlangıç tarihi
    if (!formData.baslangic_tarihi) {
      newErrors.baslangic_tarihi = 'Başlangıç tarihi seçiniz'
    }

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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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
      const result = await createKredi(formData)
      navigate(`/krediler/${result.kredi.id}`, {
        state: { message: 'Kredi başarıyla oluşturuldu' }
      })
    } catch (err: any) {
      const message = err?.message || 'Kredi oluşturulurken bir hata oluştu'
      setErrors({ general: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============================================
  // Render Helpers
  // ============================================

  const paraBirimi = (formData.para_birimi || 'TRY') as ParaBirimi
  const paraBirimiSembol = PARA_BIRIMI_SYMBOLS[paraBirimi]

  // ============================================
  // Render
  // ============================================

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Button plain onClick={() => navigate('/krediler')} className="mb-4">
          <ArrowLeftIcon className="h-5 w-5" />
          Kredilere Dön
        </Button>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <BanknotesIcon className="h-6 w-6" />
          </div>
          <div>
            <Heading>Yeni Kredi</Heading>
            <Text className="mt-1">Yeni kredi kaydı oluşturun</Text>
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

        {/* Temel Bilgiler */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <Text className="mb-4 font-medium text-zinc-900">Kredi Bilgileri</Text>
          <FieldGroup>
            {/* Banka & Kredi Türü */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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

              <Field>
                <Label>Kredi Türü *</Label>
                <Select
                  name="kredi_turu"
                  value={formData.kredi_turu}
                  onChange={handleChange}
                  invalid={!!errors.kredi_turu}
                >
                  {Object.entries(KREDI_TURU_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                {errors.kredi_turu && <ErrorMessage>{errors.kredi_turu}</ErrorMessage>}
              </Field>
            </div>

            {/* Para Birimi & Anapara */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <Label>Para Birimi</Label>
                <Select
                  name="para_birimi"
                  value={formData.para_birimi || 'TRY'}
                  onChange={handleChange}
                >
                  {Object.entries(PARA_BIRIMI_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                <Description>Varsayılan: Türk Lirası</Description>
              </Field>

              <Field>
                <Label>Anapara ({paraBirimiSembol}) *</Label>
                <Input
                  name="anapara"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.anapara}
                  onChange={handleChange}
                  placeholder="100000.00"
                  invalid={!!errors.anapara}
                />
                {errors.anapara && <ErrorMessage>{errors.anapara}</ErrorMessage>}
              </Field>
            </div>

            {/* Faiz Oranı & Vade */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <Label>Yıllık Faiz Oranı (%) *</Label>
                <Input
                  name="faiz_orani"
                  type="number"
                  step="0.01"
                  min="0"
                  max="200"
                  value={formData.faiz_orani}
                  onChange={handleChange}
                  placeholder="24.50"
                  invalid={!!errors.faiz_orani}
                />
                {errors.faiz_orani && <ErrorMessage>{errors.faiz_orani}</ErrorMessage>}
                <Description>Yıllık faiz oranı</Description>
              </Field>

              <Field>
                <Label>Vade Süresi (Ay) *</Label>
                <Input
                  name="vade_ay"
                  type="number"
                  step="1"
                  min="1"
                  max="360"
                  value={formData.vade_ay}
                  onChange={handleChange}
                  placeholder="36"
                  invalid={!!errors.vade_ay}
                />
                {errors.vade_ay && <ErrorMessage>{errors.vade_ay}</ErrorMessage>}
              </Field>
            </div>

            {/* Başlangıç Tarihi */}
            <Field>
              <Label>Başlangıç Tarihi *</Label>
              <Input
                name="baslangic_tarihi"
                type="date"
                value={formData.baslangic_tarihi}
                onChange={handleChange}
                invalid={!!errors.baslangic_tarihi}
              />
              {errors.baslangic_tarihi && <ErrorMessage>{errors.baslangic_tarihi}</ErrorMessage>}
              <Description>Kredinin başlangıç tarihi (ilk taksit bu tarihten 1 ay sonra)</Description>
            </Field>

            {/* Notlar */}
            <Field>
              <Label>Notlar</Label>
              <Textarea
                name="notlar"
                value={formData.notlar || ''}
                onChange={handleChange}
                rows={3}
                placeholder="Kredi hakkında ek bilgiler..."
                invalid={!!errors.notlar}
              />
              {errors.notlar && <ErrorMessage>{errors.notlar}</ErrorMessage>}
            </Field>
          </FieldGroup>
        </div>

        {/* Canlı Hesaplama Önizleme */}
        {hesaplama && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <CalculatorIcon className="h-5 w-5 text-blue-600" />
              <Text className="font-medium text-blue-900">Hesaplama Önizleme</Text>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Text className="text-sm text-blue-700">Aylık Taksit</Text>
                <Text className="text-xl font-semibold text-blue-900">
                  {formatKrediTutar(hesaplama.aylikTaksit, paraBirimi)}
                </Text>
              </div>
              <div>
                <Text className="text-sm text-blue-700">Toplam Ödeme</Text>
                <Text className="text-xl font-semibold text-blue-900">
                  {formatKrediTutar(hesaplama.toplamOdeme, paraBirimi)}
                </Text>
              </div>
              <div>
                <Text className="text-sm text-blue-700">Toplam Faiz</Text>
                <Text className="text-xl font-semibold text-blue-900">
                  {formatKrediTutar(hesaplama.toplamFaiz, paraBirimi)}
                </Text>
              </div>
            </div>
            <Text className="mt-4 text-xs text-blue-600">
              * Bu değerler backend tarafından kesin olarak hesaplanacaktır
            </Text>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            outline
            onClick={() => navigate('/krediler')}
            disabled={isSubmitting}
          >
            İptal
          </Button>
          <Button
            type="submit"
            color="blue"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Kaydediliyor...' : 'Kredi Ekle'}
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

export default KrediEklePage
