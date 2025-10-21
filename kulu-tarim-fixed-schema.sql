-- =====================================================
-- KULU TARIM - TAM VERİTABANI ŞEMASI (DÜZELTİLMİŞ)
-- Sevim tarafından yapılmıştır
-- =====================================================

-- =====================================================
-- 1. TABLOLARIN OLUŞTURULMASI
-- =====================================================

-- Kategoriler tablosu
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İlanlar tablosu
CREATE TABLE IF NOT EXISTS listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'TRY',
  location TEXT,
  category_id UUID REFERENCES categories(id),
  listing_type TEXT DEFAULT 'ürün',
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  quantity DECIMAL(10,2),
  unit TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  contact_person TEXT,
  images TEXT[],
  main_image TEXT,
  user_id UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kullanıcı profilleri tablosu
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user', -- user, admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin işlemlerinin loglanması
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id),
  admin_id UUID REFERENCES auth.users(id),
  action TEXT, -- approved, rejected
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. RLS (ROW LEVEL SECURITY) POLİTİKALARI
-- =====================================================

-- Kategoriler için RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes kategorileri görüntüleyebilir" ON categories
FOR SELECT USING (true);

-- İlanlar için RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes onaylanmış ilanları görüntüleyebilir" ON listings
FOR SELECT USING (status = 'approved');

CREATE POLICY "Kullanıcılar kendi ilanlarını görüntüleyebilir" ON listings
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi ilanlarını oluşturabilir" ON listings
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi ilanlarını güncelleyebilir" ON listings
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Adminler tüm ilanları görüntüleyebilir" ON listings
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

CREATE POLICY "Adminler tüm ilanları güncelleyebilir" ON listings
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Kullanıcı profilleri için RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes profilleri görüntüleyebilir" ON user_profiles
FOR SELECT USING (true);

CREATE POLICY "Kullanıcılar kendi profillerini güncelleyebilir" ON user_profiles
FOR UPDATE USING (auth.uid() = id);

-- Admin işlemleri için RLS
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Adminler işlemleri görüntüleyebilir" ON admin_actions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

CREATE POLICY "Adminler işlem ekleyebilir" ON admin_actions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- =====================================================
-- 3. TRIGGER FONKSİYONLARI
-- =====================================================

-- updated_at alanlarını otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_updated_at 
BEFORE UPDATE ON categories 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at 
BEFORE UPDATE ON listings 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
BEFORE UPDATE ON user_profiles 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. VARSAYILAN VERİLER
-- =====================================================

-- Varsayılan kategoriler
INSERT INTO categories (name, icon, description) VALUES
  ('Sebzeler', '🥬', 'Taze sebzeler ve yapraklı yeşillikler'),
  ('Meyveler', '🍎', 'Mevsimine uygun meyveler'),
  ('Tahıllar', '🌾', 'Buğday, arpa, yulaf gibi tahıllar'),
  ('Bakliyat', '🥜', 'Mercimek, nohut, fasulye gibi bakliyatlar'),
  ('Hayvancılık', '🐄', 'Besi hayvanları ve küçükbaş hayvanlar'),
  ('Süt Ürünleri', '🥛', 'Süt, yoğurt, peynir gibi ürünler'),
  ('Yem & Tohum', '🌱', 'Hayvan yemleri ve tohumlar'),
  ('Tarım Ekipmanları', '🚜', 'Traktörler, pulluklar ve diğer ekipmanlar')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 5. SUPABASE AUTH ENTEGRASYONU
-- =====================================================

-- Kullanıcı kayıt olduğunda otomatik profil oluşturma
-- Önce mevcut trigger'ı sil (eğer varsa)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 6. GÖRÜNÜMLER (VIEWS)
-- =====================================================

