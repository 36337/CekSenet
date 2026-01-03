// ============================================
// ÇekSenet - IP Info Card Component
// Dashboard'da LAN erişim IP'sini gösterir (sadece admin)
// ============================================

import { useState, useEffect } from 'react'
import { ClipboardDocumentIcon, CheckIcon, ComputerDesktopIcon } from '@heroicons/react/20/solid'

import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { getSystemIP, type SystemIPInfo } from '@/services/system'

// ============================================
// Types
// ============================================

interface IPInfoCardProps {
  className?: string
}

// ============================================
// Component
// ============================================

export function IPInfoCard({ className = '' }: IPInfoCardProps) {
  const [ipInfo, setIpInfo] = useState<SystemIPInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // IP bilgilerini yükle
  useEffect(() => {
    async function fetchIPInfo() {
      try {
        setIsLoading(true)
        const data = await getSystemIP()
        setIpInfo(data)
        setError(null)
      } catch (err) {
        // 403 Forbidden = admin değil, sessizce geç
        const status = (err as { response?: { status: number } })?.response?.status
        if (status === 403) {
          setError('not-admin')
        } else {
          setError('IP bilgisi alınamadı')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchIPInfo()
  }, [])

  // Kopyalama fonksiyonu
  const handleCopy = async () => {
    if (!ipInfo?.accessUrls?.lan) return

    try {
      await navigator.clipboard.writeText(ipInfo.accessUrls.lan)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Kopyalama hatası:', err)
    }
  }

  // Admin değilse veya hata varsa gösterme
  if (error === 'not-admin' || (!isLoading && !ipInfo)) {
    return null
  }

  // Genel hata
  if (error && error !== 'not-admin') {
    return null
  }

  // Loading
  if (isLoading) {
    return (
      <div className={`rounded-xl border border-zinc-200 bg-white p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
            <ComputerDesktopIcon className="h-5 w-5 text-zinc-400" />
          </div>
          <div className="flex-1">
            <div className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
            <div className="mt-1 h-3 w-32 animate-pulse rounded bg-zinc-100" />
          </div>
        </div>
      </div>
    )
  }

  // LAN IP yoksa gösterme
  if (!ipInfo?.primaryIP) {
    return null
  }

  return (
    <div className={`rounded-xl border border-zinc-200 bg-white p-4 ${className}`}>
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
          <ComputerDesktopIcon className="h-5 w-5 text-blue-600" />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <Text className="text-xs font-medium text-zinc-500">
            LAN Erişim Adresi
          </Text>
          <div className="flex items-center gap-2">
            <code className="text-sm font-semibold text-zinc-900">
              {ipInfo.accessUrls.lan || `http://${ipInfo.primaryIP}:${ipInfo.port}`}
            </code>
          </div>
        </div>

        {/* Copy Button */}
        <Button
          outline
          onClick={handleCopy}
          className="shrink-0"
          title={copied ? 'Kopyalandı!' : 'Kopyala'}
        >
          {copied ? (
            <CheckIcon className="h-4 w-4 text-green-600" />
          ) : (
            <ClipboardDocumentIcon className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Hostname */}
      <Text className="mt-2 text-xs text-zinc-400">
        Bilgisayar: {ipInfo.hostname}
      </Text>
    </div>
  )
}

export default IPInfoCard
