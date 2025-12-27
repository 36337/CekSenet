# ÇekSenet - Kullanım Kılavuzu

**Versiyon:** 1.0.0  
**Tarih:** Aralık 2025

---

## İçindekiler

1. [Kurulum](#1-kurulum)
2. [İlk Giriş](#2-i̇lk-giriş)
3. [Şifre Değiştirme](#3-şifre-değiştirme)
4. [Ana Ekran (Dashboard)](#4-ana-ekran-dashboard)
5. [Evrak İşlemleri](#5-evrak-i̇şlemleri)
6. [Cari Hesap İşlemleri](#6-cari-hesap-i̇şlemleri)
7. [Raporlar](#7-raporlar)
8. [Kullanıcı Yönetimi](#8-kullanıcı-yönetimi)
9. [Diğer Cihazlardan Erişim](#9-diğer-cihazlardan-erişim)
10. [Yedekleme](#10-yedekleme)
11. [Sorun Giderme](#11-sorun-giderme)

---

## 1. Kurulum

### Kurulum Adımları

1. **CekSenet-Setup-1.0.0.exe** dosyasını çalıştırın
2. "İleri" butonuna tıklayın
3. Kurulum dizinini seçin (varsayılan: `C:\Program Files\CekSenet`)
4. "Masaüstü kısayolu oluştur" seçeneğini işaretli bırakın
5. "Kur" butonuna tıklayın
6. Kurulum tamamlandığında "Bitir" butonuna tıklayın

Kurulum tamamlandığında tarayıcınız otomatik olarak açılacak ve giriş ekranı gelecektir.

### Önemli Bilgiler

- Uygulama bilgisayar açıldığında otomatik olarak başlar
- Tarayıcıyı kapatsanız bile uygulama arka planda çalışmaya devam eder
- Uygulamaya her zaman tarayıcıdan erişirsiniz

---

## 2. İlk Giriş

### Varsayılan Giriş Bilgileri

| Alan | Değer |
|------|-------|
| Kullanıcı Adı | `admin` |
| Şifre | `123456` |

### Giriş Yapmak İçin

1. Tarayıcınızı açın
2. Adres çubuğuna `http://localhost:7474` yazın
3. Kullanıcı adı ve şifreyi girin
4. "Giriş Yap" butonuna tıklayın

> **Güvenlik Uyarısı:** İlk girişten sonra şifrenizi mutlaka değiştirin!

---

## 3. Şifre Değiştirme

1. Sol menüden **"Kullanıcılar"** seçeneğine tıklayın
2. Kendi kullanıcı adınızın yanındaki **"Düzenle"** butonuna tıklayın
3. "Yeni Şifre" alanına yeni şifrenizi yazın
4. "Şifre Tekrar" alanına aynı şifreyi tekrar yazın
5. **"Kaydet"** butonuna tıklayın

> **Not:** Şifreniz en az 6 karakter olmalıdır.

---

## 4. Ana Ekran (Dashboard)

Giriş yaptıktan sonra karşınıza ana ekran (Dashboard) gelir. Bu ekranda:

### Özet Kartları
- **Toplam Evrak:** Sistemdeki tüm çek ve senetlerin sayısı
- **Toplam Tutar:** Tüm evrakların toplam değeri
- **Bugün Vadesi Gelen:** Bugün vadesi dolan evrak sayısı
- **Gecikmiş:** Vadesi geçmiş evrak sayısı

### Grafikler
- **Durum Dağılımı:** Evrakların durumlarına göre dağılımı (pasta grafik)
- **Aylık Vade Dağılımı:** Önümüzdeki aylarda vadesi dolacak evraklar

### Vade Uyarıları
- Vadesi yaklaşan ve gecikmiş evrakların listesi
- Tıklayarak detaylarına gidebilirsiniz

---

## 5. Evrak İşlemleri

### Evrak Listesi

Sol menüden **"Evraklar"** seçeneğine tıklayın.

Bu ekranda:
- Tüm çek ve senetleri görebilirsiniz
- Arama yapabilirsiniz (evrak no, cari adı)
- Filtreleme yapabilirsiniz (tip, durum, tarih aralığı)

### Yeni Evrak Ekleme

1. **"Yeni Evrak"** butonuna tıklayın
2. Gerekli alanları doldurun:
   - **Evrak Tipi:** Çek veya Senet seçin
   - **Evrak No:** Çek/senet numarası
   - **Cari:** Açılır listeden cari seçin
   - **Tutar:** Evrak tutarını yazın
   - **Vade Tarihi:** Evrakın vade tarihini seçin
   - **Düzenleme Tarihi:** Evrakın düzenlendiği tarih
   - **Banka:** (Çek için) Banka adı
   - **Şube:** (Çek için) Şube adı
   - **Açıklama:** Varsa ek notlar
3. **"Kaydet"** butonuna tıklayın

### Evrak Düzenleme

1. Listeden düzenlemek istediğiniz evrakın satırına tıklayın
2. Detay sayfasında **"Düzenle"** butonuna tıklayın
3. Gerekli değişiklikleri yapın
4. **"Kaydet"** butonuna tıklayın

### Evrak Durumu Değiştirme

Evrak durumları şunlardır:
- **Portföy:** Evrak elinizde
- **Bankada:** Evrak bankaya verildi
- **Ciro:** Evrak başka birine ciro edildi
- **Tahsil:** Evrak tahsil edildi (ödeme alındı)
- **Karşılıksız:** Evrak karşılıksız çıktı

Durumu değiştirmek için:
1. Evrak detay sayfasına gidin
2. **"Durum Değiştir"** butonuna tıklayın
3. Yeni durumu seçin
4. (Opsiyonel) Not ekleyin
5. **"Kaydet"** butonuna tıklayın

### Evrak Silme

1. Evrak detay sayfasına gidin
2. **"Sil"** butonuna tıklayın
3. Onay kutusunda **"Evet"** deyin

> **Uyarı:** Silinen evraklar geri getirilemez!

---

## 6. Cari Hesap İşlemleri

### Cari Listesi

Sol menüden **"Cariler"** seçeneğine tıklayın.

### Yeni Cari Ekleme

1. **"Yeni Cari"** butonuna tıklayın
2. Gerekli alanları doldurun:
   - **Cari Adı:** Firma veya kişi adı
   - **Cari Tipi:** Müşteri veya Tedarikçi
   - **Yetkili Kişi:** İletişim kurulacak kişi
   - **Telefon:** Telefon numarası
   - **E-posta:** E-posta adresi
   - **Adres:** Açık adres
   - **Vergi Dairesi:** Vergi dairesi adı
   - **Vergi No:** Vergi numarası
   - **Not:** Ek notlar
3. **"Kaydet"** butonuna tıklayın

### Cari Düzenleme

1. Listeden cari adına tıklayın
2. **"Düzenle"** butonuna tıklayın
3. Değişiklikleri yapın
4. **"Kaydet"** butonuna tıklayın

### Cari Silme

> **Dikkat:** Üzerinde evrak bulunan cariler silinemez! Önce evrakları silmeniz veya başka cariye aktarmanız gerekir.

---

## 7. Raporlar

Sol menüden **"Raporlar"** seçeneğine tıklayın.

### Filtreleme Seçenekleri

- **Tarih Aralığı:** Başlangıç ve bitiş tarihi seçin
- **Evrak Tipi:** Tümü, Çek veya Senet
- **Durum:** Tümü veya belirli bir durum
- **Cari:** Tümü veya belirli bir cari

### Excel'e Aktarma

1. Filtreleme seçeneklerini ayarlayın
2. **"Excel'e Aktar"** butonuna tıklayın
3. Dosya otomatik olarak indirilecektir

İndirilen Excel dosyası şu bilgileri içerir:
- Evrak no, tipi, durumu
- Cari adı
- Tutar, vade tarihi
- Banka, şube bilgileri

---

## 8. Kullanıcı Yönetimi

> **Not:** Bu bölüm sadece Admin yetkisine sahip kullanıcılar içindir.

Sol menüden **"Kullanıcılar"** seçeneğine tıklayın.

### Kullanıcı Rolleri

| Rol | Yetkiler |
|-----|----------|
| **Admin** | Tüm işlemler + kullanıcı yönetimi |
| **Normal** | Evrak ve cari işlemleri (kullanıcı yönetimi hariç) |

### Yeni Kullanıcı Ekleme

1. **"Yeni Kullanıcı"** butonuna tıklayın
2. Kullanıcı adı, ad-soyad, şifre girin
3. Rol seçin (Admin veya Normal)
4. **"Kaydet"** butonuna tıklayın

### Kullanıcı Silme

1. Silmek istediğiniz kullanıcının yanındaki **"Sil"** butonuna tıklayın
2. Onaylayın

> **Not:** Kendi hesabınızı silemezsiniz.

---

## 9. Diğer Cihazlardan Erişim

Uygulamaya aynı ağdaki diğer bilgisayarlardan veya telefonlardan erişebilirsiniz.

### Aynı Ağdan Erişim (Ofis İçi)

1. Ana bilgisayarın IP adresini öğrenin:
   - Komut İstemi'ni açın (Windows tuşu + R, `cmd` yazın)
   - `ipconfig` yazın
   - "IPv4 Address" satırındaki numarayı not alın (örn: `192.168.1.100`)

2. Diğer cihazdan tarayıcıyı açın
3. Adres çubuğuna yazın: `http://192.168.1.100:7474`
   - (192.168.1.100 yerine kendi IP adresinizi yazın)

### İnternet Üzerinden Erişim (Dışarıdan)

Dışarıdan erişim için statik IP gereklidir. Statik IP'niz varsa:

1. Modem ayarlarından 7474 portunu yönlendirin
2. Dışarıdan `http://[STATIK-IP]:7474` adresiyle erişin

> **Güvenlik Notu:** Dışarıdan erişim açarsanız güçlü şifreler kullanın!

---

## 10. Yedekleme

### Otomatik Yedekleme

Uygulama her gece saat 02:00'de otomatik yedek alır.

Yedek dosyaları şurada saklanır:
```
C:\Program Files\CekSenet\app\backend\database\backups\
```

Son 7 yedek saklanır, eski yedekler otomatik silinir.

### Manuel Yedekleme

Veritabanı dosyasını manuel olarak kopyalayabilirsiniz:

1. Şu klasöre gidin: `C:\Program Files\CekSenet\app\backend\database\`
2. `ceksenet.db` dosyasını kopyalayın
3. Güvenli bir yere (USB, bulut vb.) kaydedin

### Yedekten Geri Yükleme

1. Uygulamayı kapatın (Görev Yöneticisi'nden `node.exe` işlemini sonlandırın)
2. Mevcut `ceksenet.db` dosyasını başka bir yere taşıyın (yedek olarak)
3. Geri yüklemek istediğiniz yedek dosyasını `ceksenet.db` adıyla kopyalayın
4. Bilgisayarı yeniden başlatın veya "CekSenet Sunucusu" kısayolunu çalıştırın

---

## 11. Sorun Giderme

### Uygulama Açılmıyor

**Belirti:** Tarayıcıda "Bu siteye ulaşılamıyor" hatası

**Çözüm:**
1. Masaüstündeki **"CekSenet Sunucusu"** kısayoluna çift tıklayın
2. Birkaç saniye bekleyin
3. Tarayıcıda `http://localhost:7474` adresine gidin

### Giriş Yapamıyorum

**Belirti:** "Kullanıcı adı veya şifre hatalı" hatası

**Çözüm:**
- Caps Lock açık olmadığından emin olun
- Varsayılan bilgiler: `admin` / `123456`
- Şifrenizi değiştirdiyseniz ve unuttuysanız, başka bir admin kullanıcıdan şifrenizi sıfırlamasını isteyin

### Diğer Cihazlardan Erişemiyorum

**Belirti:** Telefondan veya başka bilgisayardan bağlanılamıyor

**Çözüm:**
1. Ana bilgisayarın IP adresini doğru yazdığınızdan emin olun
2. Windows Güvenlik Duvarı'nın 7474 portuna izin verdiğinden emin olun
3. Tüm cihazların aynı ağda (WiFi) olduğundan emin olun

### Uygulama Yavaş Çalışıyor

**Çözüm:**
1. Tarayıcı önbelleğini temizleyin (Ctrl + Shift + Delete)
2. Bilgisayarı yeniden başlatın
3. Çok eski evrakları arşivlemeyi düşünün

### Verilerim Kayboldu

**Çözüm:**
1. `backups` klasöründeki yedekleri kontrol edin
2. En son tarihe ait yedeği geri yükleyin (bkz. Yedekten Geri Yükleme)

---

## Destek

Sorun yaşarsanız sistem yöneticinize başvurun.

---

**ÇekSenet v1.0.0** - Aralık 2025
