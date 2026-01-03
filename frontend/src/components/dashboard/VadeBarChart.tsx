// ============================================
// ÇekSenet - VadeBarChart Component
// Aylık vade dağılımı (Bar Chart)
// ============================================

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatCurrency, formatCurrencyShort } from '@/services/dashboard'
import type { AylikDagilim } from '@/types'

// ============================================
// Types
// ============================================

interface VadeBarChartProps {
  data: AylikDagilim[]
  isLoading?: boolean
  height?: number
  showTutar?: boolean // Tutar mı adet mi gösterilsin
}

// ============================================
// Custom Tooltip
// ============================================

interface TooltipPayload {
  name: string
  value: number
  payload: AylikDagilim
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-lg">
      <p className="font-medium text-zinc-900">{data.ayLabel}</p>
      <p className="mt-1 text-sm text-zinc-600">
        Evrak Sayısı: <span className="font-semibold">{data.adet}</span>
      </p>
      <p className="text-sm text-zinc-600">
        Toplam Tutar: <span className="font-semibold">{formatCurrency(data.tutar)}</span>
      </p>
    </div>
  )
}

// ============================================
// Bar Colors
// ============================================

function getBarColor(index: number): string {
  // İlk aylar daha koyu, sonrakiler açılıyor
  const colors = [
    '#3B82F6', // blue-500
    '#60A5FA', // blue-400
    '#93C5FD', // blue-300
    '#BFDBFE', // blue-200
    '#DBEAFE', // blue-100
    '#EFF6FF', // blue-50
  ]
  
  // 6 renkten döngüsel kullan
  return colors[Math.min(index, colors.length - 1)]
}

// ============================================
// VadeBarChart Component
// ============================================

export function VadeBarChart({
  data,
  isLoading = false,
  height = 300,
  showTutar = false,
}: VadeBarChartProps) {
  if (isLoading) {
    return <VadeBarChartSkeleton height={height} />
  }

  // Veri yoksa
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50"
        style={{ height }}
      >
        <p className="text-sm text-zinc-500">
          Vade verisi bulunmuyor
        </p>
      </div>
    )
  }

  // X ekseni için kısa ay ismi (Oca, Şub, Mar...)
  const chartData = data.map((d) => ({
    ...d,
    kisaAy: d.ayLabel.split(' ')[0].substring(0, 3), // "Ocak 2025" -> "Oca"
  }))

  const dataKey = showTutar ? 'tutar' : 'adet'

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
        <XAxis
          dataKey="kisaAy"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#71717a', fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#71717a', fontSize: 12 }}
          tickFormatter={(value) =>
            showTutar ? formatCurrencyShort(value) : value.toString()
          }
          width={showTutar ? 60 : 40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} maxBarSize={50}>
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(index)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ============================================
// Skeleton
// ============================================

function VadeBarChartSkeleton({ height }: { height: number }) {
  return (
    <div className="animate-pulse" style={{ height }}>
      <div className="flex h-full items-end justify-around gap-2 px-4 pb-8">
        {[40, 65, 45, 80, 55, 70].map((h, i) => (
          <div
            key={i}
            className="w-8 rounded-t bg-zinc-200"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================
// Export
// ============================================

export default VadeBarChart