-- Admin dashboard için onay bekleyen ilanlar
CREATE OR REPLACE VIEW pending_listings AS
SELECT 
  l.id,
  l.title,
  l.description,
  l.price,
  l.currency,
  l.location,
  c.name as category_name,
  l.listing_type,
  l.quantity,
  l.unit,
  l.contact_phone,
  l.contact_email,
  l.contact_person,
  l.images,
  l.main_image,
  l.user_id,
  up.full_name as user_name,
  up.email as user_email,
  up.phone as user_phone,
  l.created_at,
  l.updated_at
FROM listings l
LEFT JOIN categories c ON l.category_id = c.id
LEFT JOIN user_profiles up ON l.user_id = up.id
WHERE l.status = 'pending'
ORDER BY l.created_at DESC;

-- Onaylanmış ilanlar
CREATE OR REPLACE VIEW approved_listings AS
SELECT 
  l.id,
  l.title,
  l.description,
  l.price,
  l.currency,
  l.location,
  c.name as category_name,
  l.listing_type,
  l.quantity,
  l.unit,
  l.contact_phone,
  l.contact_email,
  l.contact_person,
  l.images,
  l.main_image,
  l.user_id,
  up.full_name as user_name,
  l.created_at,
  l.updated_at
FROM listings l
LEFT JOIN categories c ON l.category_id = c.id
LEFT JOIN user_profiles up ON l.user_id = up.id
WHERE l.status = 'approved'
ORDER BY l.created_at DESC;

-- Reddedilmiş ilanlar
CREATE OR REPLACE VIEW rejected_listings AS
SELECT 
  l.id,
  l.title,
  l.description,
  l.price,
  l.currency,
  l.location,
  c.name as category_name,
  l.listing_type,
  l.quantity,
  l.unit,
  l.contact_phone,
  l.contact_email,
  l.contact_person,
  l.images,
  l.main_image,
  l.user_id,
  up.full_name as user_name,
  l.rejection_reason,
  l.created_at,
  l.updated_at
FROM listings l
LEFT JOIN categories c ON l.category_id = c.id
LEFT JOIN user_profiles up ON l.user_id = up.id
WHERE l.status = 'rejected'
ORDER BY l.created_at DESC;

-- =====================================================
-- 7. İZİNLER
-- =====================================================

-- Anonim kullanıcıların erişebileceği tablolar
GRANT SELECT ON categories TO anon;
GRANT SELECT ON approved_listings TO anon;

-- Kimlik doğrulamış kullanıcıların erişebileceği tablolar
GRANT SELECT, INSERT, UPDATE ON listings TO authenticated;
GRANT SELECT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT ON categories TO authenticated;
GRANT SELECT ON pending_listings TO authenticated;
GRANT SELECT ON approved_listings TO authenticated;
GRANT SELECT ON rejected_listings TO authenticated;

-- Admin kullanıcıların erişebileceği tablolar
GRANT ALL ON listings TO authenticated;
GRANT ALL ON admin_actions TO authenticated;
GRANT ALL ON categories TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON pending_listings TO authenticated;
GRANT ALL ON approved_listings TO authenticated;
GRANT ALL ON rejected_listings TO authenticated;

-- =====================================================
-- 8. STORAGE (GÖRSEL YÜKLEME) AYARLARI
-- =====================================================

-- Bu ayarlar Supabase Dashboard > Storage bölümünden yapılmalıdır:
-- 1. "listings" adında bir bucket oluşturun
-- 2. Bucket için şu izinleri ayarlayın:
/*
create bucket "listings" with public access
insert into storage.buckets (id, name, public) values ('listings', 'listings', true);

-- RLS politikaları
create policy "İlan görselleri herkese açık"
on storage.objects for select
using ( bucket_id = 'listings' );

create policy "Kimlik doğrulamış kullanıcılar görsel yükleyebilir"
on storage.objects for insert
with check ( bucket_id = 'listings' and auth.role() = 'authenticated' );

create policy "Kullanıcılar kendi görsellerini güncelleyebilir"
on storage.objects for update
using ( bucket_id = 'listings' and auth.uid() = owner );

create policy "Kullanıcılar kendi görsellerini silebilir"
on storage.objects for delete
using ( bucket_id = 'listings' and auth.uid() = owner );
*/

