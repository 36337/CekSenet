// ============================================
// ÇekSenet - Krediler Listesi Sayfası
// ============================================

import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui/table'
import {
  PlusIcon,
  ArrowPathIcon,
  BanknotesIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/20/solid'
import {
  getKrediler,
  getKrediOzet,
  getBankalarForSelect,
  KREDI_TURU_LABELS,
  KREDI_DURUM_LABELS,
  KREDI_DURUM_COLORS,
  formatKrediTutar,
  formatKrediTarih,
  hesaplaIlerleme,
  type Kredi,
  type KrediFilters,
  type KrediTuru,
  type KrediDurum,
  type KrediGenelOzet,
  type Banka,
} from '@/services'

// ============================================
// Types
// ============================================

type SortField = 'baslangic_tarihi' | 'anapara' | 'created_at' | 'aylik_taksit'
type SortOrder = 'asc' | 'desc'

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ============================================
// Constants
// ============================================

const DURUM_OPTIONS: Array<{ value: KrediDurum | ''; label: string }> = [
  { value: '', label: 'Tüm Durumlar' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'kapandi', label: 'Kapandı' },
  { value: 'erken_kapandi', label: 'Erken Kapandı' },
]

const TUR_OPTIONS: Array<{ value: KrediTuru | ''; label: string }> = [
  { value: '', label: 'Tüm Türler' },
  { value: 'tuketici', label: 'Tüketici Kredisi' },
  { value: 'konut', label: 'Konut Kredisi' },
  { value: 'tasit', label: 'Taşıt Kredisi' },
  { value: 'ticari', label: 'Ticari Kredi' },
  { value: 'isletme', label: 'İşletme Kredisi' },
  { value: 'diger', label: 'Diğer' },
]

const LIMIT_OPTIONS = [10, 25, 50, 100]

// ============================================
// Stat Card Component
// ============================================

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  color?: 'default' | 'green' | 'red' | 'yellow' | 'blue'
  icon?: React.ReactNode
}

function StatCard({ title, value, subtitle, color = 'default', icon }: StatCardProps) {
  const colorClasses = {
    default: 'bg-white',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    blue: 'bg-blue-50 border-blue-200',
  }

  const textClasses = {
    default: 'text-zinc-900',
    green: 'text-green-700',
    red: 'text-red-700',
    yellow: 'text-yellow-700',
    blue: 'text-blue-700',
  }

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <Text className="text-sm font-medium text-zinc-500">{title}</Text>
        {icon}
      </div>
      <div className={`mt-2 text-2xl font-semibold ${textClasses[color]}`}>
        {value}
      </div>
      {subtitle && (
        <Text className="mt-1 text-xs text-zinc-500">{subtitle}</Text>
      )}
    </div>
  )
}

// ============================================
// Progress Bar Component
// ============================================

interface ProgressBarProps {
  current: number
  total: number
  size?: 'sm' | 'md'
}

function ProgressBar({ current, total, size = 'sm' }: ProgressBarProps) {
  const percentage = hesaplaIlerleme(current, total)
  const height = size === 'sm' ? 'h-1.5' : 'h-2'
  
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 rounded-full bg-zinc-200 ${height}`}>
        <div
          className={`rounded-full bg-green-500 ${height}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-zinc-500 whitespace-nowrap">
        {current}/{total}
      </span>
    </div>
  )
}

// ============================================
// Component
// ============================================

