-- Storage bucket'larına erişim için RLS politikası
-- Supabase Dashboard > SQL Editor'de çalıştırın

-- 1. storage.buckets tablosunda RLS'i kontrol et
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'buckets';

-- 2. Önce varsa sil, sonra oluştur
DROP POLICY IF EXISTS "Anyone can view buckets" ON storage.buckets;
CREATE POLICY "Anyone can view buckets"
ON storage.buckets FOR SELECT
USING (true);

-- 4. Kontrol et
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'buckets'
ORDER BY policyname;
