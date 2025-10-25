-- HIZLI ÇÖZÜM: Misafir kullanıcı RLS hatası
-- Bu dosyayı Supabase Dashboard → SQL Editor'da çalıştırın

-- Eski politikayı sil
DROP POLICY IF EXISTS "Guest users can create listings" ON listings;
DROP POLICY IF EXISTS "listings_insert_policy" ON listings;

-- Yeni politika: Herkes ilan oluşturabilir
CREATE POLICY "Anyone can create listings"
  ON listings
  FOR INSERT
  WITH CHECK (true);

-- Kontrol
SELECT 
  'RLS Politikası Oluşturuldu' as durum,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'listings' AND cmd = 'INSERT';

-- Test
DO $
DECLARE
  test_cat_id UUID;
BEGIN
  SELECT id INTO test_cat_id FROM categories LIMIT 1;
  
  INSERT INTO listings (
    title, description, price, currency, quantity, unit,
    location, category_id, listing_type, status,
    contact_phone, contact_person, user_id
  ) VALUES (
    'TEST', 'Test açıklama', 100, 'TRY', 1, 'adet',
    'Test', test_cat_id, 'ürün', 'pending',
    '05551234567', 'Test', NULL
  );
  
  DELETE FROM listings WHERE title = 'TEST';
  
  RAISE NOTICE '✅ Misafir kullanıcı ilan oluşturabilir!';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Hata: %', SQLERRM;
END $;
