-- Misafir kullanıcı RLS politikasını düzelt
-- Bu dosyayı Supabase Dashboard → SQL Editor'da çalıştırın

-- 1. Mevcut politikaları kontrol et
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'listings'
ORDER BY policyname;

-- 2. Eski misafir politikalarını sil (varsa)
DROP POLICY IF EXISTS "Guest users can create listings" ON listings;
DROP POLICY IF EXISTS "listings_insert_policy" ON listings;
DROP POLICY IF EXISTS "Authenticated users can create listings" ON listings;

-- 3. YENİ POLİTİKA: Herkes (authenticated + anonymous) ilan oluşturabilir
CREATE POLICY "Anyone can create listings"
  ON listings
  FOR INSERT
  WITH CHECK (true);

-- 4. Onaylı ilanları herkes görebilir
DROP POLICY IF EXISTS "Approved listings are viewable by everyone" ON listings;
CREATE POLICY "Approved listings are viewable by everyone"
  ON listings
  FOR SELECT
  USING (status = 'approved');

-- 5. Kullanıcılar kendi ilanlarını görebilir
DROP POLICY IF EXISTS "Users can view own listings" ON listings;
CREATE POLICY "Users can view own listings"
  ON listings
  FOR SELECT
  USING (auth.uid() = user_id);

-- 6. Admin tüm ilanları görebilir
DROP POLICY IF EXISTS "Admins can view all listings" ON listings;
CREATE POLICY "Admins can view all listings"
  ON listings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- 7. Kullanıcılar kendi pending ilanlarını güncelleyebilir
DROP POLICY IF EXISTS "Users can update own pending listings" ON listings;
CREATE POLICY "Users can update own pending listings"
  ON listings
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- 8. Misafir kullanıcılar secret ile güncelleyebilir
DROP POLICY IF EXISTS "Guest users can update with secret" ON listings;
CREATE POLICY "Guest users can update with secret"
  ON listings
  FOR UPDATE
  USING (user_id IS NULL AND listing_secret IS NOT NULL);

-- 9. Admin tüm ilanları güncelleyebilir
DROP POLICY IF EXISTS "Admins can update any listing" ON listings;
CREATE POLICY "Admins can update any listing"
  ON listings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- 10. Kullanıcılar kendi pending ilanlarını silebilir
DROP POLICY IF EXISTS "Users can delete own pending listings" ON listings;
CREATE POLICY "Users can delete own pending listings"
  ON listings
  FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

-- 11. Admin tüm ilanları silebilir
DROP POLICY IF EXISTS "Admins can delete any listing" ON listings;
CREATE POLICY "Admins can delete any listing"
  ON listings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 12. Politikaları kontrol et
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NULL THEN 'No restriction'
    ELSE 'Has restriction'
  END as using_clause,
  CASE 
    WHEN with_check IS NULL THEN 'No check'
    ELSE 'Has check'
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'listings'
ORDER BY cmd, policyname;

-- 13. Test: Misafir kullanıcı olarak ilan oluştur
DO $
DECLARE
  test_category_id UUID;
  test_listing_id UUID;
BEGIN
  -- Kategori al
  SELECT id INTO test_category_id FROM categories LIMIT 1;
  
  IF test_category_id IS NULL THEN
    RAISE NOTICE '❌ Kategori bulunamadı!';
    RETURN;
  END IF;
  
  -- Test ilanı oluştur (misafir kullanıcı olarak)
  BEGIN
    INSERT INTO listings (
      title,
      description,
      price,
      currency,
      quantity,
      unit,
      location,
      category_id,
      listing_type,
      status,
      contact_phone,
      contact_person,
      user_id
    ) VALUES (
      'TEST - RLS Kontrolü',
      'Bu bir test ilanıdır. RLS politikası çalışıyor mu kontrol ediliyor.',
      100,
      'TRY',
      1,
      'adet',
      'Test Lokasyon',
      test_category_id,
      'ürün',
      'pending',
      '05551234567',
      'Test Kullanıcı',
      NULL -- Misafir kullanıcı
    ) RETURNING id INTO test_listing_id;
    
    RAISE NOTICE '✅ TEST BAŞARILI! Misafir kullanıcı ilan oluşturabilir.';
    RAISE NOTICE '📊 Test İlan ID: %', test_listing_id;
    
    -- Test ilanını sil
    DELETE FROM listings WHERE id = test_listing_id;
    RAISE NOTICE '🗑️ Test ilanı temizlendi';
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ TEST BAŞARISIZ!';
      RAISE NOTICE 'Hata: %', SQLERRM;
      RAISE NOTICE '';
      RAISE NOTICE '🔧 Çözüm: Yukarıdaki politikaların doğru oluşturulduğundan emin olun.';
  END;
END $;

-- Başarı mesajı
DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ RLS POLİTİKALARI GÜNCELLENDİ!';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Oluşturulan Politikalar:';
  RAISE NOTICE '   1. Anyone can create listings (INSERT)';
  RAISE NOTICE '   2. Approved listings are viewable by everyone (SELECT)';
  RAISE NOTICE '   3. Users can view own listings (SELECT)';
  RAISE NOTICE '   4. Admins can view all listings (SELECT)';
  RAISE NOTICE '   5. Users can update own pending listings (UPDATE)';
  RAISE NOTICE '   6. Guest users can update with secret (UPDATE)';
  RAISE NOTICE '   7. Admins can update any listing (UPDATE)';
  RAISE NOTICE '   8. Users can delete own pending listings (DELETE)';
  RAISE NOTICE '   9. Admins can delete any listing (DELETE)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Artık misafir kullanıcılar ilan oluşturabilir!';
  RAISE NOTICE '';
END $;
