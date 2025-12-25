const fs = require('fs');
const path = require('path');
const db = require('./models/db');
const logger = require('./utils/logger');

const migrationsDir = path.resolve(__dirname, '../database/migrations');

/**
 * Migration sistemini çalıştır
 */
function runMigrations() {
  logger.info('Running database migrations...');
  console.log('\n📦 Running database migrations...\n');
  
  // 1. db_migrations tablosunu oluştur (yoksa)
  db.exec(`
    CREATE TABLE IF NOT EXISTS db_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version TEXT NOT NULL UNIQUE,
      description TEXT,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // 2. Uygulanmış migration'ları al
  const applied = db.prepare('SELECT version FROM db_migrations').all();
  const appliedVersions = new Set(applied.map(m => m.version));
  
  // 3. Migration dosyalarını oku
  if (!fs.existsSync(migrationsDir)) {
    logger.warn('No migrations directory found');
    console.log('⚠ No migrations directory found');
    return;
  }
  
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // Alfabetik sırala (001, 002, ...)
  
  if (files.length === 0) {
    logger.warn('No migration files found');
    console.log('⚠ No migration files found');
    return;
  }
  
  // 4. Yeni migration'ları uygula
  let appliedCount = 0;
  
  for (const file of files) {
    const version = file.replace('.sql', '');
    
    if (appliedVersions.has(version)) {
      console.log(`  ✓ ${version} (already applied)`);
      continue;
    }
    
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Description'ı SQL'den çıkar (-- Description: ...)
    const descMatch = sql.match(/--\s*Description:\s*(.+)/i);
    const description = descMatch ? descMatch[1].trim() : null;
    
    try {
      // Transaction içinde çalıştır
      db.transaction(() => {
        // SQL'i çalıştır
        db.exec(sql);
        
        // Migration'ı kaydet
        db.prepare(`
          INSERT INTO db_migrations (version, description)
          VALUES (?, ?)
        `).run(version, description);
      })();
      
      logger.info(`Migration applied: ${version}`, { description });
      console.log(`  ✅ ${version} applied${description ? `: ${description}` : ''}`);
      appliedCount++;
      
    } catch (error) {
      logger.error(`Migration failed: ${version}`, { error: error.message });
      console.error(`  ❌ ${version} FAILED:`, error.message);
      throw error; // Uygulama başlamasın
    }
  }
  
  if (appliedCount > 0) {
    logger.info(`${appliedCount} migration(s) applied successfully`);
    console.log(`\n✓ ${appliedCount} migration(s) applied successfully\n`);
  } else {
    logger.info('Database is up to date');
    console.log('\n✓ Database is up to date\n');
  }
}

module.exports = { runMigrations };
