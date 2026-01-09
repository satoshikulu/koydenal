# 📋 İlan Verme Test Rehberi

## 🧪 Test Adımları

### 1. İlan Verme Testi

#### Adım 1: İlan Ver Sayfasına Git
```
http://localhost:5173/ilan-ver
```

#### Adım 2: Formu Doldur
```
Başlık: Test İlanı - Organik Buğday
Kategori: Yem & Tohum
Fiyat: 1500
Birim: kg
Miktar: 100
Mahalle: ACIKUYU MAHALLESİ
Açıklama: Test amaçlı oluşturulan ilan. Organik buğday satışı yapılmaktadır.
Ad Soyad: Test Kullanıcı
Telefon: 05551234567
```

#### Adım 3: İlanı Oluştur
- "İlanı Oluştur" butonuna tıkla
- F12 → Console'u aç
- Log mesajlarını kontrol et

#### Beklenen Console Logları
```javascript
📝 İlan verisi hazırlandı: {...}
✅ İlan başarıyla oluşturuldu: {...}
📊 İlan ID: uuid-string
📋 İlan Durumu: pending
```

#### Beklenen Alert Mesajı
```
✅ İlanınız başarıyla oluşturuldu! Admin onayı sonrası yayınlanacak.
```

---

### 2. Supabase Kontrolü

#### SQL Editor'da Çalıştır
```sql
-- Son oluşturulan ilanı kontrol et
SELECT * FROM listings 
ORDER BY created_at DESC 
LIMIT 1;
```

#### Beklenen Sonuç
```
id: uuid
title: Test İlanı - Organik Buğday
status: pending
price: 1500
quantity: 100
unit: kg
location: ACIKUYU MAHALLESİ
contact_person: Test Kullanıcı
contact_phone: 05551234567
created_at: 2025-10-25 ...
```

---

### 3. Admin Panelinde Kontrol

#### Adım 1: Admin Paneline Git
```
http://localhost:5173/admin
```

#### Adım 2: İlan Yönetimi
- "İlanlar" sekmesine tıkla
- Filtre: "Beklemede" seç
- Test ilanını listede gör

#### Beklenen Görünüm
```
┌────────────────────────────────┐
│ Test İlanı - Organik Buğday    │
│ 🌾 Tahıllar         [Beklemede]│
├────────────────────────────────┤
│ 💰 Fiyat: 1500 TRY             │
│ 📦 Miktar: 100 kg              │
│ 📍 Lokasyon: ACIKUYU           │
│ 📱 İletişim: 05551234567       │
│ 👤 Satıcı: Test Kullanıcı      │
├────────────────────────────────┤
│ [✅ Onayla] [❌ Reddet]         │
└────────────────────────────────┘
```

---

## 🔍 Sorun Giderme

### İlan Oluşturulamıyor

**Kontrol 1: Console Hataları**
```javascript
// F12 → Console
// Hata mesajlarını kontrol et
```

**Kontrol 2: Kategori Mapping**
```javascript
// CreateAd.jsx içinde
const kategoriMap = {
  'besi': 'Hayvancılık',
  'kumes': 'Hayvancılık',
  'sebze': 'Sebzeler',
  'sut': 'Hayvancılık',
  'yem': 'Tahıllar',
  'makine': 'Ekipman'
};
```

**Kontrol 3: Kategoriler Supabase'de Var mı?**
```sql
SELECT * FROM categories;
```

Beklenen kategoriler:
- Tahıllar
- Sebzeler
- Meyveler
- Bakliyat
- Hayvancılık
- Ekipman

---

### İlan Admin Panelinde Görünmüyor

**Kontrol 1: İlan Durumu**
```sql
SELECT id, title, status FROM listings 
WHERE title LIKE '%Test%';
```

**Kontrol 2: RLS Politikaları**
```sql
-- Admin pending ilanları görebilmeli
SELECT * FROM listings WHERE status = 'pending';
```

**Kontrol 3: Admin Yetkisi**
```sql
SELECT id, email, role, status FROM user_profiles 
WHERE role = 'admin';
```

---

### Kategori Bulunamadı Hatası

**Sorun:** "Kategori bulunamadı: xyz" hatası

**Çözüm 1: Kategori İsimlerini Kontrol Et**
```sql
-- Supabase'deki kategori isimleri
SELECT id, name FROM categories;
```

