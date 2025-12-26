// ============================================
// ÇekSenet - Placeholder Pages
// Temporary placeholder pages for routing
// Will be replaced with real implementations
// ============================================

import { Heading, Subheading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useParams, useNavigate } from 'react-router-dom'
import {
  DocumentTextIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  CloudArrowUpIcon,
  UserCircleIcon,
  PlusIcon,
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
// Dashboard
// ============================================

export function DashboardPage() {
  return (
    <div>
      <Heading>Dashboard</Heading>
      <Text className="mt-2">Çek ve senet takip sistemi özet görünümü</Text>

      {/* Placeholder Stats */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Portföydeki" value="0" subValue="₺0" color="blue" />
        <StatCard title="Vadesi Yaklaşan" value="0" subValue="Bu hafta" color="amber" />
        <StatCard title="Tahsil Edilen" value="0" subValue="Bu ay" color="green" />
        <StatCard title="Vadesi Geçmiş" value="0" subValue="₺0" color="red" />
      </div>

      {/* Placeholder Content */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <Subheading>Son Hareketler</Subheading>
          <Text className="mt-4 text-zinc-500">Henüz hareket bulunmuyor.</Text>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <Subheading>Vade Uyarıları</Subheading>
          <Text className="mt-4 text-zinc-500">Yaklaşan vade bulunmuyor.</Text>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  subValue,
  color,
}: {
  title: string
  value: string
  subValue: string
  color: 'blue' | 'amber' | 'green' | 'red'
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
      <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</Text>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-zinc-900 dark:text-white">{value}</span>
        <Badge color={color}>{subValue}</Badge>
      </div>
    </div>
  )
}

// ============================================
// Evraklar
// ============================================

export function EvraklarPage() {
  const navigate = useNavigate()

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Heading>Evraklar</Heading>
          <Text className="mt-2">Çek ve senet listesi</Text>
        </div>
        <Button color="blue" onClick={() => navigate('/evraklar/yeni')}>
          <PlusIcon className="h-5 w-5" />
          Yeni Evrak
        </Button>
      </div>

      {/* Placeholder Table */}
      <div className="mt-8 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
        <div className="p-8 text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-zinc-400" />
          <Text className="mt-4">Henüz evrak bulunmuyor.</Text>
          <Button color="blue" className="mt-4" onClick={() => navigate('/evraklar/yeni')}>
            İlk Evrakı Ekle
          </Button>
        </div>
      </div>
    </div>
  )
}

export function EvrakEklePage() {
  return (
    <PlaceholderPage
      title="Yeni Evrak"
      description="Yeni çek veya senet ekle"
      icon={<DocumentTextIcon className="h-6 w-6" />}
    />
  )
}

export function EvrakDetayPage() {
  const { id } = useParams()

  return (
    <PlaceholderPage
      title={`Evrak #${id}`}
      description="Evrak detay sayfası"
      icon={<DocumentTextIcon className="h-6 w-6" />}
    />
  )
}

// ============================================
// Cariler
// ============================================

export function CarilerPage() {
  const navigate = useNavigate()

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Heading>Cariler</Heading>
          <Text className="mt-2">Müşteri ve tedarikçi listesi</Text>
        </div>
        <Button color="blue" onClick={() => navigate('/cariler/yeni')}>
          <PlusIcon className="h-5 w-5" />
          Yeni Cari
        </Button>
      </div>

      {/* Placeholder Table */}
      <div className="mt-8 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
        <div className="p-8 text-center">
          <UsersIcon className="mx-auto h-12 w-12 text-zinc-400" />
          <Text className="mt-4">Henüz cari hesap bulunmuyor.</Text>
          <Button color="blue" className="mt-4" onClick={() => navigate('/cariler/yeni')}>
            İlk Cariyi Ekle
          </Button>
        </div>
      </div>
    </div>
  )
}

export function CariEklePage() {
  return (
    <PlaceholderPage
      title="Yeni Cari"
      description="Yeni müşteri veya tedarikçi ekle"
      icon={<UsersIcon className="h-6 w-6" />}
    />
  )
}

export function CariDetayPage() {
  const { id } = useParams()

  return (
    <PlaceholderPage
      title={`Cari #${id}`}
      description="Cari hesap detay sayfası"
      icon={<UsersIcon className="h-6 w-6" />}
    />
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

export function ProfilPage() {
  return (
    <PlaceholderPage
      title="Profil"
      description="Kullanıcı profili ve şifre değiştirme"
      icon={<UserCircleIcon className="h-6 w-6" />}
    />
  )
}

export function KullanicilarPage() {
  return (
    <PlaceholderPage
      title="Kullanıcılar"
      description="Kullanıcı yönetimi (Sadece Admin)"
      icon={<UserGroupIcon className="h-6 w-6" />}
    >
      <Badge color="amber" className="mt-4">Admin Yetkisi Gerekli</Badge>
    </PlaceholderPage>
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
