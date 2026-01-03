// ============================================
// ÇekSenet - Evrak Import Sayfası
// Excel'den toplu evrak import
// ============================================

import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui/table'
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  DocumentArrowUpIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  InformationCircleIcon,
} from '@heroicons/react/20/solid'
import {
  downloadTemplate,
  parseExcelFile,
  importEvraklar,
  validateExcelFile,
  formatExcelFileSize,
  getRowBadgeColor,
  getRowStatusText,
  type ParsedRow,
  type ParseSummary,
  type ImportUploadProgress,
} from '@/services'
import { formatDate } from '@/services/dashboard'
import { formatCurrency } from '@/utils/currency'

// ============================================
// Types
// ============================================

type ImportStep = 'template' | 'upload' | 'preview' | 'result'

interface ImportResult {
  basarili: number
  basarisiz: number
  hatalar: Array<{ satir: number; hata: string }>
}

// ============================================
// Step Indicator Component
// ============================================

function StepIndicator({ currentStep }: { currentStep: ImportStep }) {
  const steps = [
    { key: 'template', label: '1. Template', icon: ArrowDownTrayIcon },
    { key: 'upload', label: '2. Yükle', icon: CloudArrowUpIcon },
    { key: 'preview', label: '3. Önizle', icon: DocumentTextIcon },
    { key: 'result', label: '4. Sonuç', icon: CheckCircleIcon },
  ]

  const currentIndex = steps.findIndex(s => s.key === currentStep)

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = step.key === currentStep
          const isCompleted = index < currentIndex

          return (
            <div key={step.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                    isActive
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : isCompleted
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-zinc-300 bg-white text-zinc-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircleIcon className="h-6 w-6" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    isActive
                      ? 'text-blue-600'
                      : isCompleted
                        ? 'text-green-600'
                        : 'text-zinc-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 ${
                    index < currentIndex ? 'bg-green-500' : 'bg-zinc-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// Template Step Component
// ============================================

function TemplateStep({
  onDownload,
  onNext,
  isDownloading,
}: {
  onDownload: () => void
  onNext: () => void
  isDownloading: boolean
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          <ArrowDownTrayIcon className="h-6 w-6" />
        </div>
        <div>
          <Heading level={3}>Template Dosyasını İndirin</Heading>
          <Text className="mt-1">
            Excel import işlemi için önce template dosyasını indirin ve evrak bilgilerinizi bu dosyaya girin.
          </Text>
        </div>
      </div>

      <div className="mb-6 rounded-lg bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <InformationCircleIcon className="h-5 w-5 shrink-0 text-blue-600" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Template dosyası hakkında:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>İlk satır kolon başlıklarını içerir, silmeyin</li>
              <li>Örnek veriler referans için eklenmiştir, silebilirsiniz</li>
              <li>Açıklamalar sayfasında detaylı bilgi bulunmaktadır</li>
              <li>Zorunlu alanlar: Evrak Tipi, Evrak No, Tutar, Vade Tarihi</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <Heading level={4} className="mb-3">Kolon Açıklamaları</Heading>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="py-2 pr-4 text-left font-medium">Kolon</th>
                <th className="py-2 pr-4 text-left font-medium">Zorunlu</th>
                <th className="py-2 text-left font-medium">Açıklama</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              <tr><td className="py-2 pr-4">Evrak Tipi</td><td className="py-2 pr-4"><Badge color="red">Evet</Badge></td><td className="py-2">cek veya senet</td></tr>
              <tr><td className="py-2 pr-4">Evrak No</td><td className="py-2 pr-4"><Badge color="red">Evet</Badge></td><td className="py-2">Benzersiz evrak numarası</td></tr>
              <tr><td className="py-2 pr-4">Tutar</td><td className="py-2 pr-4"><Badge color="red">Evet</Badge></td><td className="py-2">Sayısal değer (örn: 15000)</td></tr>
              <tr><td className="py-2 pr-4">Vade Tarihi</td><td className="py-2 pr-4"><Badge color="red">Evet</Badge></td><td className="py-2">GG.AA.YYYY veya YYYY-AA-GG</td></tr>
              <tr><td className="py-2 pr-4">Para Birimi</td><td className="py-2 pr-4"><Badge color="zinc">Hayır</Badge></td><td className="py-2">TRY, USD, EUR, GBP, CHF (varsayılan: TRY)</td></tr>
              <tr><td className="py-2 pr-4">Döviz Kuru</td><td className="py-2 pr-4"><Badge color="yellow">Koşullu</Badge></td><td className="py-2">TRY dışında zorunlu</td></tr>
              <tr><td className="py-2 pr-4">Evrak Tarihi</td><td className="py-2 pr-4"><Badge color="zinc">Hayır</Badge></td><td className="py-2">Düzenlenme tarihi</td></tr>
              <tr><td className="py-2 pr-4">Banka Adı</td><td className="py-2 pr-4"><Badge color="zinc">Hayır</Badge></td><td className="py-2">Çekler için banka</td></tr>
              <tr><td className="py-2 pr-4">Keşideci</td><td className="py-2 pr-4"><Badge color="zinc">Hayır</Badge></td><td className="py-2">Veren kişi/firma</td></tr>
              <tr><td className="py-2 pr-4">Cari Adı</td><td className="py-2 pr-4"><Badge color="zinc">Hayır</Badge></td><td className="py-2">Sistemdeki cari ile eşleşir</td></tr>
              <tr><td className="py-2 pr-4">Durum</td><td className="py-2 pr-4"><Badge color="zinc">Hayır</Badge></td><td className="py-2">portfoy, bankada, tahsilde, odendi, protestolu, iade</td></tr>
              <tr><td className="py-2 pr-4">Notlar</td><td className="py-2 pr-4"><Badge color="zinc">Hayır</Badge></td><td className="py-2">Ek bilgiler</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-4">
        <Button color="blue" onClick={onDownload} disabled={isDownloading}>
          <ArrowDownTrayIcon className="h-5 w-5" />
          {isDownloading ? 'İndiriliyor...' : 'Template İndir'}
        </Button>
        <Button outline onClick={onNext}>
          Dosya Yüklemeye Geç
        </Button>
      </div>
    </div>
  )
}

// ============================================
// Upload Step Component
// ============================================

function UploadStep({
  onFileSelect,
  onBack,
  isUploading,
  uploadProgress,
  error,
}: {
  onFileSelect: (file: File) => void
  onBack: () => void
  isUploading: boolean
  uploadProgress: number
  error: string | null
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleFile = useCallback((file: File) => {
    setValidationError(null)
    const error = validateExcelFile(file)
    if (error) {
      setValidationError(error)
      setSelectedFile(null)
      return
    }
    setSelectedFile(file)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleUpload = () => {
    if (selectedFile) {
      onFileSelect(selectedFile)
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
          <CloudArrowUpIcon className="h-6 w-6" />
        </div>
        <div>
          <Heading level={3}>Excel Dosyasını Yükleyin</Heading>
          <Text className="mt-1">
            Doldurduğunuz Excel dosyasını yükleyin. Sistem dosyayı analiz edecek ve önizleme gösterecektir.
          </Text>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`mb-6 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : selectedFile
              ? 'border-green-400 bg-green-50'
              : 'border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleInputChange}
          className="hidden"
        />
        
        {selectedFile ? (
          <>
            <DocumentArrowUpIcon className="mb-3 h-12 w-12 text-green-500" />
            <p className="font-medium text-green-700">{selectedFile.name}</p>
            <p className="mt-1 text-sm text-green-600">
              {formatExcelFileSize(selectedFile.size)}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Başka dosya seçmek için tıklayın
            </p>
          </>
        ) : (
          <>
            <CloudArrowUpIcon className="mb-3 h-12 w-12 text-zinc-400" />
            <p className="font-medium text-zinc-700">
              Dosyayı sürükleyip bırakın
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              veya seçmek için tıklayın
            </p>
            <p className="mt-3 text-xs text-zinc-400">
              Desteklenen formatlar: .xlsx, .xls (maks. 5 MB)
            </p>
          </>
        )}
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-700">
            <XCircleIcon className="h-5 w-5" />
            <span>{validationError}</span>
          </div>
        </div>
      )}

      {/* Upload Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-700">
            <XCircleIcon className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-zinc-600">Yükleniyor...</span>
            <span className="font-medium text-zinc-900">{uploadProgress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <Button outline onClick={onBack} disabled={isUploading}>
          <ArrowLeftIcon className="h-5 w-5" />
          Geri
        </Button>
        <Button
          color="blue"
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? (
            <>
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
              Analiz Ediliyor...
            </>
          ) : (
            <>
              <DocumentArrowUpIcon className="h-5 w-5" />
              Yükle ve Analiz Et
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// ============================================
// Preview Step Component
// ============================================

function PreviewStep({
  rows,
  summary,
  selectedRows,
  onToggleRow,
  onToggleAll,
  onSelectValid,
  onImport,
  onBack,
  isImporting,
}: {
  rows: ParsedRow[]
  summary: ParseSummary
  selectedRows: Set<number>
  onToggleRow: (satir: number) => void
  onToggleAll: () => void
  onSelectValid: () => void
  onImport: () => void
  onBack: () => void
  isImporting: boolean
}) {
  const validRows = rows.filter(r => r.gecerli)
  const selectedValidCount = rows.filter(
    r => r.gecerli && selectedRows.has(r.satir)
  ).length

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <DocumentTextIcon className="h-6 w-6" />
        </div>
        <div>
          <Heading level={3}>Önizleme</Heading>
          <Text className="mt-1">
            Verilerinizi kontrol edin. Hatalı satırları düzelterek tekrar yükleyebilir veya geçerli olanları import edebilirsiniz.
          </Text>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg bg-zinc-100 p-4 text-center">
          <p className="text-2xl font-bold text-zinc-900">{summary.toplam}</p>
          <p className="text-sm text-zinc-600">Toplam Satır</p>
        </div>
        <div className="rounded-lg bg-green-100 p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{summary.gecerli}</p>
          <p className="text-sm text-green-600">Geçerli</p>
        </div>
        <div className="rounded-lg bg-yellow-100 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">{summary.uyarili}</p>
          <p className="text-sm text-yellow-600">Uyarılı</p>
        </div>
        <div className="rounded-lg bg-red-100 p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{summary.hatali}</p>
          <p className="text-sm text-red-600">Hatalı</p>
        </div>
      </div>

      {/* Selection Buttons */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button outline onClick={onToggleAll}>
          {selectedRows.size === rows.length ? 'Hiçbirini Seçme' : 'Tümünü Seç'}
        </Button>
        <Button outline onClick={onSelectValid}>
          Geçerli Olanları Seç ({validRows.length})
        </Button>
        <span className="ml-auto text-sm text-zinc-600">
          {selectedValidCount} geçerli satır seçili
        </span>
      </div>

      {/* Preview Table */}
      <div className="mb-6 overflow-x-auto rounded-lg border border-zinc-200">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader className="w-12">
                <Checkbox
                  checked={selectedRows.size === rows.length}
                  onChange={onToggleAll}
                />
              </TableHeader>
              <TableHeader className="w-16">Satır</TableHeader>
              <TableHeader className="w-24">Durum</TableHeader>
              <TableHeader>Evrak No</TableHeader>
              <TableHeader>Tip</TableHeader>
              <TableHeader className="text-right">Tutar</TableHeader>
              <TableHeader>Vade</TableHeader>
              <TableHeader>Cari</TableHeader>
              <TableHeader>Hata/Uyarı</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(row => (
              <TableRow
                key={row.satir}
                className={
                  !row.gecerli
                    ? 'bg-red-50'
                    : row.uyarilar.length > 0
                      ? 'bg-yellow-50'
                      : 'bg-green-50'
                }
              >
                <TableCell>
                  <Checkbox
                    checked={selectedRows.has(row.satir)}
                    onChange={() => onToggleRow(row.satir)}
                    disabled={!row.gecerli}
                  />
                </TableCell>
                <TableCell className="font-medium">{row.satir}</TableCell>
                <TableCell>
                  <Badge color={getRowBadgeColor(row)}>
                    {getRowStatusText(row)}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {row.evrak_no || '-'}
                </TableCell>
                <TableCell>
                  {row.evrak_tipi === 'cek'
                    ? 'Çek'
                    : row.evrak_tipi === 'senet'
                      ? 'Senet'
                      : row.evrak_tipi || '-'}
                </TableCell>
                <TableCell className="text-right">
                  {row.tutar ? formatCurrency(row.tutar, row.para_birimi) : '-'}
                </TableCell>
                <TableCell>
                  {row.vade_tarihi ? formatDate(row.vade_tarihi) : '-'}
                </TableCell>
                <TableCell>{row.cari_adi || '-'}</TableCell>
                <TableCell className="max-w-xs">
                  {row.hatalar.length > 0 && (
                    <div className="flex items-start gap-1 text-sm text-red-600">
                      <XCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{row.hatalar.join(', ')}</span>
                    </div>
                  )}
                  {row.uyarilar.length > 0 && (
                    <div className="flex items-start gap-1 text-sm text-yellow-600">
                      <ExclamationTriangleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{row.uyarilar.join(', ')}</span>
                    </div>
                  )}
                  {row.hatalar.length === 0 && row.uyarilar.length === 0 && (
                    <span className="text-sm text-green-600">Hazır</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button outline onClick={onBack} disabled={isImporting}>
          <ArrowLeftIcon className="h-5 w-5" />
          Farklı Dosya Yükle
        </Button>
        <Button
          color="blue"
          onClick={onImport}
          disabled={selectedValidCount === 0 || isImporting}
        >
          {isImporting ? (
            <>
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
              Import Ediliyor...
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-5 w-5" />
              {selectedValidCount} Evrak Import Et
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// ============================================
// Result Step Component
// ============================================

function ResultStep({
  result,
  onNewImport,
  onGoToList,
}: {
  result: ImportResult
  onNewImport: () => void
  onGoToList: () => void
}) {
  const hasErrors = result.basarisiz > 0

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <div className="mb-6 flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
            hasErrors
              ? 'bg-yellow-100 text-yellow-600'
              : 'bg-green-100 text-green-600'
          }`}
        >
          {hasErrors ? (
            <ExclamationTriangleIcon className="h-6 w-6" />
          ) : (
            <CheckCircleIcon className="h-6 w-6" />
          )}
        </div>
        <div>
          <Heading level={3}>
            {hasErrors ? 'Import Kısmen Tamamlandı' : 'Import Başarılı!'}
          </Heading>
          <Text className="mt-1">
            {hasErrors
              ? 'Bazı evraklar import edilemedi. Detayları aşağıda görebilirsiniz.'
              : 'Tüm evraklar başarıyla sisteme eklendi.'}
          </Text>
        </div>
      </div>

      {/* Result Summary */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-green-100 p-4 text-center">
          <p className="text-3xl font-bold text-green-700">{result.basarili}</p>
          <p className="text-sm text-green-600">Başarılı</p>
        </div>
        <div className="rounded-lg bg-red-100 p-4 text-center">
          <p className="text-3xl font-bold text-red-700">{result.basarisiz}</p>
          <p className="text-sm text-red-600">Başarısız</p>
        </div>
      </div>

      {/* Errors Detail */}
      {result.hatalar.length > 0 && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <Heading level={4} className="mb-3 text-red-700">
            Hata Detayları
          </Heading>
          <ul className="space-y-2">
            {result.hatalar.map((hata, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-red-600">
                <XCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Satır {hata.satir}:</strong> {hata.hata}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button outline onClick={onNewImport}>
          <DocumentArrowUpIcon className="h-5 w-5" />
          Yeni Import
        </Button>
        <Button color="blue" onClick={onGoToList}>
          <ArrowLeftIcon className="h-5 w-5" />
          Evrak Listesine Git
        </Button>
      </div>
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export function EvrakImportPage() {
  const navigate = useNavigate()

  // Step state
  const [currentStep, setCurrentStep] = useState<ImportStep>('template')

  // Template step state
  const [isDownloading, setIsDownloading] = useState(false)

  // Upload step state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Preview step state
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [parseSummary, setParseSummary] = useState<ParseSummary | null>(null)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())

  // Import step state
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  // ============================================
  // Handlers
  // ============================================

  const handleDownloadTemplate = async () => {
    setIsDownloading(true)
    try {
      await downloadTemplate()
    } catch (err: any) {
      console.error('Template indirme hatası:', err)
      alert(err?.message || 'Template indirilemedi')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleFileSelect = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)
    setUploadError(null)

    try {
      const result = await parseExcelFile(file, (progress: ImportUploadProgress) => {
        setUploadProgress(progress.percent)
      })

      if (!result.success) {
        setUploadError(result.error || 'Dosya işlenemedi')
        return
      }

      setParsedRows(result.data)
      setParseSummary(result.ozet)

      // Varsayılan olarak geçerli satırları seç
      const validRowNumbers = new Set(
        result.data.filter(r => r.gecerli).map(r => r.satir)
      )
      setSelectedRows(validRowNumbers)

      setCurrentStep('preview')
    } catch (err: any) {
      setUploadError(err?.message || 'Dosya yüklenirken bir hata oluştu')
    } finally {
      setIsUploading(false)
    }
  }

  const handleToggleRow = (satir: number) => {
    setSelectedRows(prev => {
      const next = new Set(prev)
      if (next.has(satir)) {
        next.delete(satir)
      } else {
        next.add(satir)
      }
      return next
    })
  }

  const handleToggleAll = () => {
    if (selectedRows.size === parsedRows.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(parsedRows.map(r => r.satir)))
    }
  }

  const handleSelectValid = () => {
    const validRowNumbers = new Set(
      parsedRows.filter(r => r.gecerli).map(r => r.satir)
    )
    setSelectedRows(validRowNumbers)
  }

  const handleImport = async () => {
    setIsImporting(true)

    try {
      // Seçili ve geçerli satırları filtrele
      const rowsToImport = parsedRows.filter(
        r => r.gecerli && selectedRows.has(r.satir)
      )

      const result = await importEvraklar(rowsToImport)

      setImportResult(result.sonuc)
      setCurrentStep('result')
    } catch (err: any) {
      alert(err?.message || 'Import işlemi başarısız oldu')
    } finally {
      setIsImporting(false)
    }
  }

  const handleNewImport = () => {
    // Reset all state
    setCurrentStep('template')
    setParsedRows([])
    setParseSummary(null)
    setSelectedRows(new Set())
    setImportResult(null)
    setUploadError(null)
  }

  // ============================================
  // Render
  // ============================================

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button plain onClick={() => navigate('/evraklar')} className="mb-4">
          <ArrowLeftIcon className="h-5 w-5" />
          Evraklara Dön
        </Button>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
            <DocumentArrowUpIcon className="h-6 w-6" />
          </div>
          <div>
            <Heading>Excel Import</Heading>
            <Text className="mt-1">Excel dosyasından toplu evrak ekleyin</Text>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Step Content */}
      {currentStep === 'template' && (
        <TemplateStep
          onDownload={handleDownloadTemplate}
          onNext={() => setCurrentStep('upload')}
          isDownloading={isDownloading}
        />
      )}

      {currentStep === 'upload' && (
        <UploadStep
          onFileSelect={handleFileSelect}
          onBack={() => setCurrentStep('template')}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          error={uploadError}
        />
      )}

      {currentStep === 'preview' && parseSummary && (
        <PreviewStep
          rows={parsedRows}
          summary={parseSummary}
          selectedRows={selectedRows}
          onToggleRow={handleToggleRow}
          onToggleAll={handleToggleAll}
          onSelectValid={handleSelectValid}
          onImport={handleImport}
          onBack={() => setCurrentStep('upload')}
          isImporting={isImporting}
        />
      )}

      {currentStep === 'result' && importResult && (
        <ResultStep
          result={importResult}
          onNewImport={handleNewImport}
          onGoToList={() => navigate('/evraklar')}
        />
      )}
    </div>
  )
}

export default EvrakImportPage