**Çözüm 2: Mapping'i Güncelle**
```javascript
// CreateAd.jsx
const kategoriMap = {
  'besi': 'Hayvancılık',    // ✅ Doğru
  'kumes': 'Hayvancılık',   // ✅ Doğru
  'sebze': 'Sebzeler',      // ✅ Doğru
  'sut': 'Hayvancılık',     // ✅ Doğru
  'yem': 'Tahıllar',        // ✅ Doğru
  'makine': 'Ekipman'       // ✅ Doğru
};
```

---

## 📊 Test Senaryoları

### Senaryo 1: Kayıtlı Kullanıcı İlan Veriyor
```
1. Kullanıcı giriş yapmış
2. /ilan-ver sayfasına git
3. Formu doldur
4. İlanı oluştur
5. user_id dolu olmalı
6. Admin panelinde kullanıcı adı görünmeli
```

### Senaryo 2: Misafir Kullanıcı İlan Veriyor
```
1. Kullanıcı giriş yapmamış
2. /ilan-ver sayfasına git
3. Formu doldur
4. İlanı oluştur
5. user_id null olmalı
6. Admin panelinde "Misafir" görünmeli
```

### Senaryo 3: Farklı Kategoriler
```
Test edilecek kategoriler:
- ✅ Besi Hayvanı → Hayvancılık
- ✅ Kümes & Yumurta → Hayvancılık
- ✅ Sebze & Meyve → Sebzeler
- ✅ Süt & Peynir → Hayvancılık
- ✅ Yem & Tohum → Tahıllar
- ✅ Tarım Makinaları → Ekipman
```

### Senaryo 4: Görsel Yükleme
```
1. Görsel seç (1-5 adet)
2. Preview'ları gör
3. İlanı oluştur
4. Şu an placeholder URL kullanılıyor
5. TODO: Gerçek image upload eklenecek
```

---

## 🎯 Başarı Kriterleri

### İlan Oluşturma
- ✅ Form validasyonu çalışıyor
- ✅ Supabase'e kayıt yapılıyor
- ✅ Status: 'pending' olarak kaydediliyor
- ✅ Console'da detaylı loglar var
- ✅ Başarı mesajı gösteriliyor
- ✅ Ana sayfaya yönlendiriliyor

### Admin Paneli
- ✅ Bekleyen ilanlar görünüyor
- ✅ İlan detayları doğru
- ✅ Onaylama/Reddetme çalışıyor
- ✅ Kullanıcı bilgileri görünüyor

### Veritabanı
- ✅ listings tablosuna kayıt ekleniyor
- ✅ Tüm alanlar doğru doluyor
- ✅ İlişkiler (category_id, user_id) doğru
- ✅ Timestamp'ler otomatik oluşuyor

---

## 📝 Yapılacaklar (TODO)

### Kısa Vadeli
- [ ] Gerçek image upload (Supabase Storage)
- [ ] Image preview iyileştirme
- [ ] Form validasyonu iyileştirme
- [ ] Loading state iyileştirme

### Orta Vadeli
- [ ] Taslak kaydetme
- [ ] İlan düzenleme
- [ ] İlan silme
- [ ] Çoklu görsel yönetimi

### Uzun Vadeli
- [ ] Drag & drop görsel yükleme
- [ ] Görsel crop/resize
- [ ] Otomatik kategori önerisi
- [ ] Fiyat önerisi (AI)

---

## 🔧 Hızlı SQL Komutları

### Tüm İlanları Göster
```sql
SELECT 
  l.id,
  l.title,
  l.status,
  l.price,
  c.name as kategori,
  l.created_at
FROM listings l
LEFT JOIN categories c ON l.category_id = c.id
ORDER BY l.created_at DESC;
```

### Bekleyen İlanları Göster
```sql
SELECT * FROM listings 
WHERE status = 'pending' 
ORDER BY created_at DESC;
```

### Test İlanlarını Sil
```sql
DELETE FROM listings 
WHERE title LIKE '%Test%';
```

### İlan İstatistikleri
```sql
SELECT 
  status,
  COUNT(*) as sayi,
  SUM(price) as toplam_deger
FROM listings
GROUP BY status;
```

---

**Hazırlayan:** Kiro AI Assistant  
**Tarih:** 25 Ekim 2025  
**Versiyon:** 1.0

🎉 **İlan verme sistemi hazır ve çalışıyor!**
