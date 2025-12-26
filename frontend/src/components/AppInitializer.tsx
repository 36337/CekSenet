// ============================================
// ÇekSenet - App Initializer
// Checks setup status and redirects if needed
// ============================================

import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getSetupStatus } from '@/services/auth'
import { Text } from '@/components/ui/text'

interface AppInitializerProps {
  children: React.ReactNode
}

export function AppInitializer({ children }: AppInitializerProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkSetup = async () => {
      // Skip check for setup and login pages
      if (location.pathname === '/setup' || location.pathname === '/login') {
        setIsChecking(false)
        return
      }

      try {
        const status = await getSetupStatus()
        
        if (!status.isSetupComplete) {
          // Redirect to setup if not complete
          navigate('/setup', { replace: true })
        }
      } catch (err) {
        console.error('Setup status check failed:', err)
        // On error, assume setup is needed (first run)
        // But don't redirect to avoid infinite loop on network errors
        setError('Sunucuya bağlanılamadı. Lütfen backend\'in çalıştığından emin olun.')
      } finally {
        setIsChecking(false)
      }
    }

    checkSetup()
  }, [navigate, location.pathname])

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <Text className="mt-4">Yükleniyor...</Text>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-800 dark:ring-white/10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <Text className="mt-4 font-medium text-zinc-900 dark:text-white">
            Bağlantı Hatası
          </Text>
          <Text className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {error}
          </Text>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default AppInitializer
