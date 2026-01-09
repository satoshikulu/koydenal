# 📱 KöydenAL - PWA Kurulum Rehberi

## 🎯 PWA Özellikleri

KöydenAL artık **Progressive Web App (PWA)** olarak çalışıyor! Bu sayede:

✅ **Ana ekrana ekleme** - Uygulamayı telefon/tablet ana ekranına ekleyebilirsiniz  
✅ **Çevrimdışı kullanım** - İnternet olmadan da bazı özellikler çalışır  
✅ **Hızlı yükleme** - Service Worker sayesinde daha hızlı açılır  
✅ **Native app deneyimi** - Tam ekran, bildirimler ve daha fazlası  

---

## 🚀 Kurulum Adımları

### 1. Bağımlılıkları Yükle

```bash
npm install
```

PWA paketleri zaten yüklü:
- `vite-plugin-pwa` - PWA desteği
- `workbox-window` - Service Worker yönetimi

### 2. PWA Iconları Oluştur

PWA için icon dosyalarına ihtiyacınız var. `public/` klasörüne şu dosyaları ekleyin:

#### Gerekli Icon Dosyaları:
- `pwa-192x192.png` - 192x192 piksel
- `pwa-512x512.png` - 512x512 piksel  
- `apple-touch-icon.png` - 180x180 piksel (iOS için)

