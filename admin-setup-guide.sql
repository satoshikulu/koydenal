-- =====================================================
-- MEVCUT SORUNLARI ÇÖZMEK İÇİN ADIM ADIM KILAVUZ
-- =====================================================

-- ADIM 1: SUPABASE DASHBOARD'A GİDİN
-- https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql

-- ADIM 2: SQL EDITOR'DE AŞAĞIDAKİ KODLARI ÇALIŞTIRIN

-- Önce mevcut sorunlu tabloları temizleyin:
/*
DROP TABLE IF EXISTS admin_actions CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
*/

-- ADIM 3: DOĞRU ŞEMAYI OLUŞTURUN (correct-schema.sql içeriğini kopyalayın)

-- ADIM 4: ADMİN KULLANICISI OLUŞTURUN
/*
-- 1. Authentication > Users > Add User
-- Email: admin@koydendal.com
-- Password: güçlü şifre belirleyin

-- 2. SQL Editor'de çalıştırın:
INSERT INTO user_profiles (id, email, full_name, phone, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@koydendal.com'),
  'admin@koydendal.com',
  'Sistem Admini',
  '+905551234567',
  'admin'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  updated_at = NOW();
*/

-- ADIM 5: TEST İLANI EKLEYİN
/*
INSERT INTO listings (
  title,
  description,
  price,
  currency,
  location,
  category_id,
  listing_type,
  status,
  quantity,
  unit,
  contact_phone,
  contact_email,
  contact_person,
  images,
  main_image,
  user_id,
  created_at,
  updated_at
) VALUES (
  'Test İlanı - Organik Domates',
  'Bu bir test ilanıdır. Admin panelinde görünmelidir.',
  25.50,
  'TRY',
  'Kulu Merkez',
  (SELECT id FROM categories WHERE name = 'Sebzeler' LIMIT 1),
  'ürün',
  'pending',
  100,
  'kg',
  '+905551234567',
  'test@example.com',
  'Test Kullanıcı',
  ARRAY['https://picsum.photos/400/300?random=1'],
  'https://picsum.photos/400/300?random=1',
  (SELECT id FROM auth.users WHERE email = 'test@example.com' LIMIT 1),
  NOW(),
  NOW()
);
*/

-- ADIM 6: KONTROL EDİN
/*
SELECT 'TOPLAM İLAN:' as info, COUNT(*) FROM listings;
SELECT 'BEKLEYEN İLANLAR:' as info, COUNT(*) FROM listings WHERE status = 'pending';
SELECT 'ADMİN KULLANICILARI:' as info, COUNT(*) FROM user_profiles WHERE role = 'admin';
*/

-- =====================================================
-- SORUNLARIN NEDENİ:
-- =====================================================
-- 1. Eski şemada kolon tipleri hatalıydı (TEXT yerine VARCHAR)
-- 2. RLS politikaları eksik veya hatalıydı
-- 3. Admin kullanıcısı doğru şekilde tanımlanmamıştı
-- 4. İlan oluşturma sırasında user_id eşleşmesi sorunluydu

-- BU ADIMLARI TAKİP EDİN VE ADMİN PANELİ ÇALIŞACAKTIR!
