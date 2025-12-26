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