#### Icon Oluşturma:
1. **Online Tool Kullan:**
   - [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
   - [RealFaviconGenerator](https://realfavicongenerator.net/)

2. **Manuel Oluştur:**
   - Logo/icon tasarımınızı hazırlayın
   - 512x512 piksel boyutunda PNG olarak kaydedin
   - Gerekli boyutlara resize edin

3. **Icon Önerileri:**
   - KöydenAL logosu (🌾 emoji veya çiftçi/tarım temalı)
   - Yeşil tonları (#28a745)
   - Basit ve tanınabilir tasarım

### 3. Veritabanı Güncellemesi

Kategorileri güncellemek için:

```sql
-- Supabase SQL Editor'da çalıştırın
-- Dosya: update_categories_for_pwa.sql
```

Bu script:
- Kümes Hayvanları kategorisini önceliklendirir
- Süt ve Süt Ürünleri kategorisini ekler/günceller
- Sebzeler kategorisini vurgular
- Tüm kategorileri yeniden sıralar

### 4. Build ve Test

```bash
# Development modunda test
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### 5. PWA Test Etme

#### Chrome DevTools:
1. F12 → Application sekmesi
2. Service Workers → Aktif olmalı
3. Manifest → Doğru görünmeli
4. Storage → Cache'ler çalışmalı

#### Mobil Test:
1. HTTPS üzerinden erişin (localhost veya production)
2. Tarayıcıda "Ana ekrana ekle" seçeneği görünmeli
3. Uygulamayı yükleyin
4. Çevrimdışı modda test edin

---

## 📋 PWA Özellikleri Detayları

### 1. Install Prompt (Yükleme İsteği)

Kullanıcılar uygulamayı yükleyebilir:
- **Otomatik prompt** - Tarayıcı önerir
- **Manuel buton** - InstallPrompt bileşeni gösterir
- **7 günlük hatırlatma** - Reddedilirse 7 gün sonra tekrar sorar

### 2. Offline Support (Çevrimdışı Desteği)

Service Worker sayesinde:
- **Cache stratejisi:**
  - Static assets (JS, CSS, HTML) → Cache First
  - Supabase API → Network First (24 saat cache)
  - Images → Cache First (7 gün cache)

- **Çevrimdışı özellikler:**
  - Ana sayfa görüntülenir
  - Önbelleğe alınmış ilanlar görüntülenir
  - Offline indicator gösterilir

### 3. App Manifest

`public/manifest.json` dosyası:
- Uygulama adı ve açıklaması
- Icon tanımları
- Theme color (#28a745 - yeşil)
- Display mode (standalone)
- Shortcuts (hızlı erişim linkleri)

### 4. Service Worker

Otomatik olarak oluşturulur:
- **Auto-update** - Yeni versiyon otomatik yüklenir
- **Background sync** - Çevrimdışı işlemler senkronize edilir
- **Push notifications** - Gelecekte eklenebilir

---

## 🎨 Kategori Güncellemeleri

### Öncelikli Kategoriler (Display Order)

1. **🐔 Kümes Hayvanları** (1)
   - Tavuk, horoz, ördek, kaz, hindi
   - Yumurta (köy yumurtası)

2. **🥛 Süt ve Süt Ürünleri** (2)
   - Süt, yoğurt, peynir
   - Tereyağı, kaymak, lor, çökelek

3. **🥕 Sebzeler** (3)
   - Domates, biber, patlıcan
   - Salatalık, kabak, soğan, sarımsak

### Diğer Kategoriler

4. **🍎 Meyveler** (4)
5. **🌾 Tahıllar** (5)
6. **🫘 Bakliyat** (6)
7. **🐄 Büyükbaş Hayvanlar** (7)
8. **🐑 Küçükbaş Hayvanlar** (8)
9. **🚜 Ekipman** (9)

---

## 🔧 Yapılandırma Dosyaları

### vite.config.js
```javascript
VitePWA({
  registerType: 'autoUpdate',
  manifest: { ... },
  workbox: {
    runtimeCaching: [ ... ]
  }
})
```

### public/manifest.json
```json
{
  "name": "KöydenAL",
  "short_name": "KöydenAL",
  "theme_color": "#28a745",
  ...
}
```

### index.html
```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#28a745" />
<meta name="apple-mobile-web-app-capable" content="yes" />
```

---

## 📱 Mobil Cihazlarda Yükleme

### Android (Chrome)
1. Tarayıcıda siteyi aç
2. Menü (⋮) → "Ana ekrana ekle"
3. Onayla
4. Ana ekranda uygulama ikonu görünür

### iOS (Safari)
1. Safari'de siteyi aç
2. Paylaş butonu (□↑) → "Ana Ekrana Ekle"
3. Onayla
4. Ana ekranda uygulama ikonu görünür

### Desktop (Chrome/Edge)
1. Adres çubuğunda yükleme ikonu görünür
2. Tıkla ve yükle
3. Uygulama penceresi olarak açılır

---

## 🐛 Sorun Giderme

### Service Worker Çalışmıyor
```bash
# Cache'i temizle
# Chrome: F12 → Application → Clear storage → Clear site data
# Veya: Ctrl+Shift+Delete → Cached images and files
```

### Iconlar Görünmüyor
- Icon dosyalarının `public/` klasöründe olduğundan emin olun
- Dosya isimlerinin doğru olduğunu kontrol edin
- Build sonrası `dist/` klasöründe iconlar var mı bakın

### Manifest Hatası
- `manifest.json` dosyasının geçerli JSON olduğunu kontrol edin
- Icon path'lerinin doğru olduğundan emin olun
- Browser console'da hata var mı kontrol edin

### Çevrimdışı Çalışmıyor
- HTTPS üzerinden erişin (localhost hariç)
- Service Worker'ın kayıtlı olduğunu kontrol edin
- Cache stratejisini kontrol edin

---

## ✅ Checklist

### Kurulum Öncesi
- [ ] Node.js yüklü
- [ ] npm paketleri yüklü
- [ ] Supabase projesi hazır

### PWA Kurulumu
- [ ] `vite-plugin-pwa` yüklü
- [ ] `vite.config.js` güncellendi
- [ ] `manifest.json` oluşturuldu
- [ ] Icon dosyaları eklendi
- [ ] `index.html` güncellendi

### Veritabanı
- [ ] `update_categories_for_pwa.sql` çalıştırıldı
- [ ] Kategoriler güncellendi
- [ ] Test verileri kontrol edildi

### Test
- [ ] Development modunda çalışıyor
- [ ] Production build başarılı
- [ ] Service Worker kayıtlı
- [ ] Manifest doğru görünüyor
- [ ] Install prompt çalışıyor
- [ ] Offline indicator çalışıyor
- [ ] Mobil cihazda test edildi

---

## 🚀 Production Deployment

### Netlify/Vercel
1. Build komutu: `npm run build`
2. Publish directory: `dist`
3. Environment variables ekleyin
4. Deploy!

### Önemli Notlar
- **HTTPS zorunlu** - PWA için HTTPS gerekli
- **Icon dosyaları** - Production'da da olmalı
- **Service Worker** - Otomatik oluşturulur
- **Cache stratejisi** - Production'da optimize edilmiş

---

## 📚 Ek Kaynaklar

- [PWA Builder](https://www.pwabuilder.com/)
- [Web.dev PWA](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox](https://developers.google.com/web/tools/workbox)

---

## 🎉 Başarı!

PWA kurulumu tamamlandı! Artık KöydenAL:
- ✅ Ana ekrana eklenebilir
- ✅ Çevrimdışı çalışabilir
- ✅ Native app gibi davranır
- ✅ Hızlı ve güvenilir

**Kullanıcılarınız artık uygulamanızı telefonlarına yükleyebilir!** 📱🌾

---

**Hazırlayan:** AI Assistant  
**Tarih:** 2025  
**Versiyon:** 1.0
