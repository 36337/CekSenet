// ============================================
// ÇekSenet - Kredi Özet Kartı (Dashboard)
// Aktif krediler, borç, bu ay taksit, geciken uyarısı
// ============================================

import { useNavigate } from 'react-router-dom'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import {
  BanknotesIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  ArrowPathIcon,
} from '@heroicons/react/20/solid'
import {
  formatKrediTutar,
  type KrediGenelOzet,
} from '@/services'

// ============================================
// Types
// ============================================

interface KrediOzetCardProps {
  data: KrediGenelOzet | null
  isLoading?: boolean
}

// ============================================
// Mini Stat Component
// ============================================

interface MiniStatProps {
  label: string
  value: string
  subValue?: string
  icon: React.ReactNode
  color?: 'default' | 'green' | 'amber' | 'red' | 'blue'
}

function MiniStat({ label, value, subValue, icon, color = 'default' }: MiniStatProps) {
  const colorClasses = {
    default: 'bg-zinc-100 text-zinc-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-600',
  }

  return (
    <div className="flex items-center gap-3">
      <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
        {icon}
      </div>
      <div>
        <Text className="text-xs text-zinc-500">{label}</Text>
        <Text className="font-semibold text-zinc-900">{value}</Text>
        {subValue && (
          <Text className="text-xs text-zinc-500">{subValue}</Text>
        )}
      </div>
    </div>
  )
}

// ============================================
// Loading Skeleton
// ============================================

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-zinc-200" />
        <div className="space-y-2">
          <div className="h-3 w-20 rounded bg-zinc-200" />
          <div className="h-4 w-24 rounded bg-zinc-200" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-zinc-200" />
        <div className="space-y-2">
          <div className="h-3 w-20 rounded bg-zinc-200" />
          <div className="h-4 w-24 rounded bg-zinc-200" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-zinc-200" />
        <div className="space-y-2">
          <div className="h-3 w-20 rounded bg-zinc-200" />
          <div className="h-4 w-24 rounded bg-zinc-200" />
        </div>
      </div>
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export function KrediOzetCard({ data, isLoading }: KrediOzetCardProps) {
  const navigate = useNavigate()

  // ============================================
  // Loading State
  // ============================================

  if (isLoading) {
    return <LoadingSkeleton />
  }

  // ============================================
  // No Data State
  // ============================================

  if (!data || data.toplam_kredi === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <BanknotesIcon className="h-10 w-10 text-zinc-300" />
        <Text className="mt-2 text-zinc-500">Henüz kredi kaydı yok</Text>
        <Button
          outline
          className="mt-3"
          onClick={() => navigate('/krediler/yeni')}
        >
          İlk Krediyi Ekle
        </Button>
      </div>
    )
  }

  // ============================================
  // Render
  // ============================================

  const hasGecikenTaksit = data.geciken_taksit_adet > 0

  return (
    <div className="space-y-4">
      {/* Geciken Taksit Uyarısı */}
      {hasGecikenTaksit && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <Text className="text-sm font-medium">
              {data.geciken_taksit_adet} gecikmiş taksit!
            </Text>
            <Text className="text-xs">
              Toplam: {formatKrediTutar(data.geciken_taksit_tutar)}
            </Text>
          </div>
          <Button
            color="red"
            className="text-xs"
            onClick={() => navigate('/krediler?durum=aktif')}
          >
            Görüntüle
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="space-y-4">
        <MiniStat
          label="Aktif Krediler"
          value={`${data.aktif_kredi} kredi`}
          subValue={`Toplam ${data.toplam_kredi} kredi`}
          icon={<BanknotesIcon className="h-5 w-5" />}
          color="blue"
        />

        <MiniStat
          label="Kalan Borç"
          value={formatKrediTutar(data.kalan_borc)}
          subValue={`Anapara: ${formatKrediTutar(data.toplam_anapara)}`}
          icon={<BanknotesIcon className="h-5 w-5" />}
          color={data.kalan_borc > 0 ? 'amber' : 'green'}
        />

        <MiniStat
          label="Bu Ay Ödenecek"
          value={formatKrediTutar(data.bu_ay_taksit_tutar)}
          subValue={`${data.bu_ay_taksit_adet} taksit`}
          icon={<CalendarDaysIcon className="h-5 w-5" />}
          color={data.bu_ay_taksit_adet > 0 ? 'amber' : 'default'}
        />
      </div>

      {/* Kredilere Git Butonu */}
      <Button
        outline
        className="w-full justify-center"
        onClick={() => navigate('/krediler')}
      >
        Kredileri Görüntüle
        <ArrowRightIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default KrediOzetCard