-- =====================================================
-- 9. ADMIN KULLANICISI OLUŞTURMA
-- =====================================================

-- İlk admin kullanıcısı oluşturulduktan sonra aşağıdaki komutla rolünü güncelleyin:
/*
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'admin@kulutarim.com';  -- Buraya gerçek admin emailinizi yazın
*/

-- =====================================================
-- 10. KULLANIM ÖRNEKLERİ
-- =====================================================

/*
-- Yeni bir ilan eklemek:
INSERT INTO listings (
  title, description, price, currency, location, 
  category_id, listing_type, status, quantity, unit,
  contact_phone, contact_email, contact_person,
  images, main_image, user_id
) VALUES (
  'Organik Domates', 
  'Lezzetli organik domates satılık', 
  25.50, 'TRY', 'Kulu Merkez',
  (SELECT id FROM categories WHERE name = 'Sebzeler' LIMIT 1),
  'ürün', 'pending', 100, 'kg',
  '+905551234567', 'test@example.com', 'Test Kullanıcı',
  ARRAY['https://example.com/image1.jpg'], 
  'https://example.com/image1.jpg',
  'USER_UUID_BURAYA'
);

-- Admin olarak ilan onaylamak:
UPDATE listings 
SET status = 'approved', approved_by = 'ADMIN_UUID', approved_at = NOW()
WHERE id = 'ILAN_ID_BURAYA';

-- Admin olarak ilan reddetmek:
UPDATE listings 
SET status = 'rejected', approved_by = 'ADMIN_UUID', approved_at = NOW(), rejection_reason = 'Uygun değil'
WHERE id = 'ILAN_ID_BURAYA';

-- Onay bekleyen ilanları listelemek (sadece adminler):
SELECT * FROM pending_listings;

-- Onaylanmış ilanları listelemek:
SELECT * FROM approved_listings;
*/-- =====================================================
-- KULU TARIM - TAM VERİTABANI ŞEMASI (DÜZELTİLMİŞ)
-- Sevim tarafından yapılmıştır
-- =====================================================

-- =====================================================
-- 1. TABLOLARIN OLUŞTURULMASI
-- =====================================================

-- Kategoriler tablosu
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İlanlar tablosu
CREATE TABLE IF NOT EXISTS listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'TRY',
  location TEXT,
  category_id UUID REFERENCES categories(id),
  listing_type TEXT DEFAULT 'ürün',
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  quantity DECIMAL(10,2),
  unit TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  contact_person TEXT,
  images TEXT[],
  main_image TEXT,
  user_id UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kullanıcı profilleri tablosu
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user', -- user, admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin işlemlerinin loglanması
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id),
  admin_id UUID REFERENCES auth.users(id),
  action TEXT, -- approved, rejected
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. RLS (ROW LEVEL SECURITY) POLİTİKALARI
-- =====================================================

-- Kategoriler için RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes kategorileri görüntüleyebilir" ON categories
FOR SELECT USING (true);

-- İlanlar için RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes onaylanmış ilanları görüntüleyebilir" ON listings
FOR SELECT USING (status = 'approved');

CREATE POLICY "Kullanıcılar kendi ilanlarını görüntüleyebilir" ON listings
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi ilanlarını oluşturabilir" ON listings
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi ilanlarını güncelleyebilir" ON listings
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Adminler tüm ilanları görüntüleyebilir" ON listings
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

CREATE POLICY "Adminler tüm ilanları güncelleyebilir" ON listings
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Kullanıcı profilleri için RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes profilleri görüntüleyebilir" ON user_profiles
FOR SELECT USING (true);

CREATE POLICY "Kullanıcılar kendi profillerini güncelleyebilir" ON user_profiles
FOR UPDATE USING (auth.uid() = id);

