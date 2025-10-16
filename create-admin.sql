-- =====================================================
-- ADMIN KULLANICI OLUŞTURMA SQL KOMUTLARI
-- =====================================================
-- Bu komutları Supabase SQL Editor'da çalıştırın

-- =====================================================
-- 1. AUTH.USERS TABLOSUNA ADMIN KULLANICI EKLE
-- =====================================================
-- NOT: Bu komut manuel çalıştırılmalıdır çünkü auth.users
-- Supabase tarafından özel yönetilir

-- Supabase Dashboard > Authentication > Users > Add User ile:
-- Email: satoshinakamototokyo42@gmail.com
-- Password: Sevimbebe4242.
-- Auto Confirm Email: ✅ işaretleyin

-- =====================================================
-- 2. USER_PROFILES TABLOSUNA ADMIN ROLÜ ATA
-- =====================================================

-- Önce kullanıcıyı auth.users'ta oluşturun, sonra bu komutu çalıştırın:

INSERT INTO user_profiles (id, email, full_name, phone, location, role, created_at, updated_at)
SELECT
  id,
  email,
  'Admin Kullanıcı',
  '+90 555 987 6543',
  'Kulu, Konya',
  'admin',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'satoshinakamototokyo42@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  updated_at = NOW();

-- =====================================================
-- 3. DOĞRULAMA SORGUSU
-- =====================================================

-- Admin kullanıcısını kontrol et
SELECT
  u.email,
  p.full_name,
  p.role,
  p.created_at
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE u.email = 'satoshinakamototokyo42@gmail.com';

-- Tüm admin kullanıcılarını listele
SELECT
  u.email,
  p.full_name,
  p.role
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE p.role = 'admin';

-- =====================================================
-- KURULUM TAMAMLANDI!
-- =====================================================

SELECT '🎉 Admin kullanıcısı başarıyla oluşturuldu!' as status;
