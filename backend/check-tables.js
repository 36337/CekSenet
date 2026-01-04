// check-tables.js
// Krediler tablolarını kontrol et

const db = require('./src/models/db');

console.log('Checking tables...\n');

// Tüm tabloları listele
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' 
  ORDER BY name
`).all();

console.log('All tables:');
tables.forEach(t => console.log('  - ' + t.name));

// Krediler tablosu yapısı
console.log('\n\nKrediler table structure:');
try {
  const kredilerInfo = db.prepare(`PRAGMA table_info(krediler)`).all();
  console.table(kredilerInfo);
} catch (e) {
  console.log('  ERROR: ' + e.message);
}

// Kredi taksitler tablosu yapısı
console.log('\n\nKredi_taksitler table structure:');
try {
  const taksitlerInfo = db.prepare(`PRAGMA table_info(kredi_taksitler)`).all();
  console.table(taksitlerInfo);
} catch (e) {
  console.log('  ERROR: ' + e.message);
}

// Index'leri kontrol et
console.log('\n\nIndexes for krediler:');
try {
  const kredilerIdx = db.prepare(`PRAGMA index_list(krediler)`).all();
  console.table(kredilerIdx);
} catch (e) {
  console.log('  ERROR: ' + e.message);
}

console.log('\n\nIndexes for kredi_taksitler:');
try {
  const taksitlerIdx = db.prepare(`PRAGMA index_list(kredi_taksitler)`).all();
  console.table(taksitlerIdx);
} catch (e) {
  console.log('  ERROR: ' + e.message);
}

process.exit(0);
