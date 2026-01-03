/**
 * Excel Parser Utility
 * Excel dosyasını parse eder, validate eder ve JSON formatına çevirir.
 */

const ExcelJS = require('exceljs');
const db = require('../models/db');

// ============================================
// SABİTLER
// ============================================

const GECERLI_EVRAK_TIPLERI = ['cek', 'senet'];
const GECERLI_PARA_BIRIMLERI = ['TRY', 'USD', 'EUR', 'GBP', 'CHF'];
const GECERLI_DURUMLAR = ['portfoy', 'bankada', 'ciro', 'tahsil', 'karsiliksiz'];

// Kolon mapping (Excel header -> DB field)
const KOLON_MAPPING = {
  'evrak tipi': 'evrak_tipi',
  'evrak tipi *': 'evrak_tipi',
  'evrak no': 'evrak_no',
  'evrak no *': 'evrak_no',
  'tutar': 'tutar',
  'tutar *': 'tutar',
  'para birimi': 'para_birimi',
  'döviz kuru': 'doviz_kuru',
  'doviz kuru': 'doviz_kuru',
  'evrak tarihi': 'evrak_tarihi',
  'vade tarihi': 'vade_tarihi',
  'vade tarihi *': 'vade_tarihi',
  'banka adı': 'banka_adi',
  'banka adi': 'banka_adi',
  'keşideci': 'kesideci',
  'kesideci': 'kesideci',
  'cari adı': 'cari_adi',
  'cari adi': 'cari_adi',
  'durum': 'durum',
  'notlar': 'notlar'
};

// ============================================
// TARİH FONKSİYONLARI
// ============================================

/**
 * Excel serial date'i JS Date'e çevir
 * Excel'de tarihler 1900-01-01'den itibaren gün sayısı olarak saklanır
 * @param {number} serial - Excel serial date
 * @returns {Date|null}
 */
function excelSerialToDate(serial) {
  if (typeof serial !== 'number' || serial < 1) return null;
  
  // Excel'in 1900 bug'ı için düzeltme (Excel 1900'ü artık yıl sanıyor)
  const excelEpoch = new Date(1899, 11, 30);
  const date = new Date(excelEpoch.getTime() + serial * 86400000);
  
  // Geçerli tarih kontrolü
  if (isNaN(date.getTime())) return null;
  
  return date;
}

/**
 * Türkçe tarih formatını (GG.AA.YYYY) parse et
 * @param {string} dateStr - Tarih string'i
 * @returns {Date|null}
 */
function parseTurkishDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  // GG.AA.YYYY formatı
  const turkishMatch = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (turkishMatch) {
    const [, day, month, year] = turkishMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) return date;
  }
  
  // GG/AA/YYYY formatı
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) return date;
  }
  
  return null;
}

/**
 * ISO tarih formatını (YYYY-MM-DD) parse et
 * @param {string} dateStr - Tarih string'i
 * @returns {Date|null}
 */
function parseISODate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) return date;
  }
  
  return null;
}

/**
 * Herhangi bir tarih formatını parse et ve ISO string'e çevir
 * @param {any} value - Tarih değeri (string, number, Date)
 * @returns {string|null} ISO format (YYYY-MM-DD) veya null
 */
function parseDate(value) {
  if (!value) return null;
  
  let date = null;
  
  // Zaten Date objesi
  if (value instanceof Date) {
    date = value;
  }
  // Excel serial date (sayı)
  else if (typeof value === 'number') {
    date = excelSerialToDate(value);
  }
  // String formatları
  else if (typeof value === 'string') {
    const trimmed = value.trim();
    
    // Önce Türkçe format dene
    date = parseTurkishDate(trimmed);
    
    // Sonra ISO format dene
    if (!date) {
      date = parseISODate(trimmed);
    }
    
    // En son native Date parse dene
    if (!date) {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        date = parsed;
      }
    }
  }
  
  // ISO string'e çevir
  if (date && !isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  return null;
}

// ============================================
// YARDIMCI FONKSİYONLAR
// ============================================

/**
 * Hücre değerini temiz string'e çevir
 * @param {any} value - Hücre değeri
 * @returns {string}
 */
function cleanCellValue(value) {
  if (value === null || value === undefined) return '';
  
  // ExcelJS richText objesi
  if (typeof value === 'object' && value.richText) {
    return value.richText.map(r => r.text || '').join('').trim();
  }
  
  // ExcelJS formula sonucu
  if (typeof value === 'object' && value.result !== undefined) {
    return String(value.result).trim();
  }
  
  return String(value).trim();
}

/**
 * Tutar değerini parse et
 * @param {any} value - Tutar değeri
 * @returns {number|null}
 */
function parseAmount(value) {
  if (value === null || value === undefined || value === '') return null;
  
  // Zaten sayı
  if (typeof value === 'number') {
    return value > 0 ? value : null;
  }
  
  // String'den parse et
  if (typeof value === 'string') {
    // Binlik ayracı ve para birimi sembollerini temizle
    const cleaned = value
      .replace(/[₺$€£¥]/g, '')     // Para birimi sembolleri
      .replace(/\s/g, '')           // Boşluklar
      .replace(/\./g, '')           // Binlik ayracı (Türkçe)
      .replace(/,/g, '.');          // Ondalık ayracı (Türkçe -> standart)
    
    const num = parseFloat(cleaned);
    return !isNaN(num) && num > 0 ? num : null;
  }
  
  return null;
}

/**
 * Cari adına göre cari ID bul
 * @param {string} cariAdi - Cari adı
 * @returns {number|null}
 */
function findCariByName(cariAdi) {
  if (!cariAdi) return null;
  
  const cari = db.prepare(`
    SELECT id FROM cariler 
    WHERE LOWER(ad_soyad) = LOWER(?)
    LIMIT 1
  `).get(cariAdi.trim());
  
  return cari ? cari.id : null;
}

/**
 * Evrak no'nun zaten var olup olmadığını kontrol et
 * @param {string} evrakNo - Evrak numarası
 * @returns {boolean}
 */
function isEvrakNoExists(evrakNo) {
  if (!evrakNo) return false;
  
  const evrak = db.prepare(`
    SELECT id FROM evraklar 
    WHERE evrak_no = ?
    LIMIT 1
  `).get(evrakNo.trim());
  
  return !!evrak;
}

// ============================================
// SATIR VALIDATION
// ============================================

/**
 * Tek bir satırı validate et
 * @param {Object} row - Parse edilmiş satır verisi
 * @param {number} rowIndex - Satır numarası (1-indexed, başlık dahil)
 * @returns {Object} { hatalar: [], uyarilar: [], gecerli: boolean }
 */
function validateRow(row, rowIndex) {
  const hatalar = [];
  const uyarilar = [];
  
  // ----- ZORUNLU ALANLAR -----
  
  // Evrak tipi
  if (!row.evrak_tipi) {
    hatalar.push('Evrak tipi zorunludur');
  } else {
    const tip = row.evrak_tipi.toLowerCase().trim();
    if (!GECERLI_EVRAK_TIPLERI.includes(tip)) {
      hatalar.push(`Geçersiz evrak tipi: "${row.evrak_tipi}". Geçerli değerler: ${GECERLI_EVRAK_TIPLERI.join(', ')}`);
    } else {
      row.evrak_tipi = tip;
    }
  }
  
  // Evrak no
  if (!row.evrak_no) {
    hatalar.push('Evrak no zorunludur');
  } else {
    row.evrak_no = row.evrak_no.trim();
    if (row.evrak_no.length > 50) {
      hatalar.push('Evrak no en fazla 50 karakter olabilir');
    }
    // Duplicate kontrolü
    if (isEvrakNoExists(row.evrak_no)) {
      uyarilar.push(`Evrak no "${row.evrak_no}" sistemde zaten mevcut`);
    }
  }
  
  // Tutar
  const tutar = parseAmount(row.tutar);
  if (tutar === null) {
    hatalar.push('Tutar zorunludur ve pozitif bir sayı olmalıdır');
  } else {
    row.tutar = tutar;
  }
  
  // Vade tarihi
  const vadeTarihi = parseDate(row.vade_tarihi);
  if (!vadeTarihi) {
    hatalar.push('Vade tarihi zorunludur (GG.AA.YYYY veya YYYY-MM-DD formatında)');
  } else {
    row.vade_tarihi = vadeTarihi;
  }
  
  // ----- OPSİYONEL ALANLAR -----
  
  // Para birimi
  if (row.para_birimi) {
    const paraBirimi = row.para_birimi.toUpperCase().trim();
    if (!GECERLI_PARA_BIRIMLERI.includes(paraBirimi)) {
      hatalar.push(`Geçersiz para birimi: "${row.para_birimi}". Geçerli değerler: ${GECERLI_PARA_BIRIMLERI.join(', ')}`);
    } else {
      row.para_birimi = paraBirimi;
    }
  } else {
    row.para_birimi = 'TRY';
  }
  
  // Döviz kuru (TRY dışında zorunlu)
  if (row.para_birimi && row.para_birimi !== 'TRY') {
    const dovizKuru = parseAmount(row.doviz_kuru);
    if (dovizKuru === null) {
      hatalar.push(`${row.para_birimi} para birimi için döviz kuru zorunludur`);
    } else {
      row.doviz_kuru = dovizKuru;
    }
  } else {
    row.doviz_kuru = null;
  }
  
  // Evrak tarihi
  if (row.evrak_tarihi) {
    const evrakTarihi = parseDate(row.evrak_tarihi);
    if (!evrakTarihi) {
      uyarilar.push('Evrak tarihi geçersiz format, atlandı');
      row.evrak_tarihi = null;
    } else {
      row.evrak_tarihi = evrakTarihi;
    }
  } else {
    row.evrak_tarihi = null;
  }
  
  // Durum
  if (row.durum) {
    const durum = row.durum.toLowerCase().trim();
    if (!GECERLI_DURUMLAR.includes(durum)) {
      uyarilar.push(`Geçersiz durum: "${row.durum}". "portfoy" olarak ayarlandı`);
      row.durum = 'portfoy';
    } else {
      row.durum = durum;
    }
  } else {
    row.durum = 'portfoy';
  }
  
  // Banka adı
  if (row.banka_adi) {
    row.banka_adi = row.banka_adi.trim();
    if (row.banka_adi.length > 100) {
      uyarilar.push('Banka adı 100 karaktere kısaltıldı');
      row.banka_adi = row.banka_adi.substring(0, 100);
    }
  } else {
    row.banka_adi = null;
  }
  
  // Keşideci
  if (row.kesideci) {
    row.kesideci = row.kesideci.trim();
    if (row.kesideci.length > 200) {
      uyarilar.push('Keşideci 200 karaktere kısaltıldı');
      row.kesideci = row.kesideci.substring(0, 200);
    }
  } else {
    row.kesideci = null;
  }
  
  // Cari eşleştirme
  if (row.cari_adi) {
    row.cari_adi = row.cari_adi.trim();
    const cariId = findCariByName(row.cari_adi);
    if (cariId) {
      row.cari_id = cariId;
    } else {
      uyarilar.push(`Cari "${row.cari_adi}" sistemde bulunamadı, cariye bağlanmayacak`);
      row.cari_id = null;
    }
  } else {
    row.cari_id = null;
  }
  
  // Notlar
  if (row.notlar) {
    row.notlar = row.notlar.trim();
    if (row.notlar.length > 1000) {
      uyarilar.push('Notlar 1000 karaktere kısaltıldı');
      row.notlar = row.notlar.substring(0, 1000);
    }
  } else {
    row.notlar = null;
  }
  
  return {
    hatalar,
    uyarilar,
    gecerli: hatalar.length === 0
  };
}

// ============================================
// ANA PARSE FONKSİYONU
// ============================================

/**
 * Excel dosyasını parse et ve validate et
 * @param {string} filePath - Excel dosyasının yolu
 * @returns {Promise<Object>} Parse sonucu
 */
async function parseExcelFile(filePath) {
  const workbook = new ExcelJS.Workbook();
  
  try {
    await workbook.xlsx.readFile(filePath);
  } catch (error) {
    throw new Error(`Excel dosyası okunamadı: ${error.message}`);
  }
  
  // İlk sayfayı al (Evrak Verileri)
  const worksheet = workbook.getWorksheet(1);
  
  if (!worksheet) {
    throw new Error('Excel dosyasında sayfa bulunamadı');
  }
  
  const rows = [];
  let headerRow = null;
  let headerMapping = {};
  
  // Satırları işle
  worksheet.eachRow((row, rowNumber) => {
    // İlk satır header
    if (rowNumber === 1) {
      headerRow = row;
      
      // Header mapping oluştur
      row.eachCell((cell, colNumber) => {
        const headerValue = cleanCellValue(cell.value).toLowerCase();
        const mappedField = KOLON_MAPPING[headerValue];
        
        if (mappedField) {
          headerMapping[colNumber] = mappedField;
        }
      });
      
      // Zorunlu kolonların varlığını kontrol et
      const zorunluKolonlar = ['evrak_tipi', 'evrak_no', 'tutar', 'vade_tarihi'];
      const mevcutKolonlar = Object.values(headerMapping);
      const eksikKolonlar = zorunluKolonlar.filter(k => !mevcutKolonlar.includes(k));
      
      if (eksikKolonlar.length > 0) {
        throw new Error(`Eksik zorunlu kolonlar: ${eksikKolonlar.join(', ')}`);
      }
      
      return;
    }
    
    // Boş satırları atla
    let isEmpty = true;
    row.eachCell((cell) => {
      if (cleanCellValue(cell.value)) {
        isEmpty = false;
      }
    });
    
    if (isEmpty) return;
    
    // Satır verisini oluştur
    const rowData = {
      satir: rowNumber
    };
    
    row.eachCell((cell, colNumber) => {
      const field = headerMapping[colNumber];
      if (field) {
        // Tarih alanları için özel işlem
        if (field === 'evrak_tarihi' || field === 'vade_tarihi') {
          rowData[field] = cell.value; // Ham değeri sakla, sonra parse edilecek
        } else {
          rowData[field] = cleanCellValue(cell.value);
        }
      }
    });
    
    // Satırı validate et
    const validation = validateRow(rowData, rowNumber);
    
    rows.push({
      ...rowData,
      hatalar: validation.hatalar,
      uyarilar: validation.uyarilar,
      gecerli: validation.gecerli
    });
  });
  
  // Boş dosya kontrolü
  if (rows.length === 0) {
    throw new Error('Excel dosyasında veri bulunamadı (sadece başlık satırı var)');
  }
  
  // Özet hesapla
  const ozet = {
    toplam: rows.length,
    gecerli: rows.filter(r => r.gecerli).length,
    hatali: rows.filter(r => !r.gecerli).length,
    uyarili: rows.filter(r => r.uyarilar.length > 0).length
  };
  
  return {
    success: true,
    data: rows,
    ozet
  };
}

// ============================================
// EXPORT
// ============================================

module.exports = {
  parseExcelFile,
  validateRow,
  parseDate,
  parseAmount,
  findCariByName,
  isEvrakNoExists,
  GECERLI_EVRAK_TIPLERI,
  GECERLI_PARA_BIRIMLERI,
  GECERLI_DURUMLAR
};
