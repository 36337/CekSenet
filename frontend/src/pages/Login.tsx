// ============================================
// ÇekSenet - Login Page
// User authentication page
// ============================================

import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, Label, ErrorMessage, FieldGroup, Fieldset } from '@/components/ui/fieldset'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import type { LoginCredentials } from '@/types'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get redirect path from location state
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    defaultValues: {
      username: '',
      password: '',
    },
  })

  // ============================================
  // Auth State Değişikliğini İzle
  // Login başarılı olduğunda yönlendir
  // ============================================
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate, from])

  // ============================================
  // Form Submit Handler
  // ============================================
  const onSubmit = async (data: LoginCredentials) => {
    setError(null)
    setIsSubmitting(true)

    try {
      await login(data)
      // Navigate artık useEffect'te yapılıyor
      // State güncellenince otomatik yönlendirilecek
    } catch (err) {
      const errorMessage = (err as { message?: string })?.message || 'Giriş başarısız'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============================================
  // Auth Loading State
  // ============================================
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <Text className="mt-4">Yükleniyor...</Text>
        </div>
      </div>
    )
  }

  // ============================================
  // Zaten Giriş Yapılmışsa Yönlendir
  // ============================================
  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  // ============================================
  // Render Login Form
  // ============================================
  return (
    <div className="flex min-h-screen flex-col justify-center bg-zinc-50 px-6 py-12 dark:bg-zinc-900 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo / App Name */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-600 text-white">
            <svg
              className="h-10 w-10"
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
        </div>

        <Heading level={2} className="mt-6 text-center">
          ÇekSenet
        </Heading>
        <Text className="mt-2 text-center">
          Çek ve Senet Takip Sistemi
        </Text>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-xl bg-white px-6 py-8 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-800 dark:ring-white/10 sm:px-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Fieldset>
              <FieldGroup>
                {/* Global Error */}
                {error && (
                  <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {error}
                  </div>
                )}

                {/* Username Field */}
                <Field>
                  <Label>Kullanıcı Adı</Label>
                  <Input
                    type="text"
                    autoComplete="username"
                    {...register('username', {
                      required: 'Kullanıcı adı gerekli',
                      minLength: {
                        value: 3,
                        message: 'En az 3 karakter olmalı',
                      },
                    })}
                    data-invalid={errors.username ? true : undefined}
                  />
                  {errors.username && (
                    <ErrorMessage>{errors.username.message}</ErrorMessage>
                  )}
                </Field>

                {/* Password Field */}
                <Field>
                  <Label>Şifre</Label>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    {...register('password', {
                      required: 'Şifre gerekli',
                      minLength: {
                        value: 4,
                        message: 'En az 4 karakter olmalı',
                      },
                    })}
                    data-invalid={errors.password ? true : undefined}
                  />
                  {errors.password && (
                    <ErrorMessage>{errors.password.message}</ErrorMessage>
                  )}
                </Field>

                {/* Submit Button */}
                <Button
                  type="submit"
                  color="blue"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                </Button>
              </FieldGroup>
            </Fieldset>
          </form>
        </div>

        {/* Footer */}
        <Text className="mt-6 text-center text-sm">
          © {new Date().getFullYear()} ÇekSenet v1.0.0
        </Text>
      </div>
    </div>
  )
}

export default LoginPage
