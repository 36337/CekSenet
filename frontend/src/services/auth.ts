// ============================================
// ÇekSenet - Auth Service
// Authentication API calls
// ============================================

import api, { setToken, removeToken } from './api'
import type { LoginCredentials, LoginResponse, User, SetupStatus, ApiResponse } from '@/types'

// ============================================
// Auth Endpoints
// ============================================

/**
 * Login - Kullanıcı girişi
 */
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await api.post<{
    message: string
    token: string
    user: {
      id: number
      username: string
      ad_soyad: string
      role: string
    }
  }>('/auth/login', credentials)
  
  // Token'ı kaydet
  if (response.data.token) {
    setToken(response.data.token)
  }
  
  // Backend formatını frontend formatına dönüştür
  return {
    success: true,
    message: response.data.message,
    token: response.data.token,
    user: {
      id: response.data.user.id,
      username: response.data.user.username,
      ad_soyad: response.data.user.ad_soyad,
      rol: response.data.user.role as 'admin' | 'normal',
      aktif: true,
      created_at: '',
      updated_at: '',
    },
  }
}

/**
 * Logout - Kullanıcı çıkışı
 */
export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout')
  } finally {
    removeToken()
  }
}

/**
 * Get Current User - Mevcut kullanıcı bilgisi
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<{
    id: number
    username: string
    ad_soyad: string
    role: string
    last_login?: string
  }>('/auth/me')
  
  // Backend formatını frontend formatına dönüştür
  return {
    id: response.data.id,
    username: response.data.username,
    ad_soyad: response.data.ad_soyad,
    rol: response.data.role as 'admin' | 'normal',
    aktif: true,
    created_at: '',
    updated_at: '',
    last_login: response.data.last_login,
  }
}

/**
 * Change Password - Şifre değiştir
 */
export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  await api.put('/auth/password', {
    currentPassword,
    newPassword,
    confirmPassword: newPassword,
  })
}

// ============================================
// Setup Endpoints
// ============================================

/**
 * Get Setup Status - Kurulum durumunu kontrol et
 */
export const getSetupStatus = async (): Promise<SetupStatus> => {
  const response = await api.get<{
    setup_completed: boolean
    has_admin: boolean
    user_count: number
    app_version: string
    db_created_at: string
  }>('/settings/setup-status')
  
  // Backend direkt data dönüyor (success wrapper yok)
  return {
    isSetupComplete: response.data.setup_completed,
    adminExists: response.data.has_admin,
  }
}

/**
 * Initial Setup - İlk kurulum (admin hesabı oluştur)
 */
export interface SetupData {
  admin_username: string
  admin_password: string
  admin_ad_soyad: string
  sirket_adi?: string
}

export const initialSetup = async (data: SetupData): Promise<LoginResponse> => {
  // Backend'in beklediği format'a dönüştür
  const response = await api.post<{
    success: boolean
    message: string
    user?: {
      id: number
      username: string
      ad_soyad: string
      rol: string
    }
    token?: string
  }>('/settings/setup', {
    username: data.admin_username,
    password: data.admin_password,
    ad_soyad: data.admin_ad_soyad,
    company_name: data.sirket_adi,
  })
  
  // Backend token dönmüyor, sadece user oluşturuyor
  // Kurulum sonrası login sayfasına yönlendireceğiz
  if (response.data.success) {
    return {
      success: true,
      message: response.data.message,
      token: '',
      user: response.data.user as any,
    }
  }
  
  throw new Error(response.data.message || 'Kurulum başarısız')
}

// ============================================
// Export all
// ============================================

export const authService = {
  login,
  logout,
  getCurrentUser,
  changePassword,
  getSetupStatus,
  initialSetup,
}

export default authService
