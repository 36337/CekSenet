/**
 * Currency Utility
 * Para birimi sabitleri ve format fonksiyonları
 */

// Para birimi tipi
export interface ParaBirimi {
  kod: string;
  isim: string;
  sembol: string;
}

// Para birimleri sabitleri
export const PARA_BIRIMLERI: Record<string, ParaBirimi> = {
  TRY: { kod: 'TRY', isim: 'Türk Lirası', sembol: '₺' },
  USD: { kod: 'USD', isim: 'Amerikan Doları', sembol: '$' },
  EUR: { kod: 'EUR', isim: 'Euro', sembol: '€' },
  GBP: { kod: 'GBP', isim: 'İngiliz Sterlini', sembol: '£' },
  CHF: { kod: 'CHF', isim: 'İsviçre Frangı', sembol: 'CHF' }
};

// Geçerli para birimi kodları
export const GECERLI_PARA_BIRIMLERI = Object.keys(PARA_BIRIMLERI);

// Select/Dropdown için para birimi listesi
export const PARA_BIRIMI_OPTIONS = Object.values(PARA_BIRIMLERI).map(pb => ({
  value: pb.kod,
  label: `${pb.sembol} - ${pb.isim}`
}));

/**
 * Para birimi sembolünü getir
 * @param paraBirimi - Para birimi kodu (TRY, USD, EUR, GBP, CHF)
 * @returns Sembol (₺, $, €, £, CHF)
 */
export function getCurrencySymbol(paraBirimi: string = 'TRY'): string {
  return PARA_BIRIMLERI[paraBirimi]?.sembol || '₺';
}

/**
 * Para birimi adını getir
 * @param paraBirimi - Para birimi kodu
 * @returns İsim (Türk Lirası, Amerikan Doları, vb.)
 */
export function getCurrencyName(paraBirimi: string = 'TRY'): string {
  return PARA_BIRIMLERI[paraBirimi]?.isim || 'Türk Lirası';
}

/**
 * Tutarı para birimi sembolü ile formatla
 * @param tutar - Sayısal tutar
 * @param paraBirimi - Para birimi kodu (default: TRY)
 * @returns Formatlı string (₺10.000,00 veya $1.000,00)
 */
export function formatCurrency(tutar: number | null | undefined, paraBirimi: string = 'TRY'): string {
  if (tutar === null || tutar === undefined) return '-';
  
  const pb = PARA_BIRIMLERI[paraBirimi] || PARA_BIRIMLERI.TRY;
  const formatted = tutar.toLocaleString('tr-TR', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  });
  
  return `${pb.sembol}${formatted}`;
}

/**
 * Döviz tutarını TRY karşılığı ile birlikte göster
 * @param tutar - Döviz tutarı
 * @param paraBirimi - Para birimi kodu
 * @param kur - Döviz kuru (TRY karşılığı)
 * @returns Formatlı string ($1.000,00 ≈ ₺35.500,00)
 */
export function formatWithTRY(
  tutar: number | null | undefined, 
  paraBirimi: string = 'TRY', 
  kur: number | null | undefined
): string {
  if (tutar === null || tutar === undefined) return '-';
  
  const formattedTutar = formatCurrency(tutar, paraBirimi);
  
  // TRY ise direkt döndür
  if (paraBirimi === 'TRY') {
    return formattedTutar;
  }
  
  // Kur varsa TRY karşılığını da göster
  if (kur && kur > 0) {
    const tryTutar = tutar * kur;
    const formattedTry = formatCurrency(tryTutar, 'TRY');
    return `${formattedTutar} ≈ ${formattedTry}`;
  }
  
  return formattedTutar;
}

/**
 * Döviz kurunu formatla
 * @param kur - Kur değeri
 * @param paraBirimi - Para birimi kodu
 * @returns Formatlı string (1 USD = ₺35,50)
 */
export function formatExchangeRate(kur: number | null | undefined, paraBirimi: string): string {
  if (!kur || paraBirimi === 'TRY') return '-';
  
  const formattedKur = kur.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  });
  
  const sembol = getCurrencySymbol(paraBirimi);
  return `1 ${sembol} = ₺${formattedKur}`;
}

/**
 * Para birimi TRY mi kontrol et
 * @param paraBirimi - Para birimi kodu
 * @returns boolean
 */
export function isTRY(paraBirimi: string | null | undefined): boolean {
  return !paraBirimi || paraBirimi === 'TRY';
}

/**
 * Para birimi geçerli mi kontrol et
 * @param paraBirimi - Para birimi kodu
 * @returns boolean
 */
export function isValidCurrency(paraBirimi: string): boolean {
  return GECERLI_PARA_BIRIMLERI.includes(paraBirimi);
}
