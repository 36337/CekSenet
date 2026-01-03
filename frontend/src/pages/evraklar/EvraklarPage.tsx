// ============================================
// ÇekSenet - Evrak Listesi Sayfası
// ============================================

import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/20/solid'
import {
  getEvraklar,
  DURUM_LABELS,
  DURUM_COLORS,
  EVRAK_TIPI_LABELS,
  EVRAK_TIPI_COLORS,
  type Evrak,
  type EvrakFilters,
  type EvrakDurumu,
  type EvrakTipi,
} from '@/services'
import { formatDate } from '@/services/dashboard'
import { formatCurrency, isTRY } from '@/utils/currency'

// ============================================
// Types
// ============================================

type SortField = 'vade_tarihi' | 'tutar' | 'created_at' | 'evrak_no'
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

const DURUM_OPTIONS: Array<{ value: EvrakDurumu | ''; label: string }> = [
  { value: '', label: 'Tüm Durumlar' },
  { value: 'portfoy', label: 'Portföy' },
  { value: 'bankada', label: 'Bankada' },
  { value: 'ciro', label: 'Ciro Edildi' },
  { value: 'tahsil', label: 'Tahsil Edildi' },
  { value: 'karsiliksiz', label: 'Karşılıksız' },
]

const TIP_OPTIONS: Array<{ value: EvrakTipi | ''; label: string }> = [
  { value: '', label: 'Tüm Tipler' },
  { value: 'cek', label: 'Çek' },
  { value: 'senet', label: 'Senet' },
]

const LIMIT_OPTIONS = [10, 25, 50, 100]

// ============================================
// Helper Functions
// ============================================

/**
 * Döviz kurunu formatla
 */
function formatKur(kur: number | null | undefined, paraBirimi: string): string {
  if (isTRY(paraBirimi)) return '-'
  if (!kur) return '-'
  
  return kur.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })
}

// ============================================
// Component
// ============================================

export function EvraklarPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // State
  const [evraklar, setEvraklar] = useState<Evrak[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filter state
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [durum, setDurum] = useState(searchParams.get('durum') || '')
  const [evrakTipi, setEvrakTipi] = useState(searchParams.get('evrak_tipi') || '')
  const [vadeBaslangic, setVadeBaslangic] = useState(searchParams.get('vade_baslangic') || '')
  const [vadeBitis, setVadeBitis] = useState(searchParams.get('vade_bitis') || '')
  const [sortField, setSortField] = useState<SortField>(
    (searchParams.get('sort') as SortField) || 'vade_tarihi'
  )
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    (searchParams.get('order') as SortOrder) || 'asc'
  )
  const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 20)
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)

  // ============================================
  // Data Fetching
  // ============================================

  const fetchEvraklar = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const filters: EvrakFilters = {
        page,
        limit,
        sort: sortField,
        order: sortOrder,
      }

      if (search) filters.search = search
      if (durum) filters.durum = durum
      if (evrakTipi) filters.evrak_tipi = evrakTipi as EvrakTipi
      if (vadeBaslangic) filters.vade_baslangic = vadeBaslangic
      if (vadeBitis) filters.vade_bitis = vadeBitis

      const result = await getEvraklar(filters)
      setEvraklar(result.data)
      setPagination(result.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evraklar yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, sortField, sortOrder, search, durum, evrakTipi, vadeBaslangic, vadeBitis])

  useEffect(() => {
    fetchEvraklar()
  }, [fetchEvraklar])

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (durum) params.set('durum', durum)
    if (evrakTipi) params.set('evrak_tipi', evrakTipi)
    if (vadeBaslangic) params.set('vade_baslangic', vadeBaslangic)
    if (vadeBitis) params.set('vade_bitis', vadeBitis)
    if (sortField !== 'vade_tarihi') params.set('sort', sortField)
    if (sortOrder !== 'asc') params.set('order', sortOrder)
    if (limit !== 20) params.set('limit', String(limit))
    if (page !== 1) params.set('page', String(page))

    setSearchParams(params, { replace: true })
  }, [search, durum, evrakTipi, vadeBaslangic, vadeBitis, sortField, sortOrder, limit, page, setSearchParams])

  // ============================================
  // Handlers
  // ============================================

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
    setPage(1)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchEvraklar()
  }

  const handleClearFilters = () => {
    setSearch('')
    setDurum('')
    setEvrakTipi('')
    setVadeBaslangic('')
    setVadeBitis('')
    setSortField('vade_tarihi')
    setSortOrder('asc')
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  // ============================================
  // Render
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading>Evraklar</Heading>
          <Text className="mt-1">
            {pagination.total > 0
              ? `Toplam ${pagination.total} evrak`
              : 'Çek ve senet listesi'}
          </Text>
        </div>
        <div className="flex gap-2">
          <Button outline onClick={() => navigate('/evraklar/import')}>
            <DocumentArrowUpIcon className="h-5 w-5" />
            Excel Import
          </Button>
          <Button color="blue" onClick={() => navigate('/evraklar/yeni')}>
            <PlusIcon className="h-5 w-5" />
            Yeni Evrak
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <Input
              type="text"
              placeholder="Evrak no veya keşideci ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" outline>
            Ara
          </Button>
          <Button
            type="button"
            outline
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-zinc-100' : ''}
          >
            <FunnelIcon className="h-5 w-5" />
            Filtreler
          </Button>
          <Button type="button" outline onClick={() => fetchEvraklar()} title="Yenile">
            <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </form>

        {/* Extended Filters */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-zinc-200 pt-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Durum
              </label>
              <Select value={durum} onChange={(e) => { setDurum(e.target.value); setPage(1) }}>
                {DURUM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Evrak Tipi
              </label>
              <Select value={evrakTipi} onChange={(e) => { setEvrakTipi(e.target.value); setPage(1) }}>
                {TIP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Vade Başlangıç
              </label>
              <Input
                type="date"
                value={vadeBaslangic}
                onChange={(e) => { setVadeBaslangic(e.target.value); setPage(1) }}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Vade Bitiş
              </label>
              <Input
                type="date"
                value={vadeBitis}
                onChange={(e) => { setVadeBitis(e.target.value); setPage(1) }}
              />
            </div>

            <div className="flex items-end">
              <Button type="button" outline onClick={handleClearFilters} className="w-full">
                Filtreleri Temizle
              </Button>
            </div>
          </div>
        )}
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
      ) : evraklar.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-zinc-400" />
          <Text className="mt-4">
            {search || durum || evrakTipi || vadeBaslangic || vadeBitis
              ? 'Arama kriterlerine uygun evrak bulunamadı.'
              : 'Henüz evrak bulunmuyor.'}
          </Text>
          {!search && !durum && !evrakTipi && (
            <Button color="blue" className="mt-4" onClick={() => navigate('/evraklar/yeni')}>
              İlk Evrakı Ekle
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-zinc-200 bg-white">
            <Table striped>
              <TableHead>
                <TableRow>
                  <TableHeader>Cari</TableHeader>
                  <TableHeader>Durum</TableHeader>
                  <TableHeader>Tip</TableHeader>
                  <TableHeader>
                    <SortableHeader field="evrak_no">Evrak No</SortableHeader>
                  </TableHeader>
                  <TableHeader>
                    <SortableHeader field="tutar">Tutar</SortableHeader>
                  </TableHeader>
                  <TableHeader>Evrak Tarihi</TableHeader>
                  <TableHeader>
                    <SortableHeader field="vade_tarihi">Valör</SortableHeader>
                  </TableHeader>
                  <TableHeader>Döviz Kuru</TableHeader>
                  <TableHeader>Keşideci</TableHeader>
                  <TableHeader className="text-right">İşlem</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {evraklar.map((evrak) => (
                  <TableRow key={evrak.id} href={`/evraklar/${evrak.id}`}>
                    <TableCell className="text-zinc-600">
                      {evrak.cari_adi || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge color={DURUM_COLORS[evrak.durum] as any}>
                        {DURUM_LABELS[evrak.durum]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge color={EVRAK_TIPI_COLORS[evrak.evrak_tipi] as any}>
                        {EVRAK_TIPI_LABELS[evrak.evrak_tipi]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{evrak.evrak_no}</TableCell>
                    <TableCell className="font-medium text-zinc-900">
                      {formatCurrency(evrak.tutar, evrak.para_birimi || 'TRY')}
                    </TableCell>
                    <TableCell className="text-zinc-600">
                      {evrak.evrak_tarihi ? formatDate(evrak.evrak_tarihi) : '-'}
                    </TableCell>
                    <TableCell>{formatDate(evrak.vade_tarihi)}</TableCell>
                    <TableCell className="text-zinc-600">
                      {formatKur(evrak.doviz_kuru, evrak.para_birimi || 'TRY')}
                    </TableCell>
                    <TableCell className="text-zinc-600">
                      {evrak.kesideci || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        outline
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          navigate(`/evraklar/${evrak.id}`)
                        }}
                      >
                        Detay
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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

export default EvraklarPage
