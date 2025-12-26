// ============================================
// ÇekSenet - DurumPieChart Component
// Evrak durumlarının dağılımı (Pie/Donut Chart)
// ============================================

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { formatCurrency } from '@/services/dashboard'
import type { DurumDagilimi } from '@/types'

// ============================================
// Types
// ============================================

interface DurumPieChartProps {
  data: DurumDagilimi[]
  isLoading?: boolean
  showLegend?: boolean
  height?: number
}

// ============================================
// Custom Tooltip
// ============================================

interface TooltipPayload {
  name: string
  value: number
  payload: DurumDagilimi
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
      <p className="font-medium text-zinc-900 dark:text-white">{data.label}</p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
        Adet: <span className="font-semibold">{data.adet}</span>
      </p>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Tutar: <span className="font-semibold">{formatCurrency(data.tutar)}</span>
      </p>
    </div>
  )
}

// ============================================
// Custom Legend
// ============================================

interface LegendPayload {
  value: string
  color: string
  payload: { payload: DurumDagilimi }
}

function CustomLegend({ payload }: { payload?: LegendPayload[] }) {
  if (!payload) return null

  return (
    <div className="mt-4 flex flex-wrap justify-center gap-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-300">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ============================================
// DurumPieChart Component
// ============================================

export function DurumPieChart({
  data,
  isLoading = false,
  showLegend = true,
  height = 300,
}: DurumPieChartProps) {
  if (isLoading) {
    return <DurumPieChartSkeleton height={height} />
  }

  // Veri yoksa veya tüm değerler 0 ise
  const hasData = data.length > 0 && data.some((d) => d.adet > 0)

  if (!hasData) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50"
        style={{ height }}
      >
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Henüz evrak bulunmuyor
        </p>
      </div>
    )
  }

  // Recharts için data formatı (sadece adet > 0 olanlar)
  const chartData = data
    .filter((d) => d.adet > 0)
    .map((d) => ({
      ...d,
      name: d.label,
      value: d.adet,
    }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.renk} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend content={<CustomLegend />} />}
      </PieChart>
    </ResponsiveContainer>
  )
}

// ============================================
// Skeleton
// ============================================

function DurumPieChartSkeleton({ height }: { height: number }) {
  return (
    <div
      className="flex animate-pulse items-center justify-center"
      style={{ height }}
    >
      <div className="h-48 w-48 rounded-full bg-zinc-200 dark:bg-zinc-700" />
    </div>
  )
}

// ============================================
// Export
// ============================================

export default DurumPieChart
