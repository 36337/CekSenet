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
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    badge: 'bg-red-100 text-red-700',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    badge: 'bg-green-100 text-green-700',
  },
  violet: {
    bg: 'bg-violet-50',
    icon: 'text-violet-600',
    badge: 'bg-violet-100 text-violet-700',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'text-orange-600',
    badge: 'bg-orange-100 text-orange-700',
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
       
        ${onClick ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-500">
            {kart.baslik}
          </p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">
            {kart.adet}
          </p>
          <p className="mt-1 text-sm text-zinc-600">
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
    <div className="animate-pulse rounded-xl border border-zinc-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 w-24 rounded bg-zinc-200" />
          <div className="mt-3 h-8 w-16 rounded bg-zinc-200" />
          <div className="mt-2 h-4 w-32 rounded bg-zinc-200" />
        </div>
        <div className="h-12 w-12 rounded-lg bg-zinc-200" />
      </div>
    </div>
  )
}

// ============================================
// Export
// ============================================

export default StatCard
