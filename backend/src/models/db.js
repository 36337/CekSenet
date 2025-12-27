const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Config
const config = require('../utils/config');

// Database dosya yolu
// Eğer absolute path verilmişse direkt kullan, değilse resolve et
const dbPath = path.isAbsolute(config.database.path) 
  ? config.database.path 
  : path.resolve(__dirname, '../../', config.database.path);

// Database klasörünün var olduğundan emin ol
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Database bağlantısı
const db = new Database(dbPath);

// WAL mode (daha iyi performans)
db.pragma('journal_mode = WAL');

// Foreign keys aktif
db.pragma('foreign_keys = ON');

// Busy timeout (eşzamanlı erişim için)
db.pragma('busy_timeout = 5000');

console.log(`✓ Database connected: ${dbPath}`);

module.exports = db;
