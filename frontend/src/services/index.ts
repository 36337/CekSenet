// ============================================
// ÇekSenet - Services Index
// ============================================

// API
export { default as api, getToken, setToken, removeToken, isTokenExpired } from './api'
export type { ApiError } from './api'

// Auth
export { authService, login, logout, getCurrentUser, changePassword, getSetupStatus, initialSetup } from './auth'
export type { SetupData } from './auth'

// Dashboard
export {
  getKartlar,
  getDurumDagilimi,
  getAylikDagilim,
  getSonHareketler,
  getVadeUyarilari,
  getTopCariler,
  formatCurrency,
  formatCurrencyShort,
  formatDate,
  formatDateShort,
  formatDateTime,
  getDurumLabel,
  getEvrakTipiLabel,
} from './dashboard'

// Evraklar
export {
  getEvraklar,
  getEvrak,
  createEvrak,
  updateEvrak,
  deleteEvrak,
  updateEvrakDurum,
  getEvrakHareketler,
  topluDurumGuncelle,
  getGecerliDurumlar,
  isDurumGecerli,
  DURUM_LABELS,
  DURUM_COLORS,
  EVRAK_TIPI_LABELS,
  EVRAK_TIPI_COLORS,
  DURUM_GECISLERI,
} from './evraklar'
export type {
  EvrakTipi,
  EvrakDurumu,
  Evrak,
  EvrakDetay,
  EvrakHareket,
  EvrakFormData,
  EvrakFilters,
  EvrakListResponse,
  DurumUpdateResponse,
  TopluDurumResponse,
} from './evraklar'

// Cariler
export {
  getCariler,
  getCarilerForSelect,
  getCari,
  createCari,
  updateCari,
  deleteCari,
  getCariEvraklar,
  CARI_TIP_LABELS,
  CARI_TIP_COLORS,
} from './cariler'
export type {
  CariTip,
  Cari,
  CariWithStats,
  CariFormData,
  CariFilters,
  CariListResponse,
  CariEvraklarResponse,
} from './cariler'

// Bankalar
export {
  getBankalar,
  getBankalarForSelect,
  getBanka,
  searchBankalar,
  createBanka,
  updateBanka,
  deleteBanka,
  getOrCreateBanka,
} from './bankalar'
export type {
  Banka,
  BankaFormData,
  BankaListResponse,
} from './bankalar'

// Kurlar
export {
  getKurlar,
  getKur,
  getCacheStatus,
  getKurSafe,
  getKurlarSafe,
  formatKurAge,
  formatKurDisplay,
} from './kurlar'
export type {
  KurlarResponse,
  TekKurResponse,
  CacheStatusResponse,
} from './kurlar'

// Users
export {
  getUsers,
  getUser,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser,
  USER_ROLE_LABELS,
  USER_ROLE_COLORS,
} from './users'
export type {
  UserRole,
  User,
  UserFormData,
  UsersListResponse,
} from './users'

// Reports
export {
  getTarihAraligiRaporu,
  getVadeRaporu,
  getCariRaporu,
  getCarilerRaporu,
  downloadExcel,
  exportToExcel,
  formatTarih,
  formatPara,
  getBugun,
  getSonXGun,
  getGelecekXGun,
  getAyBaslangic,
  getAySonu,
} from './reports'
export type {
  TarihAraligiFiltre,
  AdetTutar,
  RaporOzet,
  RaporEvrak,
  TarihAraligiRapor,
  VadeRaporuFiltre,
  GunlukVade,
  VadeRaporu,
  CariRapor,
  CarilerRaporuFiltre,
  CariOzet,
  CarilerRaporu,
} from './reports'

// System
export { getSystemIP, getSystemHealth } from './system'
export type { NetworkInterface, SystemIPInfo } from './system'

// Evrak Fotoğrafları
export {
  getFotograflar,
  uploadFotograflar,
  uploadTekFotograf,
  deleteFotograf,
  hasFotograflar,
  getFotografUrl,
  formatFileSize as formatFotoFileSize,
  formatFileSize, // Geriye uyumluluk için
  isValidImageType,
  isValidFileSize as isValidFotoFileSize,
  isValidFileSize, // Geriye uyumluluk için
  validateFile,
} from './evrakFotograflar'
export type {
  EvrakFotograf,
  FotografListResponse,
  FotografUploadResponse,
  FotografDeleteResponse,
  UploadProgress as FotoUploadProgress,
  UploadProgress, // Geriye uyumluluk için
} from './evrakFotograflar'

// Excel Import
export {
  downloadTemplate,
  parseExcelFile,
  importEvraklar,
  getImportInfo,
  isValidExcelType,
  isValidFileSize as isValidExcelFileSize,
  validateExcelFile,
  formatFileSize as formatExcelFileSize,
  getRowStatus,
  getRowColorClass,
  getRowBadgeColor,
  getRowStatusText,
} from './import'
export type {
  ParsedRow,
  ParseSummary,
  ParseResponse,
  ImportError,
  ImportResult,
  ImportResponse,
  ImportInfo,
  UploadProgress as ImportUploadProgress,
} from './import'

// Krediler
export {
  // API Fonksiyonları - Kredi
  getKrediler,
  getKredi,
  getKrediOzet,
  createKredi,
  updateKredi,
  deleteKredi,
  // API Fonksiyonları - Taksit
  getTaksitler,
  taksitOde,
  taksitIptal,
  erkenOdeme,
  // API Fonksiyonları - Taksit Listeleri
  getBuAyTaksitler,
  getGecikenTaksitler,
  getYaklasanTaksitler,
  // Sabitler
  KREDI_TURU_LABELS,
  KREDI_DURUM_LABELS,
  KREDI_DURUM_COLORS,
  TAKSIT_DURUM_LABELS,
  TAKSIT_DURUM_COLORS,
  PARA_BIRIMI_LABELS,
  PARA_BIRIMI_SYMBOLS,
  // Yardımcı Fonksiyonlar
  hesaplaTaksit,
  hesaplaToplamOdeme,
  hesaplaToplamFaiz,
  formatKrediTutar,
  formatKrediTarih,
  hesaplaIlerleme,
} from './krediler'
export type {
  KrediTuru,
  KrediDurum,
  TaksitDurum,
  ParaBirimi,
  Kredi,
  KrediDetay,
  KrediTaksit,
  KrediOzet,
  KrediFormData,
  KrediUpdateData,
  KrediFilters,
  KrediListResponse,
  KrediGenelOzet,
  TaksitOdemeData,
  TaksitOdemeResponse,
  ErkenOdemeData,
  ErkenOdemeResponse,
  BuAyTaksitlerResponse,
  GecikenTaksitlerResponse,
  YaklasanTaksitlerResponse,
} from './krediler'

// Settings
export {
  settingsService,
  getSettings,
  getSetting,
  updateSettings,
  updateSetting,
  getWhatsAppSettings,
  updateWhatsAppSettings,
} from './settings'
export type {
  SettingValue,
  Settings,
  WhatsAppSettings,
} from './settings'
