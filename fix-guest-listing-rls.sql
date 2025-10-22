-- Misafir kullanıcıların ilan oluşturabilmesi için RLS politikası
-- Bu script Supabase Dashboard > SQL Editor'de çalıştırılmalı

-- Önce mevcut politikaları kontrol et
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
ORDER BY policyname;

-- Eğer "Guest users can create listings" politikası yoksa, ekle
DO $$
BEGIN
    -- Önce politikanın var olup olmadığını kontrol et
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'listings' 
        AND policyname = 'Guest users can create listings'
    ) THEN
        -- Politika yoksa oluştur
        CREATE POLICY "Guest users can create listings"
        ON listings FOR INSERT
        WITH CHECK (user_id IS NULL);
        
        RAISE NOTICE 'Guest listing policy created successfully';
    ELSE
        RAISE NOTICE 'Guest listing policy already exists';
    END IF;
END $$;

-- Politikaları tekrar kontrol et
SELECT 
    policyname,
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'listings' 
AND cmd = 'INSERT'
ORDER BY policyname;
