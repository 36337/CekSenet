// ============================================
// ÇekSenet - Raporlar Sayfası
// Tarih aralığı raporu, vade raporu ve Excel export
// ============================================

import { useState, useCallback } from 'react'
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
  ChartBarIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  ClockIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  DocumentChartBarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/20/solid'
import {
  getTarihAraligiRaporu,
  getVadeRaporu,
  exportToExcel,
  getBugun,
  getSonXGun,
  getGelecekXGun,
  getAyBaslangic,
  getAySonu,
  type TarihAraligiFiltre,
  type TarihAraligiRapor,
  type VadeRaporu,
  type RaporEvrak,
} from '@/services/reports'
import {
  DURUM_LABELS,
  DURUM_COLORS,
  EVRAK_TIPI_LABELS,
  EVRAK_TIPI_COLORS,
  type EvrakDurumu,
  type EvrakTipi,
} from '@/services/evraklar'
import { formatCurrency, formatDate } from '@/services/dashboard'

// ============================================
// Types
// ============================================

type TabType = 'tarih-araligi' | 'vade'
type VadeGunSecimi = 7 | 14 | 30 | 60 | 90

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

const TARIH_TIPI_OPTIONS = [
  { value: 'vade', label: 'Vade Tarihi' },
  { value: 'kayit', label: 'Kayıt Tarihi' },
]

const VADE_GUN_OPTIONS: Array<{ value: VadeGunSecimi; label: string }> = [
  { value: 7, label: '7 Gün' },
  { value: 14, label: '14 Gün' },
  { value: 30, label: '30 Gün' },
  { value: 60, label: '60 Gün' },
  { value: 90, label: '90 Gün' },
]

