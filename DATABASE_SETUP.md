# Kulu Tarım Veritabanı Kurulumu

## Genel Bakış

Bu belge, Kulu Tarım projesi için gerekli olan Supabase veritabanı şemasının nasıl kurulacağını açıklar. Şema, ilan yönetimi, kullanıcı kimlik doğrulama, admin onay sistemi ve kategori yönetimi gibi özellikleri içerir.

## Gereksinimler

- Supabase hesabı
- Proje erişim izinleri
- SQL bilgisi

## Kurulum Adımları

### 1. Supabase Dashboard Erişimi

1. [Supabase Dashboard](https://supabase.com/dashboard) adresine gidin
2. Projenizi seçin
3. Sol menüden "SQL Editor" sekmesine tıklayın

### 2. Veritabanı Şemasının Kurulumu

1. `kulu-tarim-complete-schema.sql` dosyasının içeriğini kopyalayın
2. SQL Editor'e yapıştırın
3. "RUN" butonuna tıklayarak şemayı oluşturun

### 3. Admin Kullanıcısının Oluşturulması

1. Sol menüden "Authentication" > "Users" sekmesine gidin
2. "Add User" butonuna tıklayın
3. Email ve güçlü bir şifre belirleyin
4. Kullanıcıyı oluşturun
5. SQL Editor'de aşağıdaki komutu çalıştırarak kullanıcıya admin rolü atayın:

```sql
UPDATE user_profiles 
SET role = 'admin'
WHERE email = 'admin@example.com';
```

### 4. Storage Ayarları

1. Sol menüden "Storage" sekmesine gidin
2. "Create bucket" butonuna tıklayın
3. "listings" adında bir bucket oluşturun
4. Bucket'ı public yapın
5. Aşağıdaki RLS politikalarını ekleyin:

```sql
-- Görüntüleme izni
create policy "İlan görselleri herkese açık"
on storage.objects for select
using ( bucket_id = 'listings' );

-- Yükleme izni
create policy "Kimlik doğrulamış kullanıcılar görsel yükleyebilir"
on storage.objects for insert
with check ( bucket_id = 'listings' and auth.role() = 'authenticated' );

-- Güncelleme izni
create policy "Kullanıcılar kendi görsellerini güncelleyebilir"
on storage.objects for update
using ( bucket_id = 'listings' and auth.uid() = owner );

-- Silme izni
create policy "Kullanıcılar kendi görsellerini silebilir"
on storage.objects for delete
using ( bucket_id = 'listings' and auth.uid() = owner );
```

## Veritabanı Yapısı

### Tablolar

#### categories
- `id` (UUID, primary key)
- `name` (TEXT, unique)
- `icon` (TEXT)
- `description` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### listings
- `id` (UUID, primary key)
- `title` (TEXT)
- `description` (TEXT)
- `price` (DECIMAL)
- `currency` (TEXT, default: 'TRY')
- `location` (TEXT)
- `category_id` (UUID, foreign key to categories)
- `listing_type` (TEXT, default: 'ürün')
- `status` (TEXT, default: 'pending') - pending, approved, rejected
- `quantity` (DECIMAL)
- `unit` (TEXT)
- `contact_phone` (TEXT)
- `contact_email` (TEXT)
- `contact_person` (TEXT)
- `images` (TEXT[])
- `main_image` (TEXT)
- `user_id` (UUID, foreign key to auth.users)
- `approved_by` (UUID, foreign key to auth.users)
- `approved_at` (TIMESTAMP)
- `rejection_reason` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### user_profiles
- `id` (UUID, primary key, foreign key to auth.users)
- `email` (TEXT, unique)
- `full_name` (TEXT)
- `phone` (TEXT)
- `role` (TEXT, default: 'user') - user, admin
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### admin_actions
- `id` (UUID, primary key)
- `listing_id` (UUID, foreign key to listings)
- `admin_id` (UUID, foreign key to auth.users)
- `action` (TEXT) - approved, rejected
- `reason` (TEXT)
- `created_at` (TIMESTAMP)

### Görünümler (Views)

#### pending_listings
Onay bekleyen ilanları gösterir. Sadece admin kullanıcılar tarafından erişilebilir.

#### approved_listings
Onaylanmış ilanları gösterir. Herkes tarafından erişilebilir.

## Güvenlik

### RLS (Row Level Security) Politikaları

Tüm tablolar için RLS politikaları tanımlanmıştır:

- Kategoriler herkes tarafından görüntülenebilir
- İlanlar sadece sahibi veya admin tarafından görüntülenebilir
- Onaylanmış ilanlar herkes tarafından görüntülenebilir
- Kullanıcı profilleri herkes tarafından görüntülenebilir
- Admin işlemleri sadece admin kullanıcılar tarafından görüntülenebilir

## Test

### Test Verilerinin Eklenmesi

```sql
-- Test kategorisi
INSERT INTO categories (name, icon, description) VALUES
  ('Test Kategorisi', '🧪', 'Test amaçlı kategori')
ON CONFLICT (name) DO NOTHING;

-- Test ilanı
INSERT INTO listings (
  title, description, price, currency, location, 
  category_id, listing_type, status, quantity, unit,
  contact_phone, contact_email, contact_person,
  images, main_image, user_id
) VALUES (
  'Test İlanı', 
  'Bu bir test ilanıdır', 
  100.00, 'TRY', 'Kulu',
  (SELECT id FROM categories WHERE name = 'Test Kategorisi' LIMIT 1),
  'ürün', 'pending', 10, 'adet',
  '+905551234567', 'test@example.com', 'Test Kullanıcı',
  ARRAY['https://example.com/image1.jpg'], 
  'https://example.com/image1.jpg',
  'USER_UUID_BURAYA'
);
```

## Sorun Giderme

### Yaygın Sorunlar

1. **Tablolar oluşturulamıyor**: Mevcut tabloları temizleyin ve tekrar deneyin
2. **RLS politikaları çalışmıyor**: Politikaların doğru tanımlandığını kontrol edin
3. **Admin erişimi yok**: Kullanıcının admin rolü olduğundan emin olun
4. **Trigger çakışmaları**: `on_auth_user_created` trigger'ı zaten mevcutsa, önce mevcut trigger'ı silin

### Otomatik Sorun Giderme

Projede bulunan `troubleshoot-db.js` scripti ile otomatik sorun giderme yapabilirsiniz:

```bash
npm run troubleshoot-db
```

### Manuel Sorun Giderme

#### Trigger Çakışması (ERROR: 42710: trigger "on_auth_user_created" for relation "users" already exists)

Bu hata, aynı isimli bir trigger zaten var demektir. Çözmek için:

1. SQL Editor'de aşağıdaki komutu çalıştırın:

```sql
-- Önce mevcut trigger'ı sil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Ardından trigger fonksiyonunu yeniden oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Yeni trigger'ı oluştur
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### Tablo Silme

Eğer tabloları yeniden oluşturmanız gerekirse:

```sql
DROP TABLE IF EXISTS admin_actions CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
```

Dikkat: Bu işlem tüm verileri siler!

## Yardım

Sorunlarla karşılaşırsanız:
1. Supabase Dashboard'daki hata mesajlarını kontrol edin
2. SQL sorgularınızın doğru olduğundan emin olun
3. Gerekirse destek ekibiyle iletişime geçin

---

*Bu belge Sevim tarafından yapılmıştır*