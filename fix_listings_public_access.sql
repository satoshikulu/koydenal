-- Listings tablosuna public okuma erişimi ekle
-- Bu SQL'i Supabase SQL Editor'de çalıştır

-- ADIM 1: Mevcut public SELECT politikasını kaldır (varsa)
DROP POLICY IF EXISTS "Public can view approved listings" ON listings;
DROP POLICY IF EXISTS "Anyone can view approved listings" ON listings;
DROP POLICY IF EXISTS "Public listings are viewable by everyone" ON listings;

-- ADIM 2: Public kullanıcıların sadece onaylanmış ilanları görmesini sağla
CREATE POLICY "Public can view approved listings"
ON listings
FOR SELECT
TO public
USING (status = 'approved');

-- ADIM 3: Authenticated kullanıcılar kendi ilanlarını görebilir
DROP POLICY IF EXISTS "Users can view own listings" ON listings;

CREATE POLICY "Users can view own listings"
ON listings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ADIM 4: Admin kullanıcılar TÜM ilanları görebilir (önceki politika)
-- Bu zaten fix_admin_listings_view.sql'de var

-- ADIM 5: Politikaları kontrol et
SELECT 
    policyname,
    cmd,
    roles,
    CASE 
        WHEN roles = '{public}' THEN 'Public'
        WHEN roles = '{authenticated}' THEN 'Authenticated'
        ELSE roles::text
    END as access_level
FROM pg_policies 
WHERE tablename = 'listings' 
AND cmd = 'SELECT'
ORDER BY roles;
