// ============================================
// ÇekSenet - Evrak Detay Sayfası
// Evrak bilgileri, hareket geçmişi ve işlemler
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
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/20/solid'
import {
  getEvrak,
  getEvrakHareketler,
  updateEvrakDurum,
  DURUM_LABELS,
  DURUM_COLORS,
  EVRAK_TIPI_LABELS,
  EVRAK_TIPI_COLORS,
  getGecerliDurumlar,
  type EvrakDetay,
  type EvrakHareket,
  type EvrakDurumu,
} from '@/services'
import { formatCurrency, formatDate } from '@/services/dashboard'

// ============================================
// Component
// ============================================

export function EvrakDetayPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const evrakId = Number(id)

  // State
  const [evrak, setEvrak] = useState<EvrakDetay | null>(null)
  const [hareketler, setHareketler] = useState<EvrakHareket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Durum değiştirme modal state
  const [isDurumModalOpen, setIsDurumModalOpen] = useState(false)
  const [selectedDurum, setSelectedDurum] = useState<EvrakDurumu | ''>('')
  const [durumAciklama, setDurumAciklama] = useState('')
  const [isDurumUpdating, setIsDurumUpdating] = useState(false)
  const [durumError, setDurumError] = useState<string | null>(null)

  // Geçerli durum geçişleri
  const gecerliDurumlar = evrak ? getGecerliDurumlar(evrak.durum) : []

  // ============================================
  // Data Fetching
  // ============================================

  const fetchEvrakDetay = useCallback(async () => {
    if (!evrakId || isNaN(evrakId)) {
      setError('Geçersiz evrak ID')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Paralel olarak evrak ve hareketleri getir
      const [evrakData, hareketlerData] = await Promise.all([
        getEvrak(evrakId),
        getEvrakHareketler(evrakId),
      ])

      setEvrak(evrakData)
      setHareketler(hareketlerData.hareketler)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evrak yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }, [evrakId])

  useEffect(() => {
    fetchEvrakDetay()
  }, [fetchEvrakDetay])

  // ============================================
  // Durum Değiştirme
  // ============================================

  const handleOpenDurumModal = () => {
    setSelectedDurum('')
    setDurumAciklama('')
    setDurumError(null)
    setIsDurumModalOpen(true)
  }

  const handleCloseDurumModal = () => {
    setIsDurumModalOpen(false)
    setSelectedDurum('')
    setDurumAciklama('')
    setDurumError(null)
  }

  const handleDurumUpdate = async () => {
    if (!selectedDurum || !evrak) return

    setIsDurumUpdating(true)
    setDurumError(null)

    try {
      const result = await updateEvrakDurum(evrakId, selectedDurum, durumAciklama || undefined)
      
      // Evrak ve hareketleri güncelle
      setEvrak(result.evrak)
      setHareketler((prev) => [result.hareket, ...prev])
      
      handleCloseDurumModal()
    } catch (err) {
      setDurumError(err instanceof Error ? err.message : 'Durum güncellenirken hata oluştu')
    } finally {
      setIsDurumUpdating(false)
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

  if (error || !evrak) {
    return (
      <div className="space-y-4">
        <Button outline onClick={() => navigate('/evraklar')}>
          <ArrowLeftIcon className="h-5 w-5" />
          Listeye Dön
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <Text className="mt-4 text-red-700 dark:text-red-400">
            {error || 'Evrak bulunamadı'}
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
          <Button outline onClick={() => navigate('/evraklar')}>
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <Heading>{evrak.evrak_no}</Heading>
              <Badge color={DURUM_COLORS[evrak.durum] as any}>
                {DURUM_LABELS[evrak.durum]}
              </Badge>
              <Badge color={EVRAK_TIPI_COLORS[evrak.evrak_tipi] as any}>
                {EVRAK_TIPI_LABELS[evrak.evrak_tipi]}
              </Badge>
            </div>
            <Text className="mt-1">
              {formatCurrency(evrak.tutar)} • Vade: {formatDate(evrak.vade_tarihi)}
            </Text>
          </div>
        </div>
        <div className="flex gap-2">
          {gecerliDurumlar.length > 0 && (
            <Button color="blue" onClick={handleOpenDurumModal}>
              Durum Değiştir
            </Button>
          )}
          <Button outline onClick={() => navigate(`/evraklar/${evrakId}/duzenle`)}>
            <PencilSquareIcon className="h-5 w-5" />
            Düzenle
          </Button>
        </div>
      </div>

      {/* Evrak Bilgileri */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <Heading level={2} className="text-lg">
          Evrak Bilgileri
        </Heading>
        <Divider className="my-4" />

        <DescriptionList>
          <DescriptionTerm>Evrak Tipi</DescriptionTerm>
          <DescriptionDetails>
            <Badge color={EVRAK_TIPI_COLORS[evrak.evrak_tipi] as any}>
              {EVRAK_TIPI_LABELS[evrak.evrak_tipi]}
            </Badge>
          </DescriptionDetails>

          <DescriptionTerm>Evrak No</DescriptionTerm>
          <DescriptionDetails className="font-medium">{evrak.evrak_no}</DescriptionDetails>

          <DescriptionTerm>Tutar</DescriptionTerm>
          <DescriptionDetails className="text-lg font-semibold text-zinc-900 dark:text-white">
            {formatCurrency(evrak.tutar)}
          </DescriptionDetails>

          <DescriptionTerm>Vade Tarihi</DescriptionTerm>
          <DescriptionDetails>{formatDate(evrak.vade_tarihi)}</DescriptionDetails>

          <DescriptionTerm>Durum</DescriptionTerm>
          <DescriptionDetails>
            <Badge color={DURUM_COLORS[evrak.durum] as any}>
              {DURUM_LABELS[evrak.durum]}
            </Badge>
          </DescriptionDetails>

          <DescriptionTerm>Keşideci</DescriptionTerm>
          <DescriptionDetails>{evrak.kesideci}</DescriptionDetails>

          {evrak.banka_adi && (
            <>
              <DescriptionTerm>Banka</DescriptionTerm>
              <DescriptionDetails>{evrak.banka_adi}</DescriptionDetails>
            </>
          )}

          {evrak.cari_adi && (
            <>
              <DescriptionTerm>Cari Hesap</DescriptionTerm>
              <DescriptionDetails>
                <button
                  type="button"
                  onClick={() => navigate(`/cariler/${evrak.cari_id}`)}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  {evrak.cari_adi}
                </button>
                {evrak.cari_telefon && (
                  <span className="ml-2 text-zinc-500">({evrak.cari_telefon})</span>
                )}
              </DescriptionDetails>
            </>
          )}

          {evrak.notlar && (
            <>
              <DescriptionTerm>Notlar</DescriptionTerm>
              <DescriptionDetails className="whitespace-pre-wrap">{evrak.notlar}</DescriptionDetails>
            </>
          )}

          <DescriptionTerm>Oluşturulma</DescriptionTerm>
          <DescriptionDetails>{formatDateTime(evrak.created_at)}</DescriptionDetails>

          <DescriptionTerm>Son Güncelleme</DescriptionTerm>
          <DescriptionDetails>{formatDateTime(evrak.updated_at)}</DescriptionDetails>
        </DescriptionList>
      </div>

      {/* Hareket Geçmişi */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <Heading level={2} className="text-lg">
          Hareket Geçmişi
        </Heading>
        <Divider className="my-4" />

        {hareketler.length === 0 ? (
          <div className="py-8 text-center">
            <Text className="text-zinc-500">Henüz hareket kaydı bulunmuyor.</Text>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Tarih</TableHeader>
                <TableHeader>Eski Durum</TableHeader>
                <TableHeader>Yeni Durum</TableHeader>
                <TableHeader>Açıklama</TableHeader>
                <TableHeader>İşlemi Yapan</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {hareketler.map((hareket) => (
                <TableRow key={hareket.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDateTime(hareket.created_at)}
                  </TableCell>
                  <TableCell>
                    {hareket.eski_durum ? (
                      <Badge color={DURUM_COLORS[hareket.eski_durum] as any}>
                        {DURUM_LABELS[hareket.eski_durum]}
                      </Badge>
                    ) : (
                      <span className="text-zinc-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge color={DURUM_COLORS[hareket.yeni_durum] as any}>
                      {DURUM_LABELS[hareket.yeni_durum]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {hareket.aciklama || '-'}
                  </TableCell>
                  <TableCell>{hareket.kullanici_adi}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Durum Değiştirme Modal */}
      <Dialog open={isDurumModalOpen} onClose={handleCloseDurumModal}>
        <DialogTitle>Durum Değiştir</DialogTitle>
        <DialogDescription>
          Evrak durumunu değiştirmek için yeni durumu seçin.
        </DialogDescription>

        <DialogBody>
          {durumError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {durumError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Mevcut Durum
              </label>
              <Badge color={DURUM_COLORS[evrak.durum] as any} className="text-sm">
                {DURUM_LABELS[evrak.durum]}
              </Badge>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Yeni Durum <span className="text-red-500">*</span>
              </label>
              <Select
                value={selectedDurum}
                onChange={(e) => setSelectedDurum(e.target.value as EvrakDurumu)}
              >
                <option value="">Durum seçin...</option>
                {gecerliDurumlar.map((d) => (
                  <option key={d} value={d}>
                    {DURUM_LABELS[d]}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Açıklama (İsteğe bağlı)
              </label>
              <Textarea
                value={durumAciklama}
                onChange={(e) => setDurumAciklama(e.target.value)}
                placeholder="Durum değişikliği için not ekleyin..."
                rows={3}
              />
            </div>
          </div>
        </DialogBody>

        <DialogActions>
          <Button outline onClick={handleCloseDurumModal} disabled={isDurumUpdating}>
            İptal
          </Button>
          <Button
            color="blue"
            onClick={handleDurumUpdate}
            disabled={!selectedDurum || isDurumUpdating}
          >
            {isDurumUpdating ? (
              <>
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                Güncelleniyor...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-5 w-5" />
                Durumu Güncelle
              </>
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default EvrakDetayPage
