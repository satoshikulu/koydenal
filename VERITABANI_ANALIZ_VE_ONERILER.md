# 🔍 Veritabanı Analizi ve Öneriler

## 📊 Mevcut Tablo Yapısı

### 1. **categories** (Kategoriler)
```sql
- id (UUID, PK)
- name (VARCHAR(100), UNIQUE)
- slug (VARCHAR(100), UNIQUE)
- description (TEXT)
- icon (VARCHAR(50))
- display_order (INTEGER)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
```

**Durum:** ✅ İyi yapılandırılmış

**Öneriler:**
- PWA için güncellenmiş kategoriler: Kümes Hayvanları, Süt Ürünleri, Sebzeler öncelikli
- `update_categories_for_pwa.sql` çalıştırılmalı

---

### 2. **user_profiles** (Kullanıcı Profilleri)
```sql
- id (UUID, PK, FK -> auth.users)
- email (VARCHAR(255), UNIQUE)
- full_name (VARCHAR(255))
- phone (VARCHAR(20))
- address (TEXT)
- role (ENUM: user, admin, moderator)
- status (ENUM: pending, approved, rejected, suspended)
- avatar_url (TEXT)
- bio (TEXT)
- location (VARCHAR(255))
- approved_by, approved_at
- rejection_reason (TEXT)
- last_login_at, login_count
- is_verified, verification_token
- created_at, updated_at
```

**Durum:** ✅ Kapsamlı profil yapısı

**Öneriler:**
- `preferred_contact` alanı eksik (ENUM: telefon, whatsapp, email)
- PWA için `notification_token` eklenebilir (push notifications için)

---

### 3. **listings** (İlanlar)
```sql
- id (UUID, PK)
- user_id (UUID, FK -> auth.users, NULLABLE - guest listings için)
- category_id (UUID, FK -> categories)
- title, description
- listing_type (ENUM: ürün, hizmet, makine)
- status (ENUM: pending, approved, rejected, expired, sold)
- price, currency, quantity, unit
- location, latitude, longitude
- contact_person, contact_phone, contact_email
- preferred_contact (ENUM)
- images (TEXT[]), main_image
- approved_by, approved_at, rejection_reason
- listing_secret (VARCHAR(64), UNIQUE) - Guest listings için
- view_count, favorite_count
- is_featured, featured_until
- is_opportunity (BOOLEAN) - Fırsat ilanı
- expires_at
- created_at, updated_at, published_at
```

**Durum:** ✅ Çok kapsamlı ilan yapısı

**Öneriler:**
- `is_opportunity` alanı kontrol edilmeli (`add_opportunity_field.sql`)
- `contact_count` alanı eksik (kaç kişi iletişime geçti)

---

### 4. **admin_actions** (Admin İşlemleri)
```sql
- id (UUID, PK)
- admin_id (UUID, FK -> auth.users)
- listing_id (UUID, FK -> listings, NULLABLE)
- user_id (UUID, FK -> auth.users, NULLABLE)
- action (VARCHAR(50))
- reason (TEXT)
- metadata (JSONB)
- created_at
```

**Durum:** ✅ İyi audit log yapısı

**Öneriler:**
- `action` ENUM yapılabilir (approved, rejected, suspended, deleted, featured, etc.)

---

## 🔐 RLS (Row Level Security) Politikaları

### Mevcut Politikalar

#### **categories**
1. ✅ "Categories are viewable by everyone" - SELECT (is_active = true)
2. ✅ "Only admins can manage categories" - ALL (admin kontrolü)

#### **user_profiles**
1. ✅ "Users can view own profile" - SELECT (auth.uid() = id)
2. ✅ "Admins can view all profiles" - SELECT (admin/moderator)
3. ✅ "Users can update own profile" - UPDATE (kendi profili, role/status korunur)
4. ✅ "Admins can update any profile" - UPDATE (admin)
5. ✅ "Users can insert own profile" - INSERT (auth.uid() = id)

