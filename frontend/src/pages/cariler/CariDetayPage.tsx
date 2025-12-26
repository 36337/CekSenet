// ============================================
// ÇekSenet - Cari Detay Sayfası
// Cari bilgileri, istatistikler ve evraklar
// ============================================

import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Divider } from '@/components/ui/divider'
import {
  DescriptionList,
  DescriptionTerm,
  DescriptionDetails,
} from '@/components/ui/description-list'
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui/table'
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogActions,
} from '@/components/ui/dialog'
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  DocumentTextIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  IdentificationIcon,
} from '@heroicons/react/20/solid'
import {
  getCari,
  getCariEvraklar,
  deleteCari,
  CARI_TIP_LABELS,
  CARI_TIP_COLORS,
  DURUM_LABELS,
  DURUM_COLORS,
  EVRAK_TIPI_LABELS,
  EVRAK_TIPI_COLORS,
  type CariWithStats,
  type Evrak,
} from '@/services'
import { formatCurrency, formatDate } from '@/services/dashboard'

// ============================================
// Component
// ============================================

export function CariDetayPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const cariId = Number(id)

  // State
  const [cari, setCari] = useState<CariWithStats | null>(null)
  const [evraklar, setEvraklar] = useState<Evrak[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Sayfalama
  const [evrakPage, setEvrakPage] = useState(1)
  const [evrakTotalPages, setEvrakTotalPages] = useState(1)
  const [evrakTotal, setEvrakTotal] = useState(0)
  const [isLoadingEvraklar, setIsLoadingEvraklar] = useState(false)

  // Silme modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // ============================================
  // Data Fetching
  // ============================================

  const fetchCariDetay = useCallback(async () => {
    if (!cariId || isNaN(cariId)) {
      setError('Geçersiz cari ID')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const cariData = await getCari(cariId)
      setCari(cariData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cari yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }, [cariId])

  const fetchEvraklar = useCallback(async (page: number = 1) => {
    if (!cariId || isNaN(cariId)) return

    setIsLoadingEvraklar(true)

    try {
      const response = await getCariEvraklar(cariId, { page, limit: 10 })
      setEvraklar(response.data)
      setEvrakPage(response.pagination.page)
      setEvrakTotalPages(response.pagination.totalPages)
      setEvrakTotal(response.pagination.total)
    } catch (err) {
      console.error('Evraklar yüklenemedi:', err)
    } finally {
      setIsLoadingEvraklar(false)
    }
  }, [cariId])

  useEffect(() => {
    fetchCariDetay()
  }, [fetchCariDetay])

  useEffect(() => {
    if (cari) {
      fetchEvraklar(1)
    }
  }, [cari, fetchEvraklar])

  // ============================================
  // Silme İşlemi
  // ============================================

  const handleDeleteClick = () => {
    setDeleteError(null)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await deleteCari(cariId)
      navigate('/cariler', {
        state: { message: 'Cari başarıyla silindi' },
      })
    } catch (err: any) {
      setDeleteError(err?.message || 'Cari silinirken bir hata oluştu')
    } finally {
      setIsDeleting(false)
    }
  }

  // ============================================
  // Render Helpers
  // ============================================

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // ============================================
  // Render - Loading
  // ============================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  // ============================================
  // Render - Error
  // ============================================

  if (error || !cari) {
    return (
      <div className="space-y-4">
        <Button outline onClick={() => navigate('/cariler')}>
          <ArrowLeftIcon className="h-5 w-5" />
          Listeye Dön
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <Text className="mt-4 text-red-700 dark:text-red-400">
            {error || 'Cari bulunamadı'}
          </Text>
        </div>
      </div>
    )
  }

  // ============================================
  // Render - Main
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button outline onClick={() => navigate('/cariler')}>
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <Heading>{cari.ad_soyad}</Heading>
              <Badge color={CARI_TIP_COLORS[cari.tip] as any}>
                {CARI_TIP_LABELS[cari.tip]}
              </Badge>
            </div>
            {cari.telefon && (
              <Text className="mt-1 flex items-center gap-1">
                <PhoneIcon className="h-4 w-4" />
                {cari.telefon}
              </Text>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button outline onClick={() => navigate(`/cariler/${cariId}/duzenle`)}>
            <PencilSquareIcon className="h-5 w-5" />
            Düzenle
          </Button>
          <Button color="red" onClick={handleDeleteClick}>
            <TrashIcon className="h-5 w-5" />
            Sil
          </Button>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
          <Text className="text-sm text-zinc-500">Toplam Evrak</Text>
          <div className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-white">
            {cari.evrak_sayisi}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
          <Text className="text-sm text-zinc-500">Toplam Tutar</Text>
          <div className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-white">
            {formatCurrency(cari.toplam_tutar)}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
          <Text className="text-sm text-zinc-500">Portföyde</Text>
          <div className="mt-1 text-2xl font-semibold text-blue-600 dark:text-blue-400">
            {formatCurrency(cari.portfoy_tutar)}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
          <Text className="text-sm text-zinc-500">Tahsil Edilen</Text>
          <div className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(cari.tahsil_tutar)}
          </div>
        </div>
      </div>

      {/* Cari Bilgileri */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <Heading level={2} className="text-lg">
          Cari Bilgileri
        </Heading>
        <Divider className="my-4" />

        <DescriptionList>
          <DescriptionTerm>Ad Soyad / Firma</DescriptionTerm>
          <DescriptionDetails className="font-medium">{cari.ad_soyad}</DescriptionDetails>

          <DescriptionTerm>Cari Tipi</DescriptionTerm>
          <DescriptionDetails>
            <Badge color={CARI_TIP_COLORS[cari.tip] as any}>
              {CARI_TIP_LABELS[cari.tip]}
            </Badge>
          </DescriptionDetails>

          {cari.telefon && (
            <>
              <DescriptionTerm>
                <span className="flex items-center gap-1">
                  <PhoneIcon className="h-4 w-4" />
                  Telefon
                </span>
              </DescriptionTerm>
              <DescriptionDetails>
                <a
                  href={`tel:${cari.telefon}`}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  {cari.telefon}
                </a>
              </DescriptionDetails>
            </>
          )}

          {cari.email && (
            <>
              <DescriptionTerm>
                <span className="flex items-center gap-1">
                  <EnvelopeIcon className="h-4 w-4" />
                  E-posta
                </span>
              </DescriptionTerm>
              <DescriptionDetails>
                <a
                  href={`mailto:${cari.email}`}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  {cari.email}
                </a>
              </DescriptionDetails>
            </>
          )}

          {cari.vergi_no && (
            <>
              <DescriptionTerm>
                <span className="flex items-center gap-1">
                  <IdentificationIcon className="h-4 w-4" />
                  Vergi No
                </span>
              </DescriptionTerm>
              <DescriptionDetails>{cari.vergi_no}</DescriptionDetails>
            </>
          )}

          {cari.adres && (
            <>
              <DescriptionTerm>
                <span className="flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" />
                  Adres
                </span>
              </DescriptionTerm>
              <DescriptionDetails className="whitespace-pre-wrap">{cari.adres}</DescriptionDetails>
            </>
          )}

          {cari.notlar && (
            <>
              <DescriptionTerm>Notlar</DescriptionTerm>
              <DescriptionDetails className="whitespace-pre-wrap">{cari.notlar}</DescriptionDetails>
            </>
          )}

          <DescriptionTerm>Kayıt Tarihi</DescriptionTerm>
          <DescriptionDetails>{formatDateTime(cari.created_at)}</DescriptionDetails>

          <DescriptionTerm>Son Güncelleme</DescriptionTerm>
          <DescriptionDetails>{formatDateTime(cari.updated_at)}</DescriptionDetails>
        </DescriptionList>
      </div>

      {/* Evraklar Tablosu */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <div className="flex items-center justify-between">
          <Heading level={2} className="text-lg">
            <span className="flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5" />
              Evraklar
              {evrakTotal > 0 && (
                <Badge color="zinc">{evrakTotal} kayıt</Badge>
              )}
            </span>
          </Heading>
          <Button
            color="emerald"
            onClick={() => navigate(`/evraklar/yeni?cari_id=${cariId}`)}
          >
            Evrak Ekle
          </Button>
        </div>
        <Divider className="my-4" />

        {isLoadingEvraklar ? (
          <div className="flex items-center justify-center py-8">
            <ArrowPathIcon className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : evraklar.length === 0 ? (
          <div className="py-8 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-zinc-300" />
            <Text className="mt-2 text-zinc-500">Bu cariye ait evrak bulunmuyor.</Text>
            <Button
              color="emerald"
              className="mt-4"
              onClick={() => navigate(`/evraklar/yeni?cari_id=${cariId}`)}
            >
              İlk Evrakı Ekle
            </Button>
          </div>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Durum</TableHeader>
                  <TableHeader>Tip</TableHeader>
                  <TableHeader>Evrak No</TableHeader>
                  <TableHeader className="text-right">Tutar</TableHeader>
                  <TableHeader>Vade</TableHeader>
                  <TableHeader>Keşideci</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {evraklar.map((evrak) => (
                  <TableRow
                    key={evrak.id}
                    href={`/evraklar/${evrak.id}`}
                    className="cursor-pointer"
                  >
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
                    <TableCell className="text-right font-medium">
                      {formatCurrency(evrak.tutar)}
                    </TableCell>
                    <TableCell>{formatDate(evrak.vade_tarihi)}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{evrak.kesideci}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Sayfalama */}
            {evrakTotalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-700">
                <Text className="text-sm text-zinc-500">
                  Sayfa {evrakPage} / {evrakTotalPages}
                </Text>
                <div className="flex gap-2">
                  <Button
                    outline
                    disabled={evrakPage <= 1}
                    onClick={() => fetchEvraklar(evrakPage - 1)}
                  >
                    Önceki
                  </Button>
                  <Button
                    outline
                    disabled={evrakPage >= evrakTotalPages}
                    onClick={() => fetchEvraklar(evrakPage + 1)}
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Silme Onay Modal */}
      <Dialog open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <DialogTitle>
          <div className="flex items-center gap-2 text-red-600">
            <TrashIcon className="h-6 w-6" />
            Cariyi Sil
          </div>
        </DialogTitle>
        <DialogDescription>
          <span className="font-semibold">{cari.ad_soyad}</span> isimli cariyi silmek istediğinize
          emin misiniz?
        </DialogDescription>
        <DialogBody>
          {deleteError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {deleteError}
            </div>
          )}

          {cari.evrak_sayisi > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
              <strong>Uyarı:</strong> Bu cariye ait {cari.evrak_sayisi} evrak bulunmaktadır.
              Cari silinirse evraklar cari ile ilişkisiz kalacaktır.
            </div>
          )}

          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Bu işlem geri alınamaz.
          </p>
        </DialogBody>
        <DialogActions>
          <Button outline onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>
            İptal
          </Button>
          <Button color="red" onClick={handleDeleteConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                Siliniyor...
              </>
            ) : (
              <>
                <TrashIcon className="h-5 w-5" />
                Evet, Sil
              </>
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default CariDetayPage
