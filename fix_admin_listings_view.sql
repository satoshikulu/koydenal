-- Admin kullanıcılarının tüm ilanları görebilmesi için RLS politikası

-- Önce mevcut admin select politikasını kontrol et
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'listings' 
AND cmd = 'SELECT';

-- Eğer admin için select politikası yoksa veya yanlışsa, düzelt:

-- Önce eski politikayı kaldır (varsa)
DROP POLICY IF EXISTS "Admins can view all listings" ON listings;
DROP POLICY IF EXISTS "Admin can view all listings" ON listings;
DROP POLICY IF EXISTS "Admins can select all listings" ON listings;

-- Yeni admin select politikası oluştur
CREATE POLICY "Admins can view all listings"
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

-- Test sorgusu - admin olarak giriş yaptıktan sonra çalıştır
-- SELECT * FROM listings WHERE status = 'pending';