// ============================================
// Helper Components
// ============================================

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'amber' | 'red' | 'violet'
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400',
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <Text className="text-sm text-zinc-500 dark:text-zinc-400">{title}</Text>
          <div className="text-xl font-semibold text-zinc-900 dark:text-white">{value}</div>
          {subtitle && (
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</Text>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export function RaporlarPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('tarih-araligi')

  // Tarih aralığı state
  const [baslangic, setBaslangic] = useState(getAyBaslangic())
  const [bitis, setBitis] = useState(getAySonu())
  const [tarihTipi, setTarihTipi] = useState<'vade' | 'kayit'>('vade')
  const [durum, setDurum] = useState('')
  const [evrakTipi, setEvrakTipi] = useState('')
  const [tarihRaporu, setTarihRaporu] = useState<TarihAraligiRapor | null>(null)

  // Vade raporu state
  const [vadeGun, setVadeGun] = useState<VadeGunSecimi>(30)
  const [gecikmisDahil, setGecikmisDahil] = useState(true)
  const [vadeRaporu, setVadeRaporu] = useState<VadeRaporu | null>(null)

  // Loading states
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ============================================
  // Handlers
  // ============================================

  const handleTarihRaporuGetir = useCallback(async () => {
    if (!baslangic || !bitis) {
      setError('Başlangıç ve bitiş tarihi seçmelisiniz')
      return
    }

    if (new Date(baslangic) > new Date(bitis)) {
      setError('Başlangıç tarihi bitiş tarihinden büyük olamaz')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const filtre: TarihAraligiFiltre = {
        baslangic,
        bitis,
        tarih_tipi: tarihTipi,
      }
      if (durum) filtre.durum = durum
      if (evrakTipi) filtre.evrak_tipi = evrakTipi as EvrakTipi

      const rapor = await getTarihAraligiRaporu(filtre)
      setTarihRaporu(rapor)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rapor oluşturulurken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }, [baslangic, bitis, tarihTipi, durum, evrakTipi])

  const handleVadeRaporuGetir = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const rapor = await getVadeRaporu({
        gun: vadeGun,
        gecikmis_dahil: gecikmisDahil,
      })
      setVadeRaporu(rapor)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vade raporu oluşturulurken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }, [vadeGun, gecikmisDahil])

  const handleExcelExport = async () => {
    if (!tarihRaporu || tarihRaporu.detay.length === 0) {
      setError('Excel export için önce rapor oluşturmalısınız')
      return
    }

    setIsExporting(true)
    setError(null)

    try {
      const filtre: TarihAraligiFiltre = {
        baslangic,
        bitis,
        tarih_tipi: tarihTipi,
      }
      if (durum) filtre.durum = durum
      if (evrakTipi) filtre.evrak_tipi = evrakTipi as EvrakTipi

      await exportToExcel(filtre)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Excel export sırasında hata oluştu')
    } finally {
      setIsExporting(false)
    }
  }

  // Hızlı tarih seçimleri
  const handleHizliTarih = (tip: 'bugun' | 'bu-hafta' | 'bu-ay' | 'son-30' | 'son-90') => {
    const bugun = getBugun()
    switch (tip) {
      case 'bugun':
        setBaslangic(bugun)
        setBitis(bugun)
        break
      case 'bu-hafta':
        setBaslangic(getSonXGun(7))
        setBitis(bugun)
        break
      case 'bu-ay':
        setBaslangic(getAyBaslangic())
        setBitis(getAySonu())
        break
      case 'son-30':
        setBaslangic(getSonXGun(30))
        setBitis(bugun)
        break
      case 'son-90':
        setBaslangic(getSonXGun(90))
        setBitis(bugun)
        break
    }
  }

  // ============================================
  // Render: Tarih Aralığı Raporu
  // ============================================

  const renderTarihAraligiRaporu = () => (
    <div className="space-y-6">
      {/* Filtreler */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
        <div className="mb-4 flex flex-wrap gap-2">
          <Text className="w-full text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Hızlı Seçim:
          </Text>
          <Button outline onClick={() => handleHizliTarih('bugun')}>
            Bugün
          </Button>
          <Button outline onClick={() => handleHizliTarih('bu-hafta')}>
            Son 7 Gün
          </Button>
          <Button outline onClick={() => handleHizliTarih('bu-ay')}>
            Bu Ay
          </Button>
          <Button outline onClick={() => handleHizliTarih('son-30')}>
            Son 30 Gün
          </Button>
          <Button outline onClick={() => handleHizliTarih('son-90')}>
            Son 90 Gün
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Başlangıç Tarihi
            </label>
            <Input
              type="date"
              value={baslangic}
              onChange={(e) => setBaslangic(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Bitiş Tarihi
            </label>
            <Input
              type="date"
              value={bitis}
              onChange={(e) => setBitis(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Tarih Tipi
            </label>
            <Select value={tarihTipi} onChange={(e) => setTarihTipi(e.target.value as 'vade' | 'kayit')}>
              {TARIH_TIPI_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Durum
            </label>
            <Select value={durum} onChange={(e) => setDurum(e.target.value)}>
              {DURUM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Evrak Tipi
            </label>
            <Select value={evrakTipi} onChange={(e) => setEvrakTipi(e.target.value)}>
              {TIP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              color="blue"
              onClick={handleTarihRaporuGetir}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
              ) : (
                <ChartBarIcon className="h-5 w-5" />
              )}
              Rapor Oluştur
            </Button>
          </div>
        </div>
      </div>

      {/* Rapor Sonuçları */}
      {tarihRaporu && (
        <>
          {/* Özet Kartları */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              title="Toplam Evrak"
              value={tarihRaporu.ozet.toplam.adet}
              icon={<DocumentTextIcon className="h-5 w-5" />}
              color="blue"
            />
            <StatCard
              title="Toplam Tutar"
              value={formatCurrency(tarihRaporu.ozet.toplam.tutar)}
              icon={<CurrencyDollarIcon className="h-5 w-5" />}
              color="green"
            />
            <StatCard
              title="Çek"
              value={tarihRaporu.ozet.cek.adet}
              subtitle={formatCurrency(tarihRaporu.ozet.cek.tutar)}
              icon={<DocumentChartBarIcon className="h-5 w-5" />}
              color="violet"
            />
            <StatCard
              title="Senet"
              value={tarihRaporu.ozet.senet.adet}
              subtitle={formatCurrency(tarihRaporu.ozet.senet.tutar)}
              icon={<DocumentChartBarIcon className="h-5 w-5" />}
              color="amber"
            />
          </div>

          {/* Excel Export Butonu */}
          {tarihRaporu.detay.length > 0 && (
            <div className="flex justify-end">
              <Button
                color="green"
                onClick={handleExcelExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                  <ArrowDownTrayIcon className="h-5 w-5" />
                )}
                Excel İndir
              </Button>
            </div>
          )}

          {/* Detay Tablosu */}
          {tarihRaporu.detay.length > 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
              <Table striped>
                <TableHead>
                  <TableRow>
                    <TableHeader>Durum</TableHeader>
                    <TableHeader>Tip</TableHeader>
                    <TableHeader>Evrak No</TableHeader>
                    <TableHeader>Tutar</TableHeader>
                    <TableHeader>Vade Tarihi</TableHeader>
                    <TableHeader>Keşideci</TableHeader>
                    <TableHeader>Cari</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tarihRaporu.detay.map((evrak) => (
                    <TableRow key={evrak.id} href={`/evraklar/${evrak.id}`}>
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
                      <TableCell className="font-medium text-zinc-900 dark:text-white">
                        {formatCurrency(evrak.tutar)}
                      </TableCell>
                      <TableCell>{formatDate(evrak.vade_tarihi)}</TableCell>
                      <TableCell>{evrak.kesideci}</TableCell>
                      <TableCell className="text-zinc-500 dark:text-zinc-400">
                        {evrak.cari_adi || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-800">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-zinc-400" />
              <Text className="mt-4">Seçilen kriterlere uygun evrak bulunamadı.</Text>
            </div>
          )}
        </>
      )}
    </div>
  )

  // ============================================
  // Render: Vade Raporu
  // ============================================

  const renderVadeRaporu = () => (
    <div className="space-y-6">
      {/* Filtreler */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Süre
            </label>
            <div className="flex gap-2">
              {VADE_GUN_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  outline={vadeGun !== opt.value}
                  color={vadeGun === opt.value ? 'blue' : undefined}
                  onClick={() => setVadeGun(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="gecikmisDahil"
              checked={gecikmisDahil}
              onChange={(e) => setGecikmisDahil(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="gecikmisDahil" className="text-sm text-zinc-700 dark:text-zinc-300">
              Gecikmiş evrakları dahil et
            </label>
          </div>

          <Button
            color="blue"
            onClick={handleVadeRaporuGetir}
            disabled={isLoading}
          >
            {isLoading ? (
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
            ) : (
              <ClockIcon className="h-5 w-5" />
            )}
            Vade Raporu
          </Button>
        </div>
      </div>

      {/* Rapor Sonuçları */}
      {vadeRaporu && (
        <>
          {/* Özet Kartları */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              title="Toplam"
              value={vadeRaporu.ozet.toplam.adet}
              subtitle={formatCurrency(vadeRaporu.ozet.toplam.tutar)}
              icon={<DocumentTextIcon className="h-5 w-5" />}
              color="blue"
            />
            {gecikmisDahil && (
              <StatCard
                title="Gecikmiş"
                value={vadeRaporu.ozet.gecikmis.adet}
                subtitle={formatCurrency(vadeRaporu.ozet.gecikmis.tutar)}
                icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                color="red"
              />
            )}
            <StatCard
              title="Bugün"
              value={vadeRaporu.ozet.bugun.adet}
              subtitle={formatCurrency(vadeRaporu.ozet.bugun.tutar)}
              icon={<CalendarDaysIcon className="h-5 w-5" />}
              color="amber"
            />
            <StatCard
              title="Bu Hafta"
              value={vadeRaporu.ozet.buHafta.adet}
              subtitle={formatCurrency(vadeRaporu.ozet.buHafta.tutar)}
              icon={<ClockIcon className="h-5 w-5" />}
              color="green"
            />
          </div>

          {/* Detay Tablosu */}
          {vadeRaporu.detay.length > 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
              <Table striped>
                <TableHead>
                  <TableRow>
                    <TableHeader>Vade</TableHeader>
                    <TableHeader>Durum</TableHeader>
                    <TableHeader>Tip</TableHeader>
                    <TableHeader>Evrak No</TableHeader>
                    <TableHeader>Tutar</TableHeader>
                    <TableHeader>Keşideci</TableHeader>
                    <TableHeader>Cari</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vadeRaporu.detay.map((evrak) => {
                    const vadeDate = new Date(evrak.vade_tarihi)
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const isGecikmis = vadeDate < today
                    const isBugun = vadeDate.toDateString() === today.toDateString()

                    return (
                      <TableRow key={evrak.id} href={`/evraklar/${evrak.id}`}>
                        <TableCell>
                          <span className={
                            isGecikmis
                              ? 'font-medium text-red-600 dark:text-red-400'
                              : isBugun
                              ? 'font-medium text-amber-600 dark:text-amber-400'
                              : ''
                          }>
                            {formatDate(evrak.vade_tarihi)}
                          </span>
                          {isGecikmis && (
                            <Badge color="red" className="ml-2">Gecikmiş</Badge>
                          )}
                          {isBugun && (
                            <Badge color="amber" className="ml-2">Bugün</Badge>
                          )}
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
                        <TableCell className="font-medium text-zinc-900 dark:text-white">
                          {formatCurrency(evrak.tutar)}
                        </TableCell>
                        <TableCell>{evrak.kesideci}</TableCell>
                        <TableCell className="text-zinc-500 dark:text-zinc-400">
                          {evrak.cari_adi || '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-800">
              <ClockIcon className="mx-auto h-12 w-12 text-zinc-400" />
              <Text className="mt-4">
                Önümüzdeki {vadeGun} gün içinde vadesi dolacak evrak bulunmuyor.
              </Text>
            </div>
          )}
        </>
      )}
    </div>
  )

  // ============================================
  // Main Render
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Heading>Raporlar</Heading>
        <Text className="mt-1">Çek ve senet raporları oluşturun, Excel'e aktarın</Text>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-700">
        <nav className="-mb-px flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('tarih-araligi')}
            className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              activeTab === 'tarih-araligi'
                ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
            }`}
          >
            <CalendarDaysIcon className="h-5 w-5" />
            Tarih Aralığı Raporu
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vade')}
            className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              activeTab === 'vade'
                ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
            }`}
          >
            <ClockIcon className="h-5 w-5" />
            Vade Raporu
          </button>
        </nav>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'tarih-araligi' ? renderTarihAraligiRaporu() : renderVadeRaporu()}
    </div>
  )
}

export default RaporlarPage
