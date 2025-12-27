/**
 * Scheduler Module
 * Otomatik görevler: yedekleme, temizlik
 */

const cron = require('node-cron');
const Backup = require('../models/backup');
const logger = require('./logger');

// Scheduler durumu
let isSchedulerRunning = false;
let scheduledTasks = [];

/**
 * Otomatik yedekleme görevi
 * Her gün saat 02:00'de çalışır
 */
function scheduleAutoBackup() {
  // Cron formatı: dakika saat gün ay haftanın_günü
  // '0 2 * * *' = Her gün saat 02:00
  const task = cron.schedule('0 2 * * *', () => {
    logger.info('Otomatik yedekleme başlıyor...');
    
    try {
      const result = Backup.create('Otomatik günlük yedek');
      
      if (result.success) {
        logger.info('Otomatik yedekleme tamamlandı', {
          filename: result.filename,
          size_kb: result.size
        });
      } else {
        logger.error('Otomatik yedekleme başarısız', {
          error: result.message
        });
      }
    } catch (error) {
      logger.error('Otomatik yedekleme hatası', {
        error: error.message
      });
    }
  }, {
    scheduled: true,
    timezone: 'Europe/Istanbul'
  });

  scheduledTasks.push(task);
  logger.info('Otomatik yedekleme zamanlandı: Her gün 02:00');
}

/**
 * Eski yedek temizleme görevi
 * Her gün saat 03:00'de çalışır
 * 7 günden eski yedekleri siler
 */
function scheduleBackupCleanup() {
  // '0 3 * * *' = Her gün saat 03:00
  const task = cron.schedule('0 3 * * *', () => {
    logger.info('Eski yedek temizliği başlıyor...');
    
    try {
      // Son 7 yedeği tut (günlük yedekleme ile 7 günlük geçmiş)
      const result = Backup.cleanup(7);
      
      if (result.success) {
        if (result.deleted_count > 0) {
          logger.info('Eski yedekler temizlendi', {
            deleted_count: result.deleted_count
          });
        } else {
          logger.debug('Temizlenecek eski yedek yok');
        }
      } else {
        logger.error('Yedek temizleme başarısız', {
          error: result.message
        });
      }
    } catch (error) {
      logger.error('Yedek temizleme hatası', {
        error: error.message
      });
    }
  }, {
    scheduled: true,
    timezone: 'Europe/Istanbul'
  });

  scheduledTasks.push(task);
  logger.info('Yedek temizleme zamanlandı: Her gün 03:00 (7 yedek tutulur)');
}

/**
 * Tüm zamanlanmış görevleri başlat
 */
function startScheduler() {
  if (isSchedulerRunning) {
    logger.warn('Scheduler zaten çalışıyor');
    return;
  }

  logger.info('Scheduler başlatılıyor...');

  // Görevleri zamanla
  scheduleAutoBackup();
  scheduleBackupCleanup();

  isSchedulerRunning = true;
  logger.info('Scheduler başlatıldı', {
    tasks: scheduledTasks.length
  });
}

/**
 * Tüm zamanlanmış görevleri durdur
 */
function stopScheduler() {
  if (!isSchedulerRunning) {
    return;
  }

  logger.info('Scheduler durduruluyor...');

  scheduledTasks.forEach(task => {
    task.stop();
  });

  scheduledTasks = [];
  isSchedulerRunning = false;
  logger.info('Scheduler durduruldu');
}

/**
 * Manuel yedekleme (API'den çağrılabilir)
 */
function runBackupNow() {
  logger.info('Manuel yedekleme tetiklendi');
  return Backup.create('Manuel tetikleme');
}

/**
 * Manuel temizlik (API'den çağrılabilir)
 */
function runCleanupNow(keepCount = 7) {
  logger.info('Manuel temizlik tetiklendi', { keepCount });
  return Backup.cleanup(keepCount);
}

/**
 * Scheduler durumu
 */
function getStatus() {
  return {
    running: isSchedulerRunning,
    tasks_count: scheduledTasks.length,
    scheduled_jobs: [
      { name: 'auto_backup', schedule: '02:00 daily', timezone: 'Europe/Istanbul' },
      { name: 'backup_cleanup', schedule: '03:00 daily', timezone: 'Europe/Istanbul', keep_count: 7 }
    ]
  };
}

module.exports = {
  startScheduler,
  stopScheduler,
  runBackupNow,
  runCleanupNow,
  getStatus
};