export function KredilerPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Data State
  const [krediler, setKrediler] = useState<Kredi[]>([])
  const [ozet, setOzet] = useState<KrediGenelOzet | null>(null)
  const [bankalar, setBankalar] = useState<Banka[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  // UI State
  const [isLoading, setIsLoading] = useState(true)
  const [isOzetLoading, setIsOzetLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter State
  const [durum, setDurum] = useState(searchParams.get('durum') || '')
  const [krediTuru, setKrediTuru] = useState(searchParams.get('kredi_turu') || '')
  const [bankaId, setBankaId] = useState(searchParams.get('banka_id') || '')
  const [sortField, setSortField] = useState<SortField>(
    (searchParams.get('sort') as SortField) || 'baslangic_tarihi'
  )
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    (searchParams.get('order') as SortOrder) || 'desc'
  )
  const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 20)
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)

  // ============================================
  // Data Fetching
  // ============================================

  // Bankalar listesi (filtre için)
  useEffect(() => {
    getBankalarForSelect()
      .then(setBankalar)
      .catch(console.error)
  }, [])

  // Kredi özeti
  const fetchOzet = useCallback(async () => {
    setIsOzetLoading(true)
    try {
      const data = await getKrediOzet()
      setOzet(data)
    } catch (err) {
      console.error('Kredi özeti yüklenemedi:', err)
    } finally {
      setIsOzetLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOzet()
  }, [fetchOzet])

  // Kredi listesi
  const fetchKrediler = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const filters: KrediFilters = {
        page,
        limit,
        sort: sortField,
        order: sortOrder,
      }

      if (durum) filters.durum = durum as KrediDurum
      if (krediTuru) filters.kredi_turu = krediTuru as KrediTuru
      if (bankaId) filters.banka_id = Number(bankaId)

      const result = await getKrediler(filters)
      setKrediler(result.data)
      setPagination(result.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Krediler yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, sortField, sortOrder, durum, krediTuru, bankaId])

  useEffect(() => {
    fetchKrediler()
  }, [fetchKrediler])

  // URL params sync
  useEffect(() => {
    const params = new URLSearchParams()
    if (durum) params.set('durum', durum)
    if (krediTuru) params.set('kredi_turu', krediTuru)
    if (bankaId) params.set('banka_id', bankaId)
    if (sortField !== 'baslangic_tarihi') params.set('sort', sortField)
    if (sortOrder !== 'desc') params.set('order', sortOrder)
    if (limit !== 20) params.set('limit', String(limit))
    if (page !== 1) params.set('page', String(page))

    setSearchParams(params, { replace: true })
  }, [durum, krediTuru, bankaId, sortField, sortOrder, limit, page, setSearchParams])

  // ============================================
  // Handlers
  // ============================================

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
    setPage(1)
  }

  const handleClearFilters = () => {
    setDurum('')
    setKrediTuru('')
    setBankaId('')
    setSortField('baslangic_tarihi')
    setSortOrder('desc')
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRefresh = () => {
    fetchKrediler()
    fetchOzet()
  }

  // ============================================
  // Render Helpers
  // ============================================

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) return null
    return sortOrder === 'asc' ? (
      <ChevronUpIcon className="ml-1 inline h-4 w-4" />
    ) : (
      <ChevronDownIcon className="ml-1 inline h-4 w-4" />
    )
  }

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={() => handleSort(field)}
      className="inline-flex items-center font-medium hover:text-zinc-900"
    >
      {children}
      <SortIcon field={field} />
    </button>
  )

  const hasFilters = durum || krediTuru || bankaId

  // ============================================
  // Render
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading>Krediler</Heading>
          <Text className="mt-1">
            {pagination.total > 0
              ? `Toplam ${pagination.total} kredi`
              : 'Kredi takip listesi'}
          </Text>
        </div>
        <div className="flex gap-2">
          <Button outline onClick={handleRefresh} title="Yenile">
            <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button color="blue" onClick={() => navigate('/krediler/yeni')}>
            <PlusIcon className="h-5 w-5" />
            Yeni Kredi
          </Button>
        </div>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Aktif Kredi"
          value={isOzetLoading ? '...' : String(ozet?.aktif_kredi || 0)}
          subtitle={`Toplam ${ozet?.toplam_kredi || 0} kredi`}
          color="blue"
          icon={<BanknotesIcon className="h-5 w-5 text-blue-500" />}
        />
        <StatCard
          title="Toplam Borç"
          value={isOzetLoading ? '...' : formatKrediTutar(ozet?.kalan_borc || 0)}
          subtitle={`Anapara: ${formatKrediTutar(ozet?.toplam_anapara || 0)}`}
          color="default"
        />
        <StatCard
          title="Bu Ay Ödenecek"
          value={isOzetLoading ? '...' : formatKrediTutar(ozet?.bu_ay_taksit_tutar || 0)}
          subtitle={`${ozet?.bu_ay_taksit_adet || 0} taksit`}
          color="yellow"
        />
        <StatCard
          title="Geciken Taksit"
          value={isOzetLoading ? '...' : String(ozet?.geciken_taksit_adet || 0)}
          subtitle={ozet?.geciken_taksit_adet ? formatKrediTutar(ozet.geciken_taksit_tutar) : 'Geciken yok'}
          color={ozet?.geciken_taksit_adet ? 'red' : 'green'}
          icon={ozet?.geciken_taksit_adet ? (
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
          ) : undefined}
        />
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Banka
            </label>
            <Select
              value={bankaId}
              onChange={(e) => { setBankaId(e.target.value); setPage(1) }}
            >
              <option value="">Tüm Bankalar</option>
              {bankalar.map((banka) => (
                <option key={banka.id} value={banka.id}>
                  {banka.ad}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Kredi Türü
            </label>
            <Select
              value={krediTuru}
              onChange={(e) => { setKrediTuru(e.target.value); setPage(1) }}
            >
              {TUR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Durum
            </label>
            <Select
              value={durum}
              onChange={(e) => { setDurum(e.target.value); setPage(1) }}
            >
              {DURUM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          {hasFilters && (
            <Button outline onClick={handleClearFilters}>
              Temizle
            </Button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : krediler.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center">
          <BanknotesIcon className="mx-auto h-12 w-12 text-zinc-400" />
          <Text className="mt-4">
            {hasFilters
              ? 'Filtrelere uygun kredi bulunamadı.'
              : 'Henüz kredi bulunmuyor.'}
          </Text>
          {!hasFilters && (
            <Button color="blue" className="mt-4" onClick={() => navigate('/krediler/yeni')}>
              İlk Krediyi Ekle
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-zinc-200 bg-white">
            <Table striped>
              <TableHead>
                <TableRow>
                  <TableHeader>Banka</TableHeader>
                  <TableHeader>Kredi Türü</TableHeader>
                  <TableHeader>
                    <SortableHeader field="anapara">Anapara</SortableHeader>
                  </TableHeader>
                  <TableHeader>
                    <SortableHeader field="aylik_taksit">Aylık Taksit</SortableHeader>
                  </TableHeader>
                  <TableHeader>İlerleme</TableHeader>
                  <TableHeader>
                    <SortableHeader field="baslangic_tarihi">Başlangıç</SortableHeader>
                  </TableHeader>
                  <TableHeader>Durum</TableHeader>
                  <TableHeader>Kalan Borç</TableHeader>
                  <TableHeader className="text-right">İşlem</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {krediler.map((kredi) => {
                  const toplamTaksit = kredi.vade_ay
                  const odenenTaksit = kredi.odenen_taksit_sayisi || 0
                  const kalanTaksit = kredi.kalan_taksit_sayisi || 0
                  const gecikenTaksit = kredi.geciken_taksit_sayisi || 0

                  return (
                    <TableRow key={kredi.id} href={`/krediler/${kredi.id}`}>
                      <TableCell className="font-medium">
                        {kredi.banka_adi || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge color="zinc">
                          {KREDI_TURU_LABELS[kredi.kredi_turu]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatKrediTutar(kredi.anapara, kredi.para_birimi)}
                      </TableCell>
                      <TableCell>
                        {formatKrediTutar(kredi.aylik_taksit, kredi.para_birimi)}
                      </TableCell>
                      <TableCell className="min-w-32">
                        <ProgressBar current={odenenTaksit} total={toplamTaksit} />
                        {gecikenTaksit > 0 && (
                          <span className="mt-1 block text-xs text-red-600">
                            {gecikenTaksit} geciken
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-600">
                        {formatKrediTarih(kredi.baslangic_tarihi)}
                      </TableCell>
                      <TableCell>
                        <Badge color={KREDI_DURUM_COLORS[kredi.durum] as any}>
                          {KREDI_DURUM_LABELS[kredi.durum]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-zinc-900">
                        {formatKrediTutar(kredi.kalan_borc || 0, kredi.para_birimi)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          outline
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            navigate(`/krediler/${kredi.id}`)
                          }}
                        >
                          Detay
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-2">
                <Text className="text-sm">Sayfa başına:</Text>
                <Select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value))
                    setPage(1)
                  }}
                  className="w-20"
                >
                  {LIMIT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  outline
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  Önceki
                </Button>
                <Text className="px-4 text-sm">
                  Sayfa {page} / {pagination.totalPages}
                </Text>
                <Button
                  outline
                  disabled={page >= pagination.totalPages}
                  onClick={() => handlePageChange(page + 1)}
                >
                  Sonraki
                </Button>
              </div>

              <Text className="text-sm text-zinc-500">
                Toplam {pagination.total} kayıt
              </Text>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default KredilerPage
