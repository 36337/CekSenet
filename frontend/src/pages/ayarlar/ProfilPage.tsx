// ============================================
// ÇekSenet - Profil Sayfası
// Kullanıcı bilgileri ve şifre değiştirme
// ============================================

import { useState } from 'react'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Divider } from '@/components/ui/divider'
import { Field, FieldGroup, Label, Description, ErrorMessage } from '@/components/ui/fieldset'
import {
  DescriptionList,
  DescriptionTerm,
  DescriptionDetails,
} from '@/components/ui/description-list'
import {
  UserCircleIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/20/solid'
import { useAuth } from '@/contexts'
import { changePassword } from '@/services/auth'
import { USER_ROLE_LABELS, USER_ROLE_COLORS, type UserRole } from '@/services'

// ============================================
// Types
// ============================================

interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface FormErrors {
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
  general?: string
}

// ============================================
// Component
// ============================================

export function ProfilPage() {
  const { user } = useAuth()

  // Şifre form state
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // ============================================
  // Validation
  // ============================================

  const validatePasswordForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Mevcut şifre gerekli'
    }

    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'Yeni şifre gerekli'
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = 'Yeni şifre en az 6 karakter olmalı'
    } else if (passwordForm.newPassword === passwordForm.currentPassword) {
      newErrors.newPassword = 'Yeni şifre mevcut şifreden farklı olmalı'
    }

    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Şifre tekrarı gerekli'
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ============================================
  // Handlers
  // ============================================

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({ ...prev, [name]: value }))

    // Clear field error on change
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }

    // Clear success message on change
    if (successMessage) {
      setSuccessMessage(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validatePasswordForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})
    setSuccessMessage(null)

    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      
      // Formu temizle
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      
      setSuccessMessage('Şifreniz başarıyla değiştirildi.')
    } catch (err: any) {
      const message = err?.message || 'Şifre değiştirilirken bir hata oluştu'
      setErrors({ general: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============================================
  // Render Helpers
  // ============================================

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // ============================================
  // Render
  // ============================================

  if (!user) {
    return null
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          <UserCircleIcon className="h-6 w-6" />
        </div>
        <div>
          <Heading>Profil</Heading>
          <Text className="mt-1">Hesap bilgilerinizi görüntüleyin ve şifrenizi değiştirin</Text>
        </div>
      </div>

      {/* Kullanıcı Bilgileri */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <Heading level={2} className="text-lg">
          Hesap Bilgileri
        </Heading>
        <Divider className="my-4" />

        <DescriptionList>
          <DescriptionTerm>Kullanıcı Adı</DescriptionTerm>
          <DescriptionDetails className="font-medium">{user.username}</DescriptionDetails>

          <DescriptionTerm>Ad Soyad</DescriptionTerm>
          <DescriptionDetails>{user.ad_soyad}</DescriptionDetails>

          <DescriptionTerm>Rol</DescriptionTerm>
          <DescriptionDetails>
            <Badge color={USER_ROLE_COLORS[user.rol as UserRole] as any}>
              {USER_ROLE_LABELS[user.rol as UserRole]}
            </Badge>
          </DescriptionDetails>

          <DescriptionTerm>Son Giriş</DescriptionTerm>
          <DescriptionDetails>{formatDateTime(user.last_login)}</DescriptionDetails>
        </DescriptionList>

        <div className="mt-4 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-zinc-700/50 dark:text-zinc-400">
          <Text>
            Kullanıcı adınızı veya rolünüzü değiştirmek için sistem yöneticinize başvurun.
          </Text>
        </div>
      </div>

      {/* Şifre Değiştirme */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <div className="flex items-center gap-2">
          <KeyIcon className="h-5 w-5 text-zinc-500" />
          <Heading level={2} className="text-lg">
            Şifre Değiştir
          </Heading>
        </div>
        <Divider className="my-4" />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Success Message */}
          {successMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
              <CheckCircleIcon className="h-5 w-5 shrink-0" />
              {successMessage}
            </div>
          )}

          {/* General Error */}
          {errors.general && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
              {errors.general}
            </div>
          )}

          <FieldGroup>
            <Field>
              <Label>Mevcut Şifre *</Label>
              <Input
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={handleChange}
                placeholder="Mevcut şifrenizi girin"
                invalid={!!errors.currentPassword}
              />
              {errors.currentPassword && <ErrorMessage>{errors.currentPassword}</ErrorMessage>}
            </Field>

            <Field>
              <Label>Yeni Şifre *</Label>
              <Input
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handleChange}
                placeholder="Yeni şifrenizi girin"
                invalid={!!errors.newPassword}
              />
              {errors.newPassword && <ErrorMessage>{errors.newPassword}</ErrorMessage>}
              <Description>En az 6 karakter olmalı</Description>
            </Field>

            <Field>
              <Label>Yeni Şifre (Tekrar) *</Label>
              <Input
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handleChange}
                placeholder="Yeni şifrenizi tekrar girin"
                invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && <ErrorMessage>{errors.confirmPassword}</ErrorMessage>}
            </Field>
          </FieldGroup>

          <div className="flex justify-end">
            <Button type="submit" color="blue" disabled={isSubmitting}>
              {isSubmitting ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProfilPage
