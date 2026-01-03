/**
 * Evrak Import Template Oluşturma Script'i
 * Bu script ExcelJS kullanarak profesyonel bir import template'i oluşturur.
 * 
 * Çalıştırma: node scripts/create-template.js
 */

const ExcelJS = require('exceljs');
const path = require('path');

async function createTemplate() {
  const workbook = new ExcelJS.Workbook();
  
  // Workbook özellikleri
  workbook.creator = 'ÇekSenet Sistemi';
  workbook.created = new Date();
  workbook.modified = new Date();
  
  // ============================================
  // SAYFA 1: Evrak Verileri
  // ============================================
  const dataSheet = workbook.addWorksheet('Evrak Verileri', {
    properties: { tabColor: { argb: '4472C4' } }
  });
  
  // Kolon tanımları
  const columns = [
    { header: 'Evrak Tipi *', key: 'evrak_tipi', width: 15 },
    { header: 'Evrak No *', key: 'evrak_no', width: 20 },
    { header: 'Tutar *', key: 'tutar', width: 15 },
    { header: 'Para Birimi', key: 'para_birimi', width: 12 },
    { header: 'Döviz Kuru', key: 'doviz_kuru', width: 12 },
    { header: 'Evrak Tarihi', key: 'evrak_tarihi', width: 15 },
    { header: 'Vade Tarihi *', key: 'vade_tarihi', width: 15 },
    { header: 'Banka Adı', key: 'banka_adi', width: 20 },
    { header: 'Keşideci', key: 'kesideci', width: 25 },
    { header: 'Cari Adı', key: 'cari_adi', width: 25 },
    { header: 'Durum', key: 'durum', width: 12 },
    { header: 'Notlar', key: 'notlar', width: 30 }
  ];
  
  dataSheet.columns = columns;
  
  // Başlık satırı stilleri
  const headerRow = dataSheet.getRow(1);
  headerRow.height = 25;
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4472C4' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Örnek veriler
  const sampleData = [
    {
      evrak_tipi: 'cek',
      evrak_no: 'ÇK-2025-001',
      tutar: 15000,
      para_birimi: 'TRY',
      doviz_kuru: '',
      evrak_tarihi: '01.01.2025',
      vade_tarihi: '15.03.2025',
      banka_adi: 'Garanti BBVA',
      kesideci: 'Ahmet Yılmaz',
      cari_adi: 'ABC Ltd. Şti.',
      durum: 'portfoy',
      notlar: 'Örnek çek kaydı'
    },
    {
      evrak_tipi: 'senet',
      evrak_no: 'SN-2025-001',
      tutar: 25000,
      para_birimi: 'TRY',
      doviz_kuru: '',
      evrak_tarihi: '05.01.2025',
      vade_tarihi: '05.04.2025',
      banka_adi: '',
      kesideci: 'Mehmet Demir',
      cari_adi: 'XYZ Tic. A.Ş.',
      durum: 'portfoy',
      notlar: 'Örnek senet kaydı'
    },
    {
      evrak_tipi: 'cek',
      evrak_no: 'ÇK-2025-002',
      tutar: 5000,
      para_birimi: 'USD',
      doviz_kuru: 35.50,
      evrak_tarihi: '10.01.2025',
      vade_tarihi: '10.02.2025',
      banka_adi: 'İş Bankası',
      kesideci: 'Foreign Trade Co.',
      cari_adi: 'DEF İthalat',
      durum: 'bankada',
      notlar: 'Dövizli çek örneği'
    }
  ];
  
  // Örnek verileri ekle
  sampleData.forEach((data, index) => {
    const row = dataSheet.addRow(data);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'D9D9D9' } },
        left: { style: 'thin', color: { argb: 'D9D9D9' } },
        bottom: { style: 'thin', color: { argb: 'D9D9D9' } },
        right: { style: 'thin', color: { argb: 'D9D9D9' } }
      };
      cell.alignment = { vertical: 'middle' };
    });
    // Alternatif satır renklendirmesi
    if (index % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F2F2F2' }
        };
      });
    }
  });
  
  // Data validation - Evrak Tipi
  dataSheet.dataValidations.add('A2:A1000', {
    type: 'list',
    allowBlank: false,
    formulae: ['"cek,senet"'],
    showErrorMessage: true,
    errorTitle: 'Geçersiz Değer',
    error: 'Lütfen "cek" veya "senet" değerlerinden birini seçin.'
  });
  
  // Data validation - Para Birimi
  dataSheet.dataValidations.add('D2:D1000', {
    type: 'list',
    allowBlank: true,
    formulae: ['"TRY,USD,EUR,GBP,CHF"'],
    showErrorMessage: true,
    errorTitle: 'Geçersiz Değer',
    error: 'Lütfen geçerli bir para birimi seçin (TRY, USD, EUR, GBP, CHF).'
  });
  
  // Data validation - Durum
  dataSheet.dataValidations.add('K2:K1000', {
    type: 'list',
    allowBlank: true,
    formulae: ['"portfoy,bankada,tahsilde,odendi,protestolu,iade"'],
    showErrorMessage: true,
    errorTitle: 'Geçersiz Değer',
    error: 'Lütfen geçerli bir durum seçin.'
  });
  
  // Freeze panes (başlık satırını sabitle)
  dataSheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1, topLeftCell: 'A2', activeCell: 'A2' }
  ];
  
  // ============================================
  // SAYFA 2: Açıklamalar
  // ============================================
  const helpSheet = workbook.addWorksheet('Açıklamalar', {
    properties: { tabColor: { argb: '70AD47' } }
  });
  
  // Başlık
  helpSheet.mergeCells('A1:C1');
  const titleCell = helpSheet.getCell('A1');
  titleCell.value = 'EVRAK IMPORT TEMPLATE KILAVUZU';
  titleCell.font = { bold: true, size: 16, color: { argb: '4472C4' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  helpSheet.getRow(1).height = 30;
  
  // Kolon genişlikleri
  helpSheet.getColumn('A').width = 20;
  helpSheet.getColumn('B').width = 15;
  helpSheet.getColumn('C').width = 60;
  
  // Açıklama başlıkları
  const helpHeaders = helpSheet.addRow(['Alan', 'Zorunlu', 'Açıklama']);
  helpHeaders.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '70AD47' } };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });
  
  // Alan açıklamaları
  const fieldDescriptions = [
    ['Evrak Tipi', 'Evet', 'Evrak türü: "cek" veya "senet" yazın'],
    ['Evrak No', 'Evet', 'Benzersiz evrak numarası (örn: ÇK-2025-001)'],
    ['Tutar', 'Evet', 'Evrak tutarı (sayı olarak, örn: 15000)'],
    ['Para Birimi', 'Hayır', 'TRY, USD, EUR, GBP veya CHF (boş bırakılırsa TRY kabul edilir)'],
    ['Döviz Kuru', 'Koşullu', 'Para birimi TRY dışında ise zorunlu (örn: 35.50)'],
    ['Evrak Tarihi', 'Hayır', 'Evrakın düzenlenme tarihi (GG.AA.YYYY formatında)'],
    ['Vade Tarihi', 'Evet', 'Evrakın vade tarihi (GG.AA.YYYY formatında)'],
    ['Banka Adı', 'Hayır', 'Çekin ait olduğu banka (senet için boş bırakılabilir)'],
    ['Keşideci', 'Hayır', 'Evrakı düzenleyen kişi/firma adı'],
    ['Cari Adı', 'Hayır', 'İlişkili cari hesap adı (sistemde varsa eşleştirilir)'],
    ['Durum', 'Hayır', 'portfoy, bankada, tahsilde, odendi, protestolu, iade (boş = portfoy)'],
    ['Notlar', 'Hayır', 'Ek açıklamalar']
  ];
  
  fieldDescriptions.forEach((desc, index) => {
    const row = helpSheet.addRow(desc);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'D9D9D9' } },
        left: { style: 'thin', color: { argb: 'D9D9D9' } },
        bottom: { style: 'thin', color: { argb: 'D9D9D9' } },
        right: { style: 'thin', color: { argb: 'D9D9D9' } }
      };
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
    // Zorunlu alanları vurgula
    if (desc[1] === 'Evet' || desc[1] === 'Koşullu') {
      row.getCell(2).font = { bold: true, color: { argb: desc[1] === 'Evet' ? 'C00000' : 'ED7D31' } };
    }
    if (index % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } };
      });
    }
  });
  
  // Boş satır
  helpSheet.addRow([]);
  
  // Önemli notlar
  helpSheet.addRow([]);
  const notesTitle = helpSheet.addRow(['ÖNEMLİ NOTLAR']);
  notesTitle.getCell(1).font = { bold: true, size: 12, color: { argb: 'C00000' } };
  
  const notes = [
    '• Zorunlu alanlar (*) işaretlidir ve mutlaka doldurulmalıdır.',
    '• Tarihler GG.AA.YYYY (01.01.2025) veya YYYY-AA-GG (2025-01-01) formatında olmalıdır.',
    '• Tutar alanına sadece sayı yazın, para birimi sembolü koymayın.',
    '• Dövizli evraklarda (USD, EUR, vb.) döviz kuru zorunludur.',
    '• Cari adı sistemde kayıtlıysa otomatik eşleştirilir, yoksa yeni cari oluşturulmaz.',
    '• İlk satır (başlık satırı) silinmemelidir.',
    '• Örnek veriler silinebilir veya üzerine yazılabilir.',
    '• Maksimum 1000 satır desteklenmektedir.'
  ];
  
  notes.forEach((note) => {
    const row = helpSheet.addRow([note]);
    row.getCell(1).alignment = { wrapText: true };
  });
  
  // Dosyayı kaydet
  const outputPath = path.join(__dirname, '../templates/evrak-import-template.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  
  console.log('✅ Template başarıyla oluşturuldu:', outputPath);
}

createTemplate().catch((error) => {
  console.error('❌ Template oluşturulurken hata:', error);
  process.exit(1);
});
