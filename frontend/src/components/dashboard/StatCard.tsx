// ============================================
// ÇekSenet - StatCard Component
// Dashboard istatistik kartları
// ============================================

import {
  BanknotesIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { formatCurrency } from '@/services/dashboard'
import type { DashboardKart } from '@/types'

// ============================================
// Icon Mapping
// ============================================

const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  BanknotesIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  ClockIcon,
}

// ============================================
// Color Mapping (Tailwind v4)
// ============================================

const colorClasses: Record<string, { bg: string; icon: string; badge: string }> = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    icon: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    icon: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    icon: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    icon: 'text-green-600 dark:text-green-400',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    icon: 'text-violet-600 dark:text-violet-400',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    icon: 'text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  },
}

// ============================================
// StatCard Component
// ============================================

interface StatCardProps {
  kart: DashboardKart
  onClick?: () => void
}

export function StatCard({ kart, onClick }: StatCardProps) {
  const Icon = iconMap[kart.ikon] || BanknotesIcon
  const colors = colorClasses[kart.renk] || colorClasses.blue

  return (
    <div
      className={`
        rounded-xl border border-zinc-200 bg-white p-6
        dark:border-zinc-700 dark:bg-zinc-800
        ${onClick ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {kart.baslik}
          </p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-white">
            {kart.adet}
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            {formatCurrency(kart.tutar)}
          </p>
        </div>
        <div className={`rounded-lg p-3 ${colors.bg}`}>
          <Icon className={`h-6 w-6 ${colors.icon}`} />
        </div>
      </div>
    </div>
  )
}

// ============================================
// StatCardGrid Component
// ============================================

interface StatCardGridProps {
  kartlar: DashboardKart[]
  onKartClick?: (kartId: string) => void
  isLoading?: boolean
}

export function StatCardGrid({ kartlar, onKartClick, isLoading }: StatCardGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kartlar.map((kart) => (
        <StatCard
          key={kart.id}
          kart={kart}
          onClick={onKartClick ? () => onKartClick(kart.id) : undefined}
        />
      ))}
    </div>
  )
}

// ============================================
// StatCard Skeleton (Loading State)
// ============================================

export function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="mt-3 h-8 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="mt-2 h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <div className="h-12 w-12 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
      </div>
    </div>
  )
}

// ============================================
// Export
// ============================================

export default StatCard
