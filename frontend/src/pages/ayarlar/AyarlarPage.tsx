// ============================================
// ÇekSenet - Ayarlar Page
// Uygulama ayarları sayfası
// ============================================

import { useState, useEffect, useRef } from 'react'
import { Heading, Subheading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, Label, Description } from '@/components/ui/fieldset'
import { Divider } from '@/components/ui/divider'
import { WhatsAppIcon } from '@/components/icons'
import {
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/20/solid'

import { getWhatsAppSettings, updateWhatsAppSettings } from '@/services'
import { MESSAGE_VARIABLES, normalizePhoneNumber, isValidPhoneNumber, DEFAULT_WHATSAPP_MESSAGE } from '@/utils/whatsapp'

// ============================================
// Types
// ============================================

interface WhatsAppFormData {
  telefon: string
  mesaj: string
}

// ============================================
// Main Component
// ============================================

export function AyarlarPage() {
  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
          <Cog6ToothIcon className="h-6 w-6" />
        </div>
        <div>
          <Heading>Ayarlar</Heading>
          <Text className="mt-1">Uygulama ayarlarını buradan yönetebilirsiniz.</Text>
        </div>
      </div>

      {/* WhatsApp Section */}
      <WhatsAppSettingsSection />

      {/* Future sections can be added here */}
      {/* <Divider className="my-10" />
      <OtherSettingsSection /> */}
    </div>
  )
}

// ============================================
// WhatsApp Settings Section
// ============================================

function WhatsAppSettingsSection() {
  const [formData, setFormData] = useState<WhatsAppFormData>({
    telefon: '',
    mesaj: DEFAULT_WHATSAPP_MESSAGE,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const settings = await getWhatsAppSettings()
      setFormData({
        telefon: settings.whatsapp_telefon || '',
        mesaj: settings.whatsapp_mesaj || DEFAULT_WHATSAPP_MESSAGE,
      })
    } catch (err) {
      console.error('Ayarlar yüklenemedi:', err)
      setError('Ayarlar yüklenirken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // Validate phone if provided
    if (formData.telefon && !isValidPhoneNumber(formData.telefon)) {
      setError('Geçersiz telefon numarası. Örnek: 905551234567')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      await updateWhatsAppSettings({
        whatsapp_telefon: formData.telefon ? normalizePhoneNumber(formData.telefon) : '',
        whatsapp_mesaj: formData.mesaj,
      })

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Ayarlar kaydedilemedi:', err)
      setError('Ayarlar kaydedilirken bir hata oluştu.')
    } finally {
      setSaving(false)
    }
  }

  const handleVariableClick = (variable: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = formData.mesaj
    
    const newText = text.substring(0, start) + variable + text.substring(end)
    setFormData(prev => ({ ...prev, mesaj: newText }))

    // Set cursor position after the inserted variable
    setTimeout(() => {
      textarea.focus()
      const newPos = start + variable.length
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }

  const handleReset = () => {
    setFormData(prev => ({ ...prev, mesaj: DEFAULT_WHATSAPP_MESSAGE }))
  }

  if (loading) {
    return (
      <section>
        <div className="flex items-center gap-3 mb-6">
          <WhatsAppIcon className="h-6 w-6 text-green-600" />
          <Subheading>WhatsApp Ayarları</Subheading>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-zinc-100 rounded-lg" />
          <div className="h-32 bg-zinc-100 rounded-lg" />
        </div>
      </section>
    )
  }

  return (
    <section>
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-2">
        <WhatsAppIcon className="h-6 w-6 text-green-600" />
        <Subheading>WhatsApp Ayarları</Subheading>
      </div>
      <Text className="mb-6">
        Evrak detay sayfasından WhatsApp ile mesaj göndermek için ayarları yapılandırın.
      </Text>

      {/* Alerts */}
      {success && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <CheckCircleIcon className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <Text className="font-medium text-green-800">Başarılı</Text>
            <Text className="text-sm text-green-700">Ayarlar kaydedildi.</Text>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 shrink-0" />
          <div>
            <Text className="font-medium text-red-800">Hata</Text>
            <Text className="text-sm text-red-700">{error}</Text>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="max-w-2xl space-y-6">
        <FieldGroup>
          {/* Phone Number */}
          <Field>
            <Label>Telefon Numarası</Label>
            <Description>
              WhatsApp mesajlarının gönderileceği numara. Başında 0 olmadan, ülke kodu ile yazın.
            </Description>
            <Input
              type="tel"
              placeholder="905551234567"
              value={formData.telefon}
              onChange={(e) => setFormData(prev => ({ ...prev, telefon: e.target.value }))}
            />
            <Text className="mt-1.5 text-xs text-zinc-500">
              Örnek formatlar: 905551234567, +90 555 123 45 67, 05551234567
            </Text>
          </Field>

          {/* Message Template */}
          <Field>
            <Label>Mesaj Şablonu</Label>
            <Description>
              Evrak bilgilerini içeren mesaj şablonu. Değişkenler otomatik olarak doldurulacaktır.
            </Description>
            <Textarea
              ref={textareaRef}
              rows={8}
              value={formData.mesaj}
              onChange={(e) => setFormData(prev => ({ ...prev, mesaj: e.target.value }))}
            />
          </Field>
        </FieldGroup>

        {/* Variable Helper */}
        <div>
          <Text className="text-sm font-medium text-zinc-700 mb-2">
            Kullanılabilir Değişkenler
          </Text>
          <Text className="text-xs text-zinc-500 mb-3">
            Değişkene tıklayarak mesaj şablonuna ekleyebilirsiniz.
          </Text>
          <div className="flex flex-wrap gap-2">
            {MESSAGE_VARIABLES.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => handleVariableClick(v.key)}
                className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 transition-colors cursor-pointer"
                title={`Örnek: ${v.example}`}
              >
                <code className="text-blue-600">{v.key}</code>
                <span className="text-zinc-500">- {v.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Divider />

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            color="blue"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
          <Button
            outline
            onClick={handleReset}
            disabled={saving}
          >
            Varsayılana Sıfırla
          </Button>
        </div>

        {/* Info Note */}
        {!formData.telefon && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <div className="flex gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <Text className="font-medium text-amber-800">Telefon numarası girilmedi</Text>
                <Text className="text-sm text-amber-700 mt-1">
                  WhatsApp butonunun çalışması için bir telefon numarası girmeniz gerekiyor.
                </Text>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default AyarlarPage