-- Admin işlemleri için RLS
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Adminler işlemleri görüntüleyebilir" ON admin_actions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

CREATE POLICY "Adminler işlem ekleyebilir" ON admin_actions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- =====================================================
-- 3. TRIGGER FONKSİYONLARI
-- =====================================================

-- updated_at alanlarını otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_updated_at 
BEFORE UPDATE ON categories 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at 
BEFORE UPDATE ON listings 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
BEFORE UPDATE ON user_profiles 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. VARSAYILAN VERİLER
-- =====================================================

-- Varsayılan kategoriler
INSERT INTO categories (name, icon, description) VALUES
  ('Sebzeler', '🥬', 'Taze sebzeler ve yapraklı yeşillikler'),
  ('Meyveler', '🍎', 'Mevsimine uygun meyveler'),
  ('Tahıllar', '🌾', 'Buğday, arpa, yulaf gibi tahıllar'),
  ('Bakliyat', '🥜', 'Mercimek, nohut, fasulye gibi bakliyatlar'),
  ('Hayvancılık', '🐄', 'Besi hayvanları ve küçükbaş hayvanlar'),
  ('Süt Ürünleri', '🥛', 'Süt, yoğurt, peynir gibi ürünler'),
  ('Yem & Tohum', '🌱', 'Hayvan yemleri ve tohumlar'),
  ('Tarım Ekipmanları', '🚜', 'Traktörler, pulluklar ve diğer ekipmanlar')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 5. SUPABASE AUTH ENTEGRASYONU
-- =====================================================

-- Kullanıcı kayıt olduğunda otomatik profil oluşturma
-- Önce mevcut trigger'ı sil (eğer varsa)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 6. GÖRÜNÜMLER (VIEWS)
-- =====================================================

-- Admin dashboard için onay bekleyen ilanlar
CREATE OR REPLACE VIEW pending_listings AS
SELECT 
  l.id,
  l.title,
  l.description,
  l.price,
  l.currency,
  l.location,
  c.name as category_name,
  l.listing_type,
  l.quantity,
  l.unit,
  l.contact_phone,
  l.contact_email,
  l.contact_person,
  l.images,
  l.main_image,
  l.user_id,
  up.full_name as user_name,
  up.email as user_email,
  up.phone as user_phone,
  l.created_at,
  l.updated_at
FROM listings l
LEFT JOIN categories c ON l.category_id = c.id
LEFT JOIN user_profiles up ON l.user_id = up.id
WHERE l.status = 'pending'
ORDER BY l.created_at DESC;

-- Onaylanmış ilanlar
CREATE OR REPLACE VIEW approved_listings AS
SELECT 
  l.id,
  l.title,
  l.description,
  l.price,
  l.currency,
  l.location,
  c.name as category_name,
  l.listing_type,
  l.quantity,
  l.unit,
  l.contact_phone,
  l.contact_email,
  l.contact_person,
  l.images,
  l.main_image,
  l.user_id,
  up.full_name as user_name,
  l.created_at,
  l.updated_at
FROM listings l
LEFT JOIN categories c ON l.category_id = c.id
LEFT JOIN user_profiles up ON l.user_id = up.id
WHERE l.status = 'approved'
ORDER BY l.created_at DESC;

-- Reddedilmiş ilanlar
CREATE OR REPLACE VIEW rejected_listings AS
SELECT 
  l.id,
  l.title,
  l.description,
  l.price,
  l.currency,
  l.location,
  c.name as category_name,
  l.listing_type,
  l.quantity,
  l.unit,
  l.contact_phone,
  l.contact_email,
  l.contact_person,
  l.images,
  l.main_image,
  l.user_id,
  up.full_name as user_name,
  l.rejection_reason,
  l.created_at,
  l.updated_at
FROM listings l
LEFT JOIN categories c ON l.category_id = c.id
LEFT JOIN user_profiles up ON l.user_id = up.id
WHERE l.status = 'rejected'
ORDER BY l.created_at DESC;

