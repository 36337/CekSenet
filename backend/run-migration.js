// run-migration.js
// Migration'ları çalıştır

const { runMigrations } = require('./src/migrate');

console.log('Starting migration...');
runMigrations();
console.log('Migration complete.');
process.exit(0);
