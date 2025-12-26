// ============================================
// ÇekSenet - SonHareketler Component
// Son evrak hareketleri tablosu
// ============================================

import { useNavigate } from 'react-router-dom'
import { ArrowRightIcon } from '@heroicons/react/16/solid'
import { DocumentTextIcon } from '@heroicons/react/24/outline'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime, getDurumLabel, getEvrakTipiLabel } from '@/services/dashboard'
import type { SonHareket } from '@/types'

// ============================================
// Types
// ============================================

interface SonHareketlerProps {
  data: SonHareket[]
  isLoading?: boolean
  limit?: number
}

// ============================================
// Durum Badge Renkleri
// ============================================

type BadgeColor = 'blue' | 'violet' | 'orange' | 'green' | 'red' | 'zinc'

function getDurumColor(durum: string): BadgeColor {
  const colors: Record<string, BadgeColor> = {
    portfoy: 'blue',
    bankada: 'violet',
    ciro: 'orange',
    tahsil: 'green',
    karsiliksiz: 'red',
  }
  return colors[durum] || 'zinc'
}

// ============================================
// Hareket Satırı
// ============================================

interface HareketSatiriProps {
  hareket: SonHareket
  onClick: () => void
}

function HareketSatiri({ hareket, onClick }: HareketSatiriProps) {
  return (
    <TableRow 
      className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      onClick={onClick}
    >
      {/* Evrak Bilgisi */}
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <DocumentTextIcon className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-white">
              {hareket.evrak_no}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {getEvrakTipiLabel(hareket.evrak_tipi)} • {hareket.cari_adi || hareket.kesideci || '-'}
            </p>
          </div>
        </div>
      </TableCell>

      {/* Durum Değişikliği */}
      <TableCell>
        <div className="flex items-center gap-2">
          {hareket.eski_durum ? (
            <>
              <Badge color={getDurumColor(hareket.eski_durum)}>
                {getDurumLabel(hareket.eski_durum)}
              </Badge>
              <ArrowRightIcon className="h-4 w-4 text-zinc-400" />
            </>
          ) : (
            <span className="text-xs text-zinc-400">Yeni</span>
          )}
          <Badge color={getDurumColor(hareket.yeni_durum)}>
            {getDurumLabel(hareket.yeni_durum)}
          </Badge>
        </div>
      </TableCell>

      {/* Tutar */}
      <TableCell className="text-right">
        <span className="font-medium text-zinc-900 dark:text-white">
          {formatCurrency(hareket.tutar)}
        </span>
      </TableCell>

      {/* Tarih ve İşlem Yapan */}
      <TableCell className="text-right">
        <p className="text-sm text-zinc-900 dark:text-white">
          {formatDateTime(hareket.created_at)}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {hareket.islem_yapan || '-'}
        </p>
      </TableCell>
    </TableRow>
  )
}

// ============================================
// SonHareketler Component
// ============================================

export function SonHareketler({ data, isLoading = false, limit = 10 }: SonHareketlerProps) {
  const navigate = useNavigate()

  if (isLoading) {
    return <SonHareketlerSkeleton count={limit} />
  }

  // Veri yoksa
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 py-12 dark:border-zinc-700 dark:bg-zinc-800/50">
        <DocumentTextIcon className="h-12 w-12 text-zinc-400" />
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          Henüz hareket bulunmuyor
        </p>
      </div>
    )
  }

  const handleRowClick = (evrakId: number) => {
    navigate(`/evraklar/${evrakId}`)
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
      <Table dense>
        <TableHead>
          <TableRow>
            <TableHeader>Evrak</TableHeader>
            <TableHeader>İşlem</TableHeader>
            <TableHeader className="text-right">Tutar</TableHeader>
            <TableHeader className="text-right">Tarih</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.slice(0, limit).map((hareket) => (
            <HareketSatiri
              key={hareket.id}
              hareket={hareket}
              onClick={() => handleRowClick(hareket.evrak_id)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ============================================
// Compact Version (Sidebar için)
// ============================================

interface SonHareketlerCompactProps {
  data: SonHareket[]
  isLoading?: boolean
  limit?: number
}

export function SonHareketlerCompact({ data, isLoading = false, limit = 5 }: SonHareketlerCompactProps) {
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Henüz hareket bulunmuyor.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {data.slice(0, limit).map((hareket) => (
        <button
          key={hareket.id}
          onClick={() => navigate(`/evraklar/${hareket.evrak_id}`)}
          className="flex w-full items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-left transition-colors hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
              {hareket.evrak_no}
            </p>
            <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
              {hareket.eski_durum && (
                <>
                  <span>{getDurumLabel(hareket.eski_durum)}</span>
                  <ArrowRightIcon className="h-3 w-3" />
                </>
              )}
              <span className="font-medium">{getDurumLabel(hareket.yeni_durum)}</span>
            </div>
          </div>
          <div className="ml-3 text-right">
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              {formatCurrency(hareket.tutar)}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}

// ============================================
// Skeleton
// ============================================

function SonHareketlerSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
      <div className="animate-pulse">
        {/* Header */}
        <div className="flex gap-4 border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="ml-auto h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
        {/* Rows */}
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-zinc-100 px-4 py-4 last:border-0 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
              <div className="space-y-1">
                <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-3 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-16 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-5 w-16 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            </div>
            <div className="ml-auto h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="space-y-1 text-right">
              <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// Export
// ============================================

export default SonHareketler
