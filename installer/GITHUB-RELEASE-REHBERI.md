# GitHub Release Oluşturma Rehberi

**Tarih:** Aralık 2025  
**Amaç:** CekSenet v1.0.0 release oluşturmak ve exe dosyasını yüklemek

---

## Adım 1: GitHub Repo Sayfasına Git

1. Tarayıcıda şu adrese git: https://github.com/36337/CekSenet
2. GitHub hesabına giriş yap (gerekiyorsa)

---

## Adım 2: Releases Sayfasını Aç

1. Repo ana sayfasında sağ tarafta **"Releases"** bölümünü bul
2. **"Create a new release"** linkine tıkla

   *Alternatif:* Üst menüden "Releases" sekmesine tıkla, sonra **"Draft a new release"** butonuna tıkla

---

## Adım 3: Release Bilgilerini Doldur

### Tag Oluştur
- **"Choose a tag"** dropdown'ına tıkla
- `v1.0.0` yaz
- **"Create new tag: v1.0.0 on publish"** seçeneğine tıkla

### Target
- `master` branch seçili kalsın (varsayılan)

### Release Başlığı
```
v1.0.0 - İlk Sürüm
```

### Açıklama (Description)
Aşağıdaki metni kopyala-yapıştır:

```markdown
# ÇekSenet v1.0.0

Şirket içi çek ve senet takip sistemi - İlk kararlı sürüm.

## Özellikler

- ✅ Çek ve senet kayıt/takip
- ✅ Vade takibi ve uyarılar
- ✅ Durum yönetimi (Portföy → Tahsil akışı)
- ✅ Cari hesap yönetimi
- ✅ Dashboard ve grafikler
- ✅ Excel'e aktarma
- ✅ Kullanıcı yönetimi (Admin/Normal roller)
- ✅ Responsive tasarım (mobil uyumlu)
- ✅ Otomatik yedekleme

## Kurulum

1. `CekSenet-Setup-1.0.0.exe` dosyasını indirin
2. Çalıştırın ve kurulum sihirbazını takip edin
3. Kurulum sonrası tarayıcı otomatik açılır
4. Varsayılan giriş: `admin` / `123456`

## Sistem Gereksinimleri

- Windows 10/11 (64-bit)
- Modern tarayıcı (Chrome, Edge, Firefox)

## Dosyalar

| Dosya | Açıklama |
|-------|----------|
| CekSenet-Setup-1.0.0.exe | Windows Installer |
| KULLANIM-KILAVUZU.md | Kullanıcı manueli |
```

---

## Adım 4: Dosyaları Yükle

1. Sayfanın alt kısmında **"Attach binaries by dropping them here or selecting them"** alanını bul

2. Şu dosyaları sürükle-bırak veya "selecting them" ile seç:
   - `F:\projects\ceksenet\installer\output\CekSenet-Setup-1.0.0.exe`
   - `F:\projects\ceksenet\installer\KULLANIM-KILAVUZU.md`

3. Dosyaların yüklenmesini bekle (exe ~32 MB, biraz sürebilir)

---

## Adım 5: Release'i Yayınla

1. Sayfanın en altında **"Publish release"** butonuna tıkla

2. Tamamlandı! Artık release sayfasından herkes dosyaları indirebilir.

---

## Sonuç

Release yayınlandıktan sonra:

- **Release URL:** https://github.com/36337/CekSenet/releases/tag/v1.0.0
- **Direkt indirme linki:** https://github.com/36337/CekSenet/releases/download/v1.0.0/CekSenet-Setup-1.0.0.exe

Bu linkleri babana veya diğer kullanıcılara gönderebilirsin.

---

## Gelecek Sürümler İçin

Yeni versiyon çıkardığında:
1. Aynı adımları tekrarla
2. Tag'i güncelle (v1.0.1, v1.1.0 vb.)
3. Değişiklikleri açıklamaya yaz
4. Yeni exe'yi yükle

---

**Not:** Bu rehber tek seferlik. Release oluşturduktan sonra bu dosyayı silebilirsin.