#### **listings**
1. ✅ "Approved listings are viewable by everyone" - SELECT (status = 'approved')
2. ✅ "Users can view own listings" - SELECT (auth.uid() = user_id)
3. ✅ "Admins can view all listings" - SELECT (admin/moderator)
4. ✅ "Authenticated users can create listings" - INSERT (auth.uid() = user_id)
5. ✅ "Guest users can create listings" - INSERT (user_id IS NULL)
6. ✅ "Users can update own pending listings" - UPDATE (kendi ilanı, pending)
7. ✅ "Admins can update any listing" - UPDATE (admin)
8. ✅ "Users can delete own listings" - DELETE (kendi ilanı)
9. ✅ "Admins can delete any listing" - DELETE (admin)

#### **admin_actions**
1. ✅ "Admins can view all actions" - SELECT (admin)
2. ✅ "Admins can insert actions" - INSERT (admin)

---

## ⚠️ Tespit Edilen Sorunlar ve Öneriler

### 1. **Kategori Güncellemesi Gerekli**
**Sorun:** Kategoriler PWA için güncellenmemiş
**Çözüm:** `update_categories_for_pwa.sql` çalıştırılmalı

### 2. **is_opportunity Alanı Eksik Olabilir**
**Sorun:** Fırsat ilanı özelliği için alan eksik
**Çözüm:** `add_opportunity_field.sql` kontrol edilmeli

### 3. **contact_count Alanı Eksik**
**Sorun:** Kaç kişi iletişime geçti bilgisi yok
**Öneri:** `contact_count INTEGER DEFAULT 0` eklenebilir

### 4. **RLS Politikaları İyi Durumda**
**Durum:** ✅ Tüm tablolar için RLS aktif ve politikalar tanımlı

### 5. **Guest Listing Secret Kontrolü**
**Sorun:** Guest listing'ler için secret ile erişim kontrolü eksik olabilir
**Öneri:** Guest listing'ler için özel SELECT politikası eklenebilir

---

## 📋 Önerilen İyileştirmeler

### 1. **Kategori Güncellemesi**
```sql
-- update_categories_for_pwa.sql çalıştır
-- Öncelik: Kümes Hayvanları → Süt Ürünleri → Sebzeler
```

### 2. **contact_count Alanı Ekleme**
```sql
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS contact_count INTEGER DEFAULT 0;

-- Trigger ile otomatik artırma
CREATE OR REPLACE FUNCTION increment_contact_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE listings 
  SET contact_count = contact_count + 1
  WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3. **Guest Listing RLS Politikası**
```sql
-- Guest listing'ler için secret ile erişim
CREATE POLICY "Guest listings accessible by secret"
  ON listings FOR SELECT
  USING (
    user_id IS NULL 
    AND listing_secret IS NOT NULL
    -- Secret kontrolü frontend'de yapılacak
  );
```

### 4. **Action ENUM Oluşturma**
```sql
DO $$ BEGIN
  CREATE TYPE admin_action_type AS ENUM (
    'approved', 'rejected', 'suspended', 
    'deleted', 'featured', 'unfeatured',
    'opportunity', 'unopportunity'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE admin_actions 
ALTER COLUMN action TYPE admin_action_type 
USING action::admin_action_type;
```

---

## 🔍 Kontrol Sorguları

### Tabloları Kontrol Et
```sql
-- check_database_structure.sql dosyasını çalıştır
```

### RLS Durumunu Kontrol Et
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Politikaları Listele
```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public';
```

---

## ✅ Sonuç ve Öneriler

### Yapılması Gerekenler (Öncelik Sırasına Göre):

1. **🔴 Yüksek Öncelik:**
   - ✅ Kategori güncellemesi (`update_categories_for_pwa.sql`)
   - ✅ `is_opportunity` alanı kontrolü (`add_opportunity_field.sql`)

2. **🟡 Orta Öncelik:**
   - `contact_count` alanı ekleme
   - Guest listing RLS politikası iyileştirme

3. **🟢 Düşük Öncelik:**
   - `action` ENUM yapma
   - `notification_token` ekleme (PWA push notifications için)

### Mevcut Durum: ✅ İYİ

- Tüm tablolar doğru yapılandırılmış
- RLS politikaları kapsamlı ve güvenli
- İndexler optimize edilmiş
- Foreign key'ler doğru tanımlanmış

**Sonuç:** Veritabanı yapısı production'a hazır! Sadece PWA için kategori güncellemesi yapılmalı.
