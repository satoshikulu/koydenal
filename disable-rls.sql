-- =====================================================
-- RLS POLİTİKALARINI İPTAL ET - HERKES İÇİN AÇIK SİSTEM
-- =====================================================

-- ADIM 1: RLS'yi tamamen devre dışı bırak
ALTER TABLE listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- ADIM 2: Tüm mevcut politikaları kaldır
DROP POLICY IF EXISTS "Anyone can view approved listings" ON listings;
DROP POLICY IF EXISTS "Users can insert own listings" ON listings;
DROP POLICY IF EXISTS "Users can update own listings" ON listings;
DROP POLICY IF EXISTS "Admins can manage all listings" ON listings;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

DROP POLICY IF EXISTS "Admins can view admin actions" ON admin_actions;
DROP POLICY IF EXISTS "Admins can insert admin actions" ON admin_actions;

-- ADIM 3: Herkes için açık politikalar oluştur (üyelik gerekmez)

-- Listings tablosu için: HERKES her şeyi yapabilir
CREATE POLICY "Everyone can do everything on listings" ON listings
    FOR ALL USING (true) WITH CHECK (true);

-- User profiles tablosu için: HERKES her şeyi yapabilir
CREATE POLICY "Everyone can do everything on profiles" ON user_profiles
    FOR ALL USING (true) WITH CHECK (true);

-- Admin actions tablosu için: HERKES her şeyi yapabilir
CREATE POLICY "Everyone can do everything on admin_actions" ON admin_actions
    FOR ALL USING (true) WITH CHECK (true);

-- Categories tablosu için: HERKES her şeyi yapabilir
CREATE POLICY "Everyone can do everything on categories" ON categories
    FOR ALL USING (true) WITH CHECK (true);

-- ADIM 4: Kontrol et
SELECT 'RLS politikaları başarıyla iptal edildi!' as status;

-- Politika kontrolü
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public';
