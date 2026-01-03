// ============================================
// ÇekSenet - Dashboard Page
// Ana sayfa - istatistikler, grafikler, uyarılar
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowPathIcon } from '@heroicons/react/20/solid'

import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Subheading } from '@/components/ui/heading'

import {
  StatCardGrid,
  DurumPieChart,
  VadeBarChart,
  VadeUyarilariCompact,
  SonHareketler,
} from '@/components/dashboard'

import {
  getKartlar,
  getDurumDagilimi,
  getAylikDagilim,
  getSonHareketler,
  getVadeUyarilari,
} from '@/services/dashboard'

import type {
  DashboardKart,
  DurumDagilimi,
  AylikDagilim,
  SonHareket,
  VadeUyarilari,
} from '@/types'

// ============================================
// Types
// ============================================

interface DashboardData {
  kartlar: DashboardKart[]
  durumDagilimi: DurumDagilimi[]
  aylikDagilim: AylikDagilim[]
  sonHareketler: SonHareket[]
  vadeUyarilari: VadeUyarilari | null
}

interface LoadingState {
  kartlar: boolean
  durumDagilimi: boolean
  aylikDagilim: boolean
  sonHareketler: boolean
  vadeUyarilari: boolean
}

// ============================================
// Dashboard Page Component
// ============================================

export function DashboardPage() {
  const navigate = useNavigate()

  // Data state
  const [data, setData] = useState<DashboardData>({
    kartlar: [],
    durumDagilimi: [],
    aylikDagilim: [],
    sonHareketler: [],
    vadeUyarilari: null,
  })

  // Loading state
  const [loading, setLoading] = useState<LoadingState>({
    kartlar: true,
    durumDagilimi: true,
    aylikDagilim: true,
    sonHareketler: true,
    vadeUyarilari: true,
  })

  // Error state
  const [error, setError] = useState<string | null>(null)

  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // ============================================
  // Data Fetching
  // ============================================

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true)
    } else {
      setLoading({
        kartlar: true,
        durumDagilimi: true,
        aylikDagilim: true,
        sonHareketler: true,
        vadeUyarilari: true,
      })
    }
    setError(null)

    try {
      // Paralel istekler
      const [
        kartlarRes,
        durumRes,
        aylikRes,
        hareketlerRes,
        uyarilarRes,
      ] = await Promise.all([
        getKartlar().catch(() => []),
        getDurumDagilimi().catch(() => []),
        getAylikDagilim(6).catch(() => []),
        getSonHareketler(10).catch(() => []),
        getVadeUyarilari().catch(() => null),
      ])

      setData({
        kartlar: kartlarRes,
        durumDagilimi: durumRes,
        aylikDagilim: aylikRes,
        sonHareketler: hareketlerRes,
        vadeUyarilari: uyarilarRes,
      })

      setLastUpdated(new Date())
    } catch (err) {
      console.error('Dashboard veri yükleme hatası:', err)
      setError('Veriler yüklenirken bir hata oluştu.')
    } finally {
      setLoading({
        kartlar: false,
        durumDagilimi: false,
        aylikDagilim: false,
        sonHareketler: false,
        vadeUyarilari: false,
      })
      setIsRefreshing(false)
    }
  }, [])

  // İlk yükleme
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh (5 dakikada bir)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true)
    }, 5 * 60 * 1000) // 5 dakika

    return () => clearInterval(interval)
  }, [fetchData])

  // ============================================
  // Event Handlers
  // ============================================

  const handleKartClick = (kartId: string) => {
    // Kart tıklamalarını ilgili filtrelere yönlendir
    const filterMap: Record<string, string> = {
      portfoy: '/evraklar?durum=portfoy',
      bugun: '/evraklar?vade=bugun',
      gecikmis: '/evraklar?vade=gecikmis',
      tahsil: '/evraklar?durum=tahsil',
    }
    const path = filterMap[kartId]
    if (path) {
      navigate(path)
    }
  }

  const handleRefresh = () => {
    fetchData(true)
  }

  // ============================================
  // Render
  // ============================================

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading>Dashboard</Heading>
          <Text className="mt-1">Çek ve senet takip sistemi özet görünümü</Text>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <Text className="text-xs text-zinc-500">
              Son güncelleme: {lastUpdated.toLocaleTimeString('tr-TR')}
            </Text>
          )}
          <Button
            outline
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Yenileniyor...' : 'Yenile'}
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
          <Button
            color="red"
            className="mt-2"
            onClick={() => fetchData()}
          >
            Tekrar Dene
          </Button>
        </div>
      )}

      {/* İstatistik Kartları */}
      <section>
        <StatCardGrid
          kartlar={data.kartlar}
          isLoading={loading.kartlar}
          onKartClick={handleKartClick}
        />
      </section>

      {/* Grafikler ve Uyarılar Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Durum Dağılımı - Pie Chart */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <Subheading>Durum Dağılımı</Subheading>
          <Text className="mt-1 text-sm">Evrakların durumlarına göre dağılımı</Text>
          <div className="mt-4">
            <DurumPieChart
              data={data.durumDagilimi}
              isLoading={loading.durumDagilimi}
              height={280}
            />
          </div>
        </section>

        {/* Aylık Vade Dağılımı - Bar Chart */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <Subheading>Aylık Vade Dağılımı</Subheading>
          <Text className="mt-1 text-sm">Önümüzdeki 6 ayın vade takvimi</Text>
          <div className="mt-4">
            <VadeBarChart
              data={data.aylikDagilim}
              isLoading={loading.aylikDagilim}
              height={280}
            />
          </div>
        </section>

        {/* Vade Uyarıları */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <Subheading>Vade Uyarıları</Subheading>
          <Text className="mt-1 text-sm">Dikkat edilmesi gereken evraklar</Text>
          <div className="mt-4">
            <VadeUyarilariCompact
              data={data.vadeUyarilari}
              isLoading={loading.vadeUyarilari}
            />
          </div>
        </section>
      </div>

      {/* Son Hareketler */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <Subheading>Son Hareketler</Subheading>
            <Text className="mt-1 text-sm">En son yapılan evrak işlemleri</Text>
          </div>
          <Button
            outline
            onClick={() => navigate('/evraklar')}
          >
            Tümünü Gör
          </Button>
        </div>
        <SonHareketler
          data={data.sonHareketler}
          isLoading={loading.sonHareketler}
          limit={10}
        />
      </section>
    </div>
  )
}

// ============================================
// Export
// ============================================

export default DashboardPage