-- =====================================================
-- 7. İZİNLER
-- =====================================================

-- Anonim kullanıcıların erişebileceği tablolar
GRANT SELECT ON categories TO anon;
GRANT SELECT ON approved_listings TO anon;

-- Kimlik doğrulamış kullanıcıların erişebileceği tablolar
GRANT SELECT, INSERT, UPDATE ON listings TO authenticated;
GRANT SELECT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT ON categories TO authenticated;
GRANT SELECT ON pending_listings TO authenticated;
GRANT SELECT ON approved_listings TO authenticated;
GRANT SELECT ON rejected_listings TO authenticated;

-- Admin kullanıcıların erişebileceği tablolar
GRANT ALL ON listings TO authenticated;
GRANT ALL ON admin_actions TO authenticated;
GRANT ALL ON categories TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON pending_listings TO authenticated;
GRANT ALL ON approved_listings TO authenticated;
GRANT ALL ON rejected_listings TO authenticated;

-- =====================================================
-- 8. STORAGE (GÖRSEL YÜKLEME) AYARLARI
-- =====================================================

-- Bu ayarlar Supabase Dashboard > Storage bölümünden yapılmalıdır:
-- 1. "listings" adında bir bucket oluşturun
-- 2. Bucket için şu izinleri ayarlayın:
/*
create bucket "listings" with public access
insert into storage.buckets (id, name, public) values ('listings', 'listings', true);

-- RLS politikaları
create policy "İlan görselleri herkese açık"
on storage.objects for select
using ( bucket_id = 'listings' );

create policy "Kimlik doğrulamış kullanıcılar görsel yükleyebilir"
on storage.objects for insert
with check ( bucket_id = 'listings' and auth.role() = 'authenticated' );

create policy "Kullanıcılar kendi görsellerini güncelleyebilir"
on storage.objects for update
using ( bucket_id = 'listings' and auth.uid() = owner );

create policy "Kullanıcılar kendi görsellerini silebilir"
on storage.objects for delete
using ( bucket_id = 'listings' and auth.uid() = owner );
*/

-- =====================================================
-- 9. ADMIN KULLANICISI OLUŞTURMA
-- =====================================================

-- İlk admin kullanıcısı oluşturulduktan sonra aşağıdaki komutla rolünü güncelleyin:
/*
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'admin@kulutarim.com';  -- Buraya gerçek admin emailinizi yazın
*/

-- =====================================================
-- 10. KULLANIM ÖRNEKLERİ
-- =====================================================

/*
-- Yeni bir ilan eklemek:
INSERT INTO listings (
  title, description, price, currency, location, 
  category_id, listing_type, status, quantity, unit,
  contact_phone, contact_email, contact_person,
  images, main_image, user_id
) VALUES (
  'Organik Domates', 
  'Lezzetli organik domates satılık', 
  25.50, 'TRY', 'Kulu Merkez',
  (SELECT id FROM categories WHERE name = 'Sebzeler' LIMIT 1),
  'ürün', 'pending', 100, 'kg',
  '+905551234567', 'test@example.com', 'Test Kullanıcı',
  ARRAY['https://example.com/image1.jpg'], 
  'https://example.com/image1.jpg',
  'USER_UUID_BURAYA'
);

-- Admin olarak ilan onaylamak:
UPDATE listings 
SET status = 'approved', approved_by = 'ADMIN_UUID', approved_at = NOW()
WHERE id = 'ILAN_ID_BURAYA';

-- Admin olarak ilan reddetmek:
UPDATE listings 
SET status = 'rejected', approved_by = 'ADMIN_UUID', approved_at = NOW(), rejection_reason = 'Uygun değil'
WHERE id = 'ILAN_ID_BURAYA';

-- Onay bekleyen ilanları listelemek (sadece adminler):
SELECT * FROM pending_listings;

-- Onaylanmış ilanları listelemek:
SELECT * FROM approved_listings;
*/