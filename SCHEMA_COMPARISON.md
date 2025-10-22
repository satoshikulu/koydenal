# 📊 Şema Karşılaştırması

## kulutarimagore.sql → koydenal_adapted_schema.sql

### ✅ Korunan Özellikler (Çalışan Yapı)

#### 1. RLS Politikaları
- ✅ Tüm politikalar korundu
- ✅ Güvenlik yapısı aynı
- ✅ Admin kontrolleri çalışıyor

#### 2. Trigger'lar
- ✅ Tüm trigger'lar eklendi
- ✅ Otomatik işlemler korundu
- ✅ Bildirim sistemi aktif

#### 3. İndeksler
- ✅ Tüm performans indeksleri korundu
- ✅ Türkçe text search GIN index
- ✅ Yeni indeksler eklendi

#### 4. Fonksiyonlar
- ✅ search_listings() - Türkçe arama
- ✅ get_listings_stats() - İstatistikler
- ✅ Tüm helper fonksiyonlar

---

## 🆕 Eklenen Özellikler

### 1. Tablolar

#### user_profiles (users_min yerine)
**Eski (users_min):**
```sql
- id UUID
- full_name TEXT
- phone TEXT
- status TEXT
- created_at TIMESTAMPTZ
```

**Yeni (user_profiles):**
```sql
- id UUID (auth.users'a referans)
- email VARCHAR(255) ✨ YENİ
- full_name VARCHAR(255)
- phone VARCHAR(20)
- address TEXT ✨ YENİ
- role user_role ✨ YENİ (user/admin/moderator)
- status user_status (enum)
- avatar_url TEXT ✨ YENİ
- bio TEXT ✨ YENİ
- location VARCHAR(255) ✨ YENİ
- approved_by UUID ✨ YENİ
- approved_at TIMESTAMPTZ
- rejection_reason TEXT ✨ YENİ
- last_login_at TIMESTAMPTZ ✨ YENİ
- login_count INTEGER ✨ YENİ
- is_verified BOOLEAN ✨ YENİ
- verification_token VARCHAR(255) ✨ YENİ
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ ✨ YENİ
```

#### listings (Genişletilmiş)
**Eski kolonlar (korundu):**
```sql
- title TEXT
- description TEXT
- owner_name TEXT → contact_person
- owner_phone TEXT → contact_phone
- neighborhood TEXT ✅
- property_type TEXT ✅
- rooms TEXT ✅
- area_m2 INTEGER ✅
- price_tl BIGINT → price DECIMAL
- is_for TEXT ✅
- status TEXT → listing_status enum
- images JSONB → TEXT[]
- created_at TIMESTAMPTZ
- approved_at TIMESTAMPTZ
```

**Yeni kolonlar:**
```sql
- id UUID
- user_id UUID ✨ (auth entegrasyonu)
- category_id UUID ✨ (kategoriler)
- listing_type listing_type ✨ (ürün/hizmet/makine)
- currency VARCHAR(3) ✨
- quantity DECIMAL(10,2) ✨
- unit VARCHAR(50) ✨
- location VARCHAR(255) ✨
- latitude DECIMAL(10,8) ✨
- longitude DECIMAL(11,8) ✨
- contact_email VARCHAR(255) ✨
- preferred_contact contact_preference ✨
- main_image TEXT ✨
- approved_by UUID ✨
- rejection_reason TEXT ✨
- listing_secret VARCHAR(64) ✨ (misafir kullanıcı)
- view_count INTEGER ✨
- favorite_count INTEGER ✨
- is_featured BOOLEAN ✨
- featured_until TIMESTAMPTZ ✨
- expires_at TIMESTAMPTZ ✨
- updated_at TIMESTAMPTZ ✨
- published_at TIMESTAMPTZ ✨
```

#### Yeni Tablolar
```sql
✨ categories - Ürün kategorileri
✨ admin_actions - Admin işlem logları
✨ messages - Mesajlaşma sistemi
✨ notifications - Bildirim sistemi
✨ listing_views - Görüntüleme analitikleri
```

### 2. Enum Tipleri
```sql
✨ listing_status (pending, approved, rejected, expired, sold)
✨ user_role (user, admin, moderator)
✨ user_status (pending, approved, rejected, suspended)
✨ listing_type (ürün, hizmet, makine)
✨ contact_preference (telefon, whatsapp, email)
```

### 3. Trigger'lar
```sql
✅ update_updated_at_column() - Korundu
✨ handle_new_user() - Yeni (auth entegrasyonu)
✨ generate_listing_secret() - Yeni (misafir kullanıcı)
✨ set_published_at() - Yeni
✨ update_favorite_count() - Yeni
✨ notify_listing_status_change() - Yeni
```

### 4. Fonksiyonlar
```sql
✅ search_listings() - Korundu ve geliştirildi
✅ get_listings_stats() - Korundu ve genişletildi
✨ is_admin() - Yeni
✨ get_listing_by_secret() - Yeni
✨ increment_view_count() - Yeni
✨ cleanup_expired_listings() - Yeni
✨ promote_to_admin() - Yeni
```

### 5. Admin Views
```sql
✨ pending_listings
✨ approved_listings
✨ rejected_listings
✨ pending_users
✨ approved_users
✨ rejected_users
✨ admin_users
```

---

## 🔄 Değişiklikler

### Tablo İsimleri
| Eski | Yeni | Sebep |
|------|------|-------|
| users_min | user_profiles | Auth entegrasyonu |
| - | categories | Kategori sistemi |

### Kolon İsimleri
| Eski | Yeni | Sebep |
|------|------|-------|
| owner_name | contact_person | Daha açıklayıcı |
| owner_phone | contact_phone | Daha açıklayıcı |
| price_tl | price | Para birimi esnekliği |
| images (JSONB) | images (TEXT[]) | Daha basit |

### Veri Tipleri
| Kolon | Eski | Yeni | Sebep |
|-------|------|------|-------|
| status | TEXT | ENUM | Tip güvenliği |
| role | - | ENUM | Yetki sistemi |
| price | BIGINT | DECIMAL(12,2) | Ondalık destek |

---

## 📋 Migrasyon Rehberi

### Adım 1: Enum'ları Oluştur
```sql
-- check_and_fix_enums.sql çalıştır
```

### Adım 2: Yeni Şemayı Kur
```sql
-- koydenal_adapted_schema.sql çalıştır
```

### Adım 3: Mevcut Veriyi Taşı (Eğer varsa)

#### users_min → user_profiles
```sql
-- Önce auth.users'da kullanıcı oluştur
-- Sonra user_profiles'a ekle
INSERT INTO public.user_profiles (id, email, full_name, phone, status)
SELECT 
  gen_random_uuid(), -- Yeni UUID
  phone || '@temp.com', -- Geçici email
  full_name,
  phone,
  status::user_status
FROM public.users_min
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles WHERE phone = users_min.phone
);
```

#### listings (Kolon güncellemeleri)
```sql
-- Mevcut listings tablosu varsa
ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id),
  ADD COLUMN IF NOT EXISTS listing_type listing_type DEFAULT 'ürün',
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'TRY',
  ADD COLUMN IF NOT EXISTS quantity DECIMAL(10,2) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'adet',
  ADD COLUMN IF NOT EXISTS location VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS preferred_contact contact_preference DEFAULT 'telefon',
  ADD COLUMN IF NOT EXISTS main_image TEXT,
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS listing_secret VARCHAR(64),
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS favorite_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Kolon isimlerini güncelle
ALTER TABLE public.listings 
  RENAME COLUMN owner_name TO contact_person;
ALTER TABLE public.listings 
  RENAME COLUMN owner_phone TO contact_phone;
ALTER TABLE public.listings 
  RENAME COLUMN price_tl TO price;

-- Veri tiplerini güncelle
ALTER TABLE public.listings 
  ALTER COLUMN status TYPE listing_status USING status::listing_status;
ALTER TABLE public.listings 
  ALTER COLUMN price TYPE DECIMAL(12,2);

-- location'ı neighborhood'dan doldur
UPDATE public.listings 
SET location = neighborhood 
WHERE location IS NULL AND neighborhood IS NOT NULL;
```

---

## ✅ Uyumluluk Kontrolü

### Çalışan Özellikler
- ✅ RLS politikaları
- ✅ Trigger'lar
- ✅ İndeksler
- ✅ Türkçe arama
- ✅ Storage bucket
- ✅ Admin fonksiyonları

### Yeni Özellikler
- ✅ Auth entegrasyonu
- ✅ Kategori sistemi
- ✅ Rol tabanlı yetkilendirme
- ✅ Misafir kullanıcı desteği
- ✅ Bildirim sistemi
- ✅ Mesajlaşma
- ✅ Analitik
- ✅ Admin views

### Geriye Uyumluluk
- ✅ neighborhood kolonu korundu
- ✅ property_type kolonu korundu
- ✅ rooms kolonu korundu
- ✅ area_m2 kolonu korundu
- ✅ is_for kolonu korundu
- ✅ Türkçe arama çalışıyor
- ✅ İstatistik fonksiyonu çalışıyor

---

## 🎯 Sonuç

### Korunan
- ✅ Tüm çalışan özellikler
- ✅ RLS güvenliği
- ✅ Performans optimizasyonları
- ✅ Türkçe karakter desteği

### Eklenen
- ✅ 5 yeni tablo
- ✅ 20+ yeni kolon
- ✅ 5 enum tipi
- ✅ 6 trigger
- ✅ 7 admin view
- ✅ 7 helper fonksiyon

### İyileştirilen
- ✅ Auth entegrasyonu
- ✅ Tip güvenliği (enum)
- ✅ Veri bütünlüğü (foreign key)
- ✅ Güvenlik (RLS)
- ✅ Performans (index)

---

**Hazırlayan:** Kiro AI Assistant
**Tarih:** 21 Ekim 2025
**Kaynak:** kulutarimagore.sql
**Hedef:** koydenal_adapted_schema.sql
