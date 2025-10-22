-- Misafir kullanıcıların ilan oluşturabilmesi için basit RLS politikası
-- Supabase Dashboard > SQL Editor'de çalıştırın

-- Önce mevcut guest politikasını sil (varsa)
DROP POLICY IF EXISTS "Guest users can create listings" ON listings;

-- Yeni politika oluştur - Misafir kullanıcılar (user_id = NULL) ilan oluşturabilir
CREATE POLICY "Guest users can create listings"
ON listings
FOR INSERT
WITH CHECK (user_id IS NULL);

-- Kontrol et
SELECT 
    policyname,
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'listings' 
AND policyname = 'Guest users can create listings';
