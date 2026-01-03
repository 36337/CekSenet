// ============================================
// ÇekSenet - Setup Page (İlk Kurulum Sihirbazı)
// Initial setup wizard for first-time installation
// ============================================

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { getSetupStatus, initialSetup, type SetupData } from '@/services/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, Label, ErrorMessage, FieldGroup, Fieldset, Description } from '@/components/ui/fieldset'
import { Heading, Subheading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Divider } from '@/components/ui/divider'

// Form data type
interface SetupFormData {
  admin_username: string
  admin_password: string
  admin_password_confirm: string
  admin_ad_soyad: string
  sirket_adi: string
}

// Steps
type SetupStep = 'welcome' | 'admin' | 'company' | 'complete'

export function SetupPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SetupFormData>({
    defaultValues: {
      admin_username: 'admin',
      admin_password: '',
      admin_password_confirm: '',
      admin_ad_soyad: '',
      sirket_adi: '',
    },
  })

  // Watch password for confirmation validation
  const password = watch('admin_password')

  // Check if setup is already complete
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const status = await getSetupStatus()
        if (status.isSetupComplete) {
          // Already set up, redirect to login
          navigate('/login', { replace: true })
        }
      } catch (err) {
        console.error('Setup status check failed:', err)
        // If we can't check, allow setup (might be first run)
      } finally {
        setIsLoading(false)
      }
    }

    checkSetup()
  }, [navigate])

  // Handle form submission
  const onSubmit = async (data: SetupFormData) => {
    setError(null)
    setIsSubmitting(true)

    try {
      const setupData: SetupData = {
        admin_username: data.admin_username,
        admin_password: data.admin_password,
        admin_ad_soyad: data.admin_ad_soyad,
        sirket_adi: data.sirket_adi || undefined,
      }

      await initialSetup(setupData)
      setCurrentStep('complete')
    } catch (err) {
      const errorMessage = (err as { message?: string })?.message || 'Kurulum başarısız'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Text>Kontrol ediliyor...</Text>
      </div>
    )
  }

  // Step: Welcome
  if (currentStep === 'welcome') {
    return (
      <SetupLayout>
        <div className="text-center">
          {/* Logo */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <svg
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
              />
            </svg>
          </div>

          <Heading level={1} className="mt-6">
            ÇekSenet'e Hoş Geldiniz
          </Heading>
          
          <Text className="mt-4 text-lg">
            Çek ve Senet Takip Sistemi
          </Text>

          <Text className="mt-6">
            İlk kullanım için kurulum sihirbazını tamamlamanız gerekmektedir.
            Bu işlem sadece birkaç dakika sürecektir.
          </Text>

          <div className="mt-8">
            <Button color="blue" onClick={() => setCurrentStep('admin')}>
              Kuruluma Başla
            </Button>
          </div>
        </div>
      </SetupLayout>
    )
  }

  // Step: Complete
  if (currentStep === 'complete') {
    return (
      <SetupLayout>
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <Heading level={1} className="mt-6">
            Kurulum Tamamlandı!
          </Heading>

          <Text className="mt-4">
            ÇekSenet başarıyla kuruldu. Artık sisteme giriş yapabilirsiniz.
          </Text>

          <div className="mt-8">
            <Button color="blue" onClick={() => navigate('/login', { replace: true })}>
              Giriş Yap
            </Button>
          </div>
        </div>
      </SetupLayout>
    )
  }

  // Step: Admin & Company (Combined form)
  return (
    <SetupLayout>
      <div>
        <Heading level={2}>Kurulum</Heading>
        <Text className="mt-2">
          Yönetici hesabı oluşturun ve isteğe bağlı olarak şirket bilgilerini girin.
        </Text>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-8">
        {/* Global Error */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Admin Account Section */}
        <Fieldset>
          <Subheading>Yönetici Hesabı</Subheading>
          <Text className="mt-1">
            Sisteme ilk giriş yapacak yönetici hesabını oluşturun.
          </Text>

          <FieldGroup className="mt-6">
            {/* Ad Soyad */}
            <Field>
              <Label>Ad Soyad</Label>
              <Input
                type="text"
                placeholder="Örn: Ahmet Yılmaz"
                {...register('admin_ad_soyad', {
                  required: 'Ad soyad gerekli',
                  minLength: {
                    value: 3,
                    message: 'En az 3 karakter olmalı',
                  },
                })}
                data-invalid={errors.admin_ad_soyad ? true : undefined}
              />
              {errors.admin_ad_soyad && (
                <ErrorMessage>{errors.admin_ad_soyad.message}</ErrorMessage>
              )}
            </Field>

            {/* Username */}
            <Field>
              <Label>Kullanıcı Adı</Label>
              <Input
                type="text"
                placeholder="admin"
                {...register('admin_username', {
                  required: 'Kullanıcı adı gerekli',
                  minLength: {
                    value: 3,
                    message: 'En az 3 karakter olmalı',
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message: 'Sadece harf, rakam ve alt çizgi kullanılabilir',
                  },
                })}
                data-invalid={errors.admin_username ? true : undefined}
              />
              {errors.admin_username && (
                <ErrorMessage>{errors.admin_username.message}</ErrorMessage>
              )}
            </Field>

            {/* Password */}
            <Field>
              <Label>Şifre</Label>
              <Input
                type="password"
                placeholder="En az 6 karakter"
                {...register('admin_password', {
                  required: 'Şifre gerekli',
                  minLength: {
                    value: 6,
                    message: 'En az 6 karakter olmalı',
                  },
                })}
                data-invalid={errors.admin_password ? true : undefined}
              />
              {errors.admin_password && (
                <ErrorMessage>{errors.admin_password.message}</ErrorMessage>
              )}
            </Field>

            {/* Password Confirm */}
            <Field>
              <Label>Şifre Tekrar</Label>
              <Input
                type="password"
                placeholder="Şifreyi tekrar girin"
                {...register('admin_password_confirm', {
                  required: 'Şifre tekrarı gerekli',
                  validate: (value) =>
                    value === password || 'Şifreler eşleşmiyor',
                })}
                data-invalid={errors.admin_password_confirm ? true : undefined}
              />
              {errors.admin_password_confirm && (
                <ErrorMessage>{errors.admin_password_confirm.message}</ErrorMessage>
              )}
            </Field>
          </FieldGroup>
        </Fieldset>

        <Divider />

        {/* Company Info Section (Optional) */}
        <Fieldset>
          <Subheading>Şirket Bilgileri</Subheading>
          <Text className="mt-1">
            İsteğe bağlı. Daha sonra ayarlardan değiştirebilirsiniz.
          </Text>

          <FieldGroup className="mt-6">
            <Field>
              <Label>Şirket Adı</Label>
              <Input
                type="text"
                placeholder="Örn: ABC Ticaret Ltd. Şti."
                {...register('sirket_adi')}
              />
              <Description>
                Raporlarda ve çıktılarda görünecek şirket adı
              </Description>
            </Field>
          </FieldGroup>
        </Fieldset>

        {/* Actions */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            outline
            onClick={() => setCurrentStep('welcome')}
            disabled={isSubmitting}
          >
            Geri
          </Button>
          <Button type="submit" color="blue" disabled={isSubmitting}>
            {isSubmitting ? 'Kuruluyor...' : 'Kurulumu Tamamla'}
          </Button>
        </div>
      </form>
    </SetupLayout>
  )
}

// Layout wrapper for setup pages
function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-zinc-50 px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="rounded-xl bg-white px-6 py-10 shadow-sm ring-1 ring-zinc-950/5 sm:px-10">
          {children}
        </div>

        {/* Footer */}
        <Text className="mt-6 text-center text-sm">
          © {new Date().getFullYear()} ÇekSenet v1.0.0
        </Text>
      </div>
    </div>
  )
}

export default SetupPage
