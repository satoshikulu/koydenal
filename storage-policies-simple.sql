-- Listing Images Bucket için RLS Politikaları
-- Supabase Dashboard > SQL Editor'de çalıştırın

-- 1. Herkes resim okuyabilir (SELECT)
CREATE POLICY "Anyone can read listing images"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing_images');

-- 2. Herkes resim yükleyebilir (INSERT) - Misafir kullanıcılar için
CREATE POLICY "Anyone can upload listing images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'listing_images');

-- 3. Herkes kendi yüklediği resimleri güncelleyebilir (UPDATE)
CREATE POLICY "Anyone can update listing images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'listing_images');

-- 4. Herkes kendi yüklediği resimleri silebilir (DELETE)
CREATE POLICY "Anyone can delete listing images"
ON storage.objects FOR DELETE
USING (bucket_id = 'listing_images');

-- Kontrol et
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename = 'objects'
AND policyname LIKE '%listing images%'
ORDER BY policyname;
