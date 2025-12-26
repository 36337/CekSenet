// ============================================
// ÇekSenet - Auth Context
// Global authentication state management
// ============================================

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { authService, getToken, removeToken, isTokenExpired } from '@/services'
import type { User, LoginCredentials, AuthState } from '@/types'

// ============================================
// Context Types
// ============================================

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  isAdmin: boolean
}

// ============================================
// Context Creation
// ============================================

const AuthContext = createContext<AuthContextType | null>(null)

// ============================================
// Provider Component
// ============================================

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Derived state
  const isAuthenticated = !!user && !!token
  const isAdmin = user?.rol === 'admin'

  // ============================================
  // Initialize Auth State
  // ============================================

  const initializeAuth = useCallback(async () => {
    const storedToken = getToken()

    if (!storedToken) {
      setIsLoading(false)
      return
    }

    // Check if token is expired
    if (isTokenExpired(storedToken)) {
      removeToken()
      setIsLoading(false)
      return
    }

    // Try to get current user
    try {
      setTokenState(storedToken)
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Auth initialization failed:', error)
      removeToken()
      setTokenState(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Run on mount
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // ============================================
  // Login
  // ============================================

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true)

    try {
      const response = await authService.login(credentials)

      if (response.success && response.token && response.user) {
        setTokenState(response.token)
        setUser(response.user)
      } else {
        throw new Error(response.message || 'Giriş başarısız')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ============================================
  // Logout
  // ============================================

  const logout = useCallback(async () => {
    setIsLoading(true)

    try {
      await authService.logout()
    } catch (error) {
      // Ignore logout errors, still clear local state
      console.error('Logout error:', error)
    } finally {
      setTokenState(null)
      setUser(null)
      setIsLoading(false)
    }
  }, [])

  // ============================================
  // Refresh User
  // ============================================

  const refreshUser = useCallback(async () => {
    if (!token) return

    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }, [token])

  // ============================================
  // Context Value
  // ============================================

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    isAdmin,
    login,
    logout,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ============================================
// Hook
// ============================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

// ============================================
// Export
// ============================================

export default AuthContext
