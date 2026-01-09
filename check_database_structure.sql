-- ============================================
-- VERİTABANI YAPISI KONTROL SORGULARI
-- Supabase CLI veya SQL Editor'da çalıştırın
-- ============================================

-- 1. TÜM TABLOLARI LİSTELE
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. KATEGORİLER TABLOSU KONTROL
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'categories'
ORDER BY ordinal_position;

-- 3. USER_PROFILES TABLOSU KONTROL
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 4. LISTINGS TABLOSU KONTROL
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'listings'
ORDER BY ordinal_position;

-- 5. ADMIN_ACTIONS TABLOSU KONTROL
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'admin_actions'
ORDER BY ordinal_position;

-- 6. RLS DURUMU KONTROL
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 7. RLS POLİTİKALARI LİSTELE
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 8. FOREIGN KEY'LER
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 9. İNDEXLER
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 10. VIEW'LAR
SELECT 
  table_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- 11. TRIGGER'LAR
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 12. FONKSİYONLAR
SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 13. ENUM TİPLERİ
SELECT
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('listing_status', 'user_role', 'user_status', 'listing_type', 'contact_preference')
ORDER BY t.typname, e.enumsortorder;

-- 14. TABLO İSTATİSTİKLERİ
SELECT 
  'categories' as table_name,
  COUNT(*) as row_count
FROM categories
UNION ALL
SELECT 
  'user_profiles',
  COUNT(*)
FROM user_profiles
UNION ALL
SELECT 
  'listings',
  COUNT(*)
FROM listings
UNION ALL
SELECT 
  'admin_actions',
  COUNT(*)
FROM admin_actions;

-- 15. KATEGORİLER LİSTESİ
SELECT 
  id,
  name,
  slug,
  icon,
  display_order,
  is_active
FROM categories
ORDER BY display_order, name;

-- 16. ADMIN KULLANICILAR
SELECT 
  id,
  email,
  full_name,
  role,
  status,
  created_at
FROM user_profiles
WHERE role IN ('admin', 'moderator')
ORDER BY created_at;

-- 17. İLAN DURUM İSTATİSTİKLERİ
SELECT 
  status,
  COUNT(*) as count
FROM listings
GROUP BY status
ORDER BY count DESC;
