-- Admin kullanıcılarının tüm ilanları görebilmesi için RLS politikası
-- Bu SQL'i Supabase SQL Editor'de çalıştır

-- ADIM 1: Mevcut politikaları kontrol et
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'listings' 
AND cmd = 'SELECT';

-- ADIM 2: Eski admin select politikalarını kaldır (varsa)
DROP POLICY IF EXISTS "Admins can view all listings" ON listings;
DROP POLICY IF EXISTS "Admin can view all listings" ON listings;
DROP POLICY IF EXISTS "Admins can select all listings" ON listings;
DROP POLICY IF EXISTS "Admin users can view all listings" ON listings;

-- ADIM 3: Yeni admin select politikası oluştur
-- Bu politika admin kullanıcılarının TÜM ilanları görmesini sağlar
CREATE POLICY "Admin users can view all listings"
ON listings
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
        AND user_profiles.status = 'approved'
    )
);

-- ADIM 4: Admin kullanıcılarının ilanları güncelleyebilmesi için politika
DROP POLICY IF EXISTS "Admins can update all listings" ON listings;
DROP POLICY IF EXISTS "Admin can update all listings" ON listings;
DROP POLICY IF EXISTS "Admin users can update all listings" ON listings;

CREATE POLICY "Admin users can update all listings"
ON listings
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
        AND user_profiles.status = 'approved'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
        AND user_profiles.status = 'approved'
    )
);

-- ADIM 5: Admin kullanıcılarının ilanları silebilmesi için politika
DROP POLICY IF EXISTS "Admins can delete all listings" ON listings;
DROP POLICY IF EXISTS "Admin can delete all listings" ON listings;
DROP POLICY IF EXISTS "Admin users can delete all listings" ON listings;

CREATE POLICY "Admin users can delete all listings"
ON listings
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
        AND user_profiles.status = 'approved'
    )
);

-- ADIM 6: Test sorgusu - admin olarak giriş yaptıktan sonra çalıştır
-- SELECT * FROM listings WHERE status = 'pending';

-- ADIM 7: Politikaların oluşturulduğunu doğrula
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'listings' 
AND policyname LIKE '%Admin%'
ORDER BY cmd;
