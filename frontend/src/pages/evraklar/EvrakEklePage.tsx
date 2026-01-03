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
import { ArrowLeftIcon, DocumentPlusIcon, ArrowPathIcon } from '@heroicons/react/20/solid'
import { BankaEkleModal } from '@/components/modals'
import {
  createEvrak,
  getCarilerForSelect,
  getBankalar,
  getKurSafe,
  DURUM_LABELS,
  EVRAK_TIPI_LABELS,
  type EvrakFormData,
  type Banka,
} from '@/services'
import {
  PARA_BIRIMI_OPTIONS,
  getCurrencySymbol,
  isTRY,
} from '@/utils/currency'

// ============================================
// Types
// ============================================

interface FormErrors {
  evrak_tipi?: string
  evrak_no?: string
  tutar?: string
  vade_tarihi?: string
  evrak_tarihi?: string
  banka_id?: string
  kesideci?: string
  cari_id?: string
  para_birimi?: string
  doviz_kuru?: string
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
    evrak_tarihi: '',
    banka_id: null,
    kesideci: '',
    cari_id: null,
    durum: 'portfoy',
    notlar: '',
    para_birimi: 'TRY',
    doviz_kuru: null,
  })

  // UI state
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cariler, setCariler] = useState<CariOption[]>([])
  const [isLoadingCariler, setIsLoadingCariler] = useState(true)
  
  // Banka state
  const [bankalar, setBankalar] = useState<Banka[]>([])
  const [isLoadingBankalar, setIsLoadingBankalar] = useState(true)
  const [isBankaModalOpen, setIsBankaModalOpen] = useState(false)
  
  // Kur state
  const [isLoadingKur, setIsLoadingKur] = useState(false)
  const [kurHatasi, setKurHatasi] = useState<string | null>(null)

  // ============================================
  // Load Initial Data
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

  useEffect(() => {
    async function loadBankalar() {
      try {
        const data = await getBankalar()
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
  // Kur İşlemleri
  // ============================================

  const fetchKur = async (paraBirimi: string) => {
    if (isTRY(paraBirimi)) {
      setFormData(prev => ({ ...prev, doviz_kuru: null }))
      setKurHatasi(null)
      return
    }

    setIsLoadingKur(true)
    setKurHatasi(null)

    try {
      const kur = await getKurSafe(paraBirimi)
      if (kur !== null) {
        setFormData(prev => ({ ...prev, doviz_kuru: kur }))
      } else {
        setKurHatasi('Kur alınamadı, manuel giriniz')
      }
    } catch (err) {
      setKurHatasi('Kur alınamadı, manuel giriniz')
    } finally {
      setIsLoadingKur(false)
    }
  }

  // Para birimi değiştiğinde kuru otomatik getir
  useEffect(() => {
    if (formData.para_birimi && !isTRY(formData.para_birimi)) {
      fetchKur(formData.para_birimi)
    }
  }, [formData.para_birimi])

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

    // Döviz kuru (TRY dışında zorunlu)
    if (!isTRY(formData.para_birimi)) {
      if (!formData.doviz_kuru || formData.doviz_kuru <= 0) {
        newErrors.doviz_kuru = 'Döviz kuru gerekli'
      }
    }

    // Keşideci - opsiyonel, sadece max karakter kontrolü
    if (formData.kesideci && formData.kesideci.length > 200) {
      newErrors.kesideci = 'Keşideci en fazla 200 karakter olabilir'
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
    
    if (name === 'cari_id' || name === 'banka_id') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? parseInt(value) : null,
      }))
    } else if (name === 'doviz_kuru') {
      setFormData(prev => ({
        ...prev,
        doviz_kuru: value ? parseFloat(value) : null,
      }))
    } else if (name === 'para_birimi') {
      // Para birimi değişince kuru sıfırla
      setFormData(prev => ({
        ...prev,
        para_birimi: value,
        doviz_kuru: value === 'TRY' ? null : prev.doviz_kuru,
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
    // Yeni bankayı listeye ekle ve seç
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

  const paraBirimiSembol = getCurrencySymbol(formData.para_birimi)
  const isDoviz = !isTRY(formData.para_birimi)

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
            {/* Evrak Tipi & Evrak No */}
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
            </div>

            {/* Para Birimi & Tutar */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <Label>Para Birimi</Label>
                <Select
                  name="para_birimi"
                  value={formData.para_birimi || 'TRY'}
                  onChange={handleChange}
                >
                  {PARA_BIRIMI_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
                <Description>Varsayılan: Türk Lirası</Description>
              </Field>

              <Field>
                <Label>Tutar ({paraBirimiSembol}) *</Label>
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

            {/* Döviz Kuru (sadece döviz seçiliyse) */}
            {isDoviz && (
              <Field>
                <Label>Döviz Kuru (₺) *</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      name="doviz_kuru"
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      value={formData.doviz_kuru || ''}
                      onChange={handleChange}
                      placeholder="0.0000"
                      invalid={!!errors.doviz_kuru}
                    />
                  </div>
                  <Button
                    type="button"
                    outline
                    onClick={() => fetchKur(formData.para_birimi || 'USD')}
                    disabled={isLoadingKur}
                    title="TCMB'den güncel kuru al"
                  >
                    <ArrowPathIcon className={`h-5 w-5 ${isLoadingKur ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                {errors.doviz_kuru && <ErrorMessage>{errors.doviz_kuru}</ErrorMessage>}
                {kurHatasi && !errors.doviz_kuru && (
                  <Description className="text-amber-600">{kurHatasi}</Description>
                )}
                {!kurHatasi && !errors.doviz_kuru && (
                  <Description>1 {formData.para_birimi} = ₺{formData.doviz_kuru?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) || '?'}</Description>
                )}
              </Field>
            )}

            {/* Evrak Tarihi & Vade Tarihi */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <Label>Evrak Tarihi</Label>
                <Input
                  name="evrak_tarihi"
                  type="date"
                  value={formData.evrak_tarihi || ''}
                  onChange={handleChange}
                  invalid={!!errors.evrak_tarihi}
                />
                {errors.evrak_tarihi && <ErrorMessage>{errors.evrak_tarihi}</ErrorMessage>}
                <Description>Evrakın düzenlenme/keşide tarihi</Description>
              </Field>

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
            </div>

            {/* Banka & Keşideci */}
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
                        {isLoadingBankalar ? 'Yükleniyor...' : 'Banka seçiniz'}
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
                <Description>Çekler için banka bilgisi</Description>
              </Field>

              <Field>
                <Label>Keşideci</Label>
                <Input
                  name="kesideci"
                  type="text"
                  value={formData.kesideci || ''}
                  onChange={handleChange}
                  placeholder="Çeki/senedi veren kişi veya firma"
                  invalid={!!errors.kesideci}
                />
                {errors.kesideci && <ErrorMessage>{errors.kesideci}</ErrorMessage>}
              </Field>
            </div>

            {/* Cari & Durum */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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

      {/* Banka Ekle Modal */}
      <BankaEkleModal
        isOpen={isBankaModalOpen}
        onClose={() => setIsBankaModalOpen(false)}
        onSuccess={handleBankaEklendi}
      />
    </div>
  )
}

export default EvrakEklePage
