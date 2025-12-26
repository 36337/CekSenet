// ============================================
// ÇekSenet - API Service
// Axios instance with interceptors
// ============================================

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

// Token storage key
const TOKEN_KEY = 'ceksenet_token'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ============================================
// Token Management
// ============================================

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
}

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp * 1000 // Convert to milliseconds
    return Date.now() >= exp
  } catch {
    return true
  }
}

// ============================================
// Request Interceptor
// ============================================

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    
    if (token && !isTokenExpired(token)) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ============================================
// Response Interceptor
// ============================================

api.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      removeToken()
      
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    
    // Format error message
    const message = 
      (error.response?.data as { message?: string })?.message ||
      error.message ||
      'Bir hata oluştu'
    
    return Promise.reject({
      status: error.response?.status,
      message,
      data: error.response?.data,
    })
  }
)

// ============================================
// API Error Type
// ============================================

export interface ApiError {
  status?: number
  message: string
  data?: unknown
}

// ============================================
// Export
// ============================================

export default api
