-- =====================================================
-- SUPABASE AUTH İLE UYUMLU ÜYE SİSTEMİ KURULUMU
-- =====================================================

-- ADIM 1: ŞEMAYI OLUŞTUR
-- supabase-compatible-schema.sql içeriğini çalıştırın

-- ADIM 2: ADMİN KULLANICISI OLUŞTUR
-- 1. Supabase Dashboard > Authentication > Users > Add User
-- Email: admin@koydendal.com
-- Password: güçlü şifre (örn: Admin123!@#)

-- 2. SQL Editor'da çalıştırın:
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

-- ADIM 3: TEST İLANI EKLE
-- supabase-compatible-schema.sql çalıştırıldıktan sonra:

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
  'Bu bir test ilanıdır. Sistem çalışıp çalışmadığını kontrol etmek için.',
  25.50,
  'TRY',
  'Kulu Merkez',
  (SELECT id FROM categories WHERE name = 'Sebzeler' LIMIT 1),
  'ürün',
  'approved',
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

-- ADIM 4: KONTROL EDİN
SELECT 'TOPLAM İLAN:' as info, COUNT(*) FROM listings;
SELECT 'TOPLAM KATEGORİ:' as info, COUNT(*) FROM categories;
SELECT 'ADMİN KULLANICILARI:' as info, COUNT(*) FROM user_profiles WHERE role = 'admin';

-- =====================================================
-- ÖNEMLİ NOTLAR:
-- =====================================================
-- 1. Bu şema Supabase Auth sistemi ile uyumludur
-- 2. Üye olmadan da ilan eklenebilir (user_id boş bırakılabilir)
-- 3. Üye olanlar kendi ilanlarını yönetebilir
-- 4. Admin onay sistemi isteğe bağlı çalışır
-- 5. Tüm işlemler hem üye hem üye olmayanlar için çalışır
