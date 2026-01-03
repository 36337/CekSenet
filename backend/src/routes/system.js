/**
 * System Routes
 * Sistem bilgileri API endpoint'leri
 */

const express = require('express');
const os = require('os');

const logger = require('../utils/logger');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/system/ip
 * Sunucunun IP adreslerini döndürür
 * Sadece admin kullanıcılar görebilir
 * 
 * Response:
 * - hostname: Bilgisayar adı
 * - interfaces: Ağ arayüzleri ve IP adresleri
 * - primaryIP: Ana IP adresi (LAN erişimi için)
 * - port: Uygulama portu
 * - accessUrls: Erişim URL'leri
 */
router.get('/ip', authenticate, requireAdmin, (req, res) => {
  try {
    const networkInterfaces = os.networkInterfaces();
    const hostname = os.hostname();
    
    // Tüm IPv4 adresleri topla
    const interfaces = {};
    let primaryIP = null;
    
    // Öncelik sırası: Ethernet > Wi-Fi > diğerleri
    const priorityPatterns = ['ethernet', 'eth', 'wi-fi', 'wifi', 'wlan', 'lan'];
    let bestPriority = Infinity;
    
    for (const [name, addrs] of Object.entries(networkInterfaces)) {
      const ipv4Addrs = addrs
        .filter(addr => addr.family === 'IPv4' && !addr.internal)
        .map(addr => ({
          address: addr.address,
          netmask: addr.netmask,
          mac: addr.mac
        }));
      
      if (ipv4Addrs.length > 0) {
        interfaces[name] = ipv4Addrs;
        
        // Primary IP seçimi - öncelik sırasına göre
        const nameLower = name.toLowerCase();
        let currentPriority = priorityPatterns.findIndex(p => nameLower.includes(p));
        
        // Eğer listede yoksa en düşük öncelik ver (ama VPN'leri hariç tut)
        if (currentPriority === -1) {
          // VPN, virtual, vEthernet gibi sanal arayüzleri atla
          const skipPatterns = ['vpn', 'virtual', 'vethernet', 'nordlynx', 'wsl', 'docker', 'vmware', 'hyper-v'];
          const isVirtual = skipPatterns.some(p => nameLower.includes(p));
          if (isVirtual) {
            currentPriority = Infinity;
          } else {
            currentPriority = priorityPatterns.length; // En düşük gerçek öncelik
          }
        }
        
        // Daha yüksek öncelikli arayüz bulunduysa güncelle
        if (currentPriority < bestPriority) {
          bestPriority = currentPriority;
          primaryIP = ipv4Addrs[0].address;
        }
      }
    }
    
    // Production port (varsayılan 7474)
    const port = process.env.PORT || 7474;
    
    // Erişim URL'leri oluştur
    const accessUrls = {
      local: `http://localhost:${port}`,
      lan: primaryIP ? `http://${primaryIP}:${port}` : null
    };
    
    res.json({
      hostname,
      interfaces,
      primaryIP,
      port: parseInt(port),
      accessUrls
    });
    
  } catch (error) {
    logger.error('System IP error', { error: error.message });
    res.status(500).json({
      error: 'Sunucu hatası',
      message: 'IP adresi bilgisi alınamadı'
    });
  }
});

/**
 * GET /api/system/health
 * Basit sağlık kontrolü (herkes erişebilir)
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

module.exports = router;
