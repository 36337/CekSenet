// ============================================
// ÇekSenet - VadeUyarilari Component
// Vade uyarı banner'ları ve liste
// ============================================

import { useNavigate } from 'react-router-dom'
import {
  ExclamationTriangleIcon,
  ClockIcon,
  XCircleIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { formatCurrency } from '@/services/dashboard'
import type { VadeUyarilari as VadeUyarilariType } from '@/types'

// ============================================
// Types
// ============================================

interface VadeUyarilariProps {
  data: VadeUyarilariType | null
  isLoading?: boolean
}

type UyariTipi = 'gecikmis' | 'bugun' | 'buHafta'

interface UyariConfig {
  tip: UyariTipi
  baslik: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  bgColor: string
  borderColor: string
  iconColor: string
  textColor: string
  badgeColor: string
  filterParam: string
}

// ============================================
// Uyarı Konfigürasyonları
// ============================================

const uyariConfigs: UyariConfig[] = [
  {
    tip: 'gecikmis',
    baslik: 'Vadesi Geçmiş',
    icon: XCircleIcon,
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400',
    textColor: 'text-red-800 dark:text-red-200',
    badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    filterParam: 'vade=gecikmis',
  },
  {
    tip: 'bugun',
    baslik: 'Bugün Vadesi Dolan',
    icon: ExclamationTriangleIcon,
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    iconColor: 'text-orange-600 dark:text-orange-400',
    textColor: 'text-orange-800 dark:text-orange-200',
    badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    filterParam: 'vade=bugun',
  },
  {
    tip: 'buHafta',
    baslik: 'Bu Hafta Vadesi Dolacak',
    icon: ClockIcon,
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-600 dark:text-amber-400',
    textColor: 'text-amber-800 dark:text-amber-200',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    filterParam: 'vade=buHafta',
  },
]

// ============================================
// UyariBanner Component
// ============================================

interface UyariBannerProps {
  config: UyariConfig
  adet: number
  tutar: number
  onClick: () => void
}

function UyariBanner({ config, adet, tutar, onClick }: UyariBannerProps) {
  const Icon = config.icon

  // Adet 0 ise gösterme
  if (adet === 0) return null

  return (
    <button
      onClick={onClick}
      className={`
        flex w-full items-center justify-between rounded-lg border p-4
        transition-all hover:shadow-md
        ${config.bgColor} ${config.borderColor}
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`rounded-full p-2 ${config.bgColor}`}>
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
        </div>
        <div className="text-left">
          <p className={`font-medium ${config.textColor}`}>
            {config.baslik}
          </p>
          <p className={`text-sm ${config.textColor} opacity-80`}>
            {formatCurrency(tutar)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${config.badgeColor}`}>
          {adet} evrak
        </span>
        <ChevronRightIcon className={`h-5 w-5 ${config.iconColor}`} />
      </div>
    </button>
  )
}

// ============================================
// VadeUyarilari Component
// ============================================

export function VadeUyarilari({ data, isLoading = false }: VadeUyarilariProps) {
  const navigate = useNavigate()

  if (isLoading) {
    return <VadeUyarilariSkeleton />
  }

  // Veri yoksa
  if (!data) {
    return null
  }

  const { ozet } = data

  // Hiç uyarı yoksa
  const toplamUyari = ozet.gecikmis.adet + ozet.bugun.adet + ozet.buHafta.adet
  if (toplamUyari === 0) {
    return (
      <div className="rounded-lg border border-dashed border-green-300 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/50">
            <svg
              className="h-5 w-5 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="font-medium text-green-800 dark:text-green-200">
            Tüm vadeler kontrol altında!
          </p>
        </div>
      </div>
    )
  }

  // Evrak listesine yönlendir
  const handleClick = (filterParam: string) => {
    navigate(`/evraklar?${filterParam}`)
  }

  return (
    <div className="space-y-3">
      {uyariConfigs.map((config) => {
        const ozetData = ozet[config.tip]
        return (
          <UyariBanner
            key={config.tip}
            config={config}
            adet={ozetData.adet}
            tutar={ozetData.tutar}
            onClick={() => handleClick(config.filterParam)}
          />
        )
      })}
    </div>
  )
}

// ============================================
// Compact Version (Sadece özetler)
// ============================================

interface VadeUyarilariCompactProps {
  data: VadeUyarilariType | null
  isLoading?: boolean
}

export function VadeUyarilariCompact({ data, isLoading = false }: VadeUyarilariCompactProps) {
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
        ))}
      </div>
    )
  }

  if (!data) return null

  const { ozet } = data
  const toplamUyari = ozet.gecikmis.adet + ozet.bugun.adet + ozet.buHafta.adet

  if (toplamUyari === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Yaklaşan vade bulunmuyor.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {ozet.gecikmis.adet > 0 && (
        <button
          onClick={() => navigate('/evraklar?vade=gecikmis')}
          className="flex w-full items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-left transition-colors hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50"
        >
          <span className="text-sm font-medium text-red-700 dark:text-red-300">
            {ozet.gecikmis.adet} vadesi geçmiş
          </span>
          <span className="text-sm text-red-600 dark:text-red-400">
            {formatCurrency(ozet.gecikmis.tutar)}
          </span>
        </button>
      )}
      {ozet.bugun.adet > 0 && (
        <button
          onClick={() => navigate('/evraklar?vade=bugun')}
          className="flex w-full items-center justify-between rounded-lg bg-orange-50 px-3 py-2 text-left transition-colors hover:bg-orange-100 dark:bg-orange-950/30 dark:hover:bg-orange-950/50"
        >
          <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
            {ozet.bugun.adet} bugün vadeli
          </span>
          <span className="text-sm text-orange-600 dark:text-orange-400">
            {formatCurrency(ozet.bugun.tutar)}
          </span>
        </button>
      )}
      {ozet.buHafta.adet > 0 && (
        <button
          onClick={() => navigate('/evraklar?vade=buHafta')}
          className="flex w-full items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-left transition-colors hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50"
        >
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
            {ozet.buHafta.adet} bu hafta vadeli
          </span>
          <span className="text-sm text-amber-600 dark:text-amber-400">
            {formatCurrency(ozet.buHafta.tutar)}
          </span>
        </button>
      )}
    </div>
  )
}

// ============================================
// Skeleton
// ============================================

function VadeUyarilariSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-16 rounded-lg bg-zinc-200 dark:bg-zinc-700"
        />
      ))}
    </div>
  )
}

// ============================================
// Export
// ============================================

export default VadeUyarilari
