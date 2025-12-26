// ============================================
// ÇekSenet - Placeholder Pages
// Temporary placeholder pages for routing
// Will be replaced with real implementations
// ============================================

import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Badge } from '@/components/ui/badge'
import {
  ChartBarIcon,
  Cog6ToothIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/20/solid'

// ============================================
// Placeholder Layout Helper
// ============================================

interface PlaceholderProps {
  title: string
  description: string
  icon: React.ReactNode
  children?: React.ReactNode
}

function PlaceholderPage({ title, description, icon, children }: PlaceholderProps) {
  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          {icon}
        </div>
        <div>
          <Heading>{title}</Heading>
          <Text className="mt-1">{description}</Text>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
        <Text className="text-zinc-500">
          Bu sayfa henüz geliştirme aşamasındadır.
        </Text>
        {children}
      </div>
    </div>
  )
}

// ============================================
// Raporlar
// ============================================

export function RaporlarPage() {
  return (
    <PlaceholderPage
      title="Raporlar"
      description="Çek ve senet raporları"
      icon={<ChartBarIcon className="h-6 w-6" />}
    />
  )
}

// ============================================
// Ayarlar
// ============================================

export function AyarlarPage() {
  return (
    <PlaceholderPage
      title="Ayarlar"
      description="Uygulama ayarları"
      icon={<Cog6ToothIcon className="h-6 w-6" />}
    />
  )
}

export function YedeklemePage() {
  return (
    <PlaceholderPage
      title="Yedekleme"
      description="Veritabanı yedekleme ve geri yükleme (Sadece Admin)"
      icon={<CloudArrowUpIcon className="h-6 w-6" />}
    >
      <Badge color="amber" className="mt-4">Admin Yetkisi Gerekli</Badge>
    </PlaceholderPage>
  )
}
