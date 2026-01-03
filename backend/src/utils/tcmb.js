/**
 * TCMB Döviz Kuru Utility
 * TCMB'den güncel döviz kurlarını çeker ve cache'ler
 */

const xml2js = require('xml2js');
const logger = require('./logger');

// TCMB XML URL
const TCMB_URL = 'https://www.tcmb.gov.tr/kurlar/today.xml';

// Desteklenen para birimleri
const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF'];

// Cache süresi (1 saat = 3600000 ms)
const CACHE_DURATION = 60 * 60 * 1000;

// Bellekte cache
let kurCache = {
  data: null,
  timestamp: null,
  error: null
};

/**
 * TCMB'den kurları çek ve parse et
 * @returns {Promise<Object>} { USD: number, EUR: number, GBP: number, CHF: number, tarih: string }
 */
async function fetchFromTCMB() {
  try {
    // Node.js 18+ native fetch kullan
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 saniye timeout
    
    const response = await fetch(TCMB_URL, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'CekSenet/1.0',
        'Accept': 'application/xml'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`TCMB HTTP error: ${response.status}`);
    }
    
    const xmlData = await response.text();
    
    // XML'i parse et
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xmlData);
    
    // Tarihi al
    const tarih = result.Tarih_Date?.$.Tarih || new Date().toLocaleDateString('tr-TR');
    
    // Kurları çıkar
    const currencies = result.Tarih_Date?.Currency;
    if (!currencies) {
      throw new Error('TCMB XML formatı beklenenden farklı');
    }
    
    // Array değilse array'e çevir
    const currencyList = Array.isArray(currencies) ? currencies : [currencies];
    
    const kurlar = {
      TRY: 1, // Türk Lirası her zaman 1
      tarih
    };
    
    for (const currency of currencyList) {
      const kod = currency.$.Kod || currency.$.CurrencyCode;
      
      if (SUPPORTED_CURRENCIES.includes(kod)) {
        // ForexBuying değerini al (döviz alış kuru)
        const forexBuying = currency.ForexBuying;
        
        if (forexBuying && forexBuying !== '') {
          // Türkçe ondalık ayracını düzelt ve parse et
          const kur = parseFloat(forexBuying.replace(',', '.'));
          
          if (!isNaN(kur) && kur > 0) {
            kurlar[kod] = kur;
          }
        }
      }
    }
    
    // Tüm kurların alınıp alınmadığını kontrol et
    const missingCurrencies = SUPPORTED_CURRENCIES.filter(c => !kurlar[c]);
    if (missingCurrencies.length > 0) {
      logger.warn('Some currencies missing from TCMB', { missing: missingCurrencies });
    }
    
    return kurlar;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('TCMB bağlantı zaman aşımı (timeout)');
    }
    throw error;
  }
}

/**
 * Kurları getir (cache'den veya TCMB'den)
 * @param {boolean} forceRefresh - Cache'i yoksay ve yeniden çek
 * @returns {Promise<Object>} { kurlar: {...}, cached: boolean, updated_at: string, error?: string }
 */
async function getKurlar(forceRefresh = false) {
  const now = Date.now();
  
  // Cache geçerli mi kontrol et
  const cacheValid = kurCache.data && 
                     kurCache.timestamp && 
                     (now - kurCache.timestamp) < CACHE_DURATION;
  
  // Cache geçerli ve force refresh değilse cache'den dön
  if (cacheValid && !forceRefresh) {
    return {
      kurlar: kurCache.data,
      cached: true,
      updated_at: new Date(kurCache.timestamp).toISOString(),
      cache_expires_at: new Date(kurCache.timestamp + CACHE_DURATION).toISOString()
    };
  }
  
  // TCMB'den çekmeyi dene
  try {
    const kurlar = await fetchFromTCMB();
    
    // Cache'i güncelle
    kurCache = {
      data: kurlar,
      timestamp: now,
      error: null
    };
    
    logger.info('TCMB kurları güncellendi', { 
      tarih: kurlar.tarih,
      USD: kurlar.USD,
      EUR: kurlar.EUR
    });
    
    return {
      kurlar,
      cached: false,
      updated_at: new Date(now).toISOString(),
      cache_expires_at: new Date(now + CACHE_DURATION).toISOString()
    };
    
  } catch (error) {
    logger.error('TCMB kur çekme hatası', { error: error.message });
    
    // Hata durumunda eski cache varsa onu kullan
    if (kurCache.data) {
      logger.warn('TCMB erişilemedi, eski cache kullanılıyor', {
        cacheAge: Math.round((now - kurCache.timestamp) / 1000 / 60) + ' dakika'
      });
      
      return {
        kurlar: kurCache.data,
        cached: true,
        stale: true,
        updated_at: new Date(kurCache.timestamp).toISOString(),
        error: 'TCMB erişilemedi, eski veriler gösteriliyor'
      };
    }
    
    // Hiç cache yoksa varsayılan değerler döndür
    // NOT: Bu değerler sadece acil durum için, güvenilir değil
    const fallbackKurlar = {
      TRY: 1,
      USD: null,
      EUR: null,
      GBP: null,
      CHF: null,
      tarih: null
    };
    
    return {
      kurlar: fallbackKurlar,
      cached: false,
      error: 'TCMB erişilemedi ve cache boş. Kurları manuel girin.',
      unavailable: true
    };
  }
}

/**
 * Tek bir para birimi için kur getir
 * @param {string} paraBirimi - Para birimi kodu (USD, EUR, GBP, CHF)
 * @returns {Promise<number|null>} Kur değeri veya null
 */
async function getKur(paraBirimi) {
  if (paraBirimi === 'TRY') return 1;
  
  const result = await getKurlar();
  return result.kurlar[paraBirimi] || null;
}

/**
 * Cache'i temizle (test için)
 */
function clearCache() {
  kurCache = {
    data: null,
    timestamp: null,
    error: null
  };
}

/**
 * Cache durumunu getir (debug için)
 */
function getCacheStatus() {
  const now = Date.now();
  
  if (!kurCache.timestamp) {
    return { status: 'empty' };
  }
  
  const age = now - kurCache.timestamp;
  const isValid = age < CACHE_DURATION;
  
  return {
    status: isValid ? 'valid' : 'stale',
    age_minutes: Math.round(age / 1000 / 60),
    expires_in_minutes: isValid ? Math.round((CACHE_DURATION - age) / 1000 / 60) : 0,
    data: kurCache.data
  };
}

module.exports = {
  getKurlar,
  getKur,
  clearCache,
  getCacheStatus,
  SUPPORTED_CURRENCIES,
  CACHE_DURATION
};
