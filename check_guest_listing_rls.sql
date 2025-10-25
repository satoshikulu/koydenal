-- Misafir kullanıcı ilan verme RLS politikasını kontrol et

-- 1. Mevcut listings RLS politikalarını göster
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

-- 2. Misafir kullanıcı politikası var mı kontrol et
DO $
DECLARE
  policy_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'listings' 
    AND policyname = 'Guest users can create listings'
  ) INTO policy_exists;
  
  IF policy_exists THEN
    RAISE NOTICE '✅ Misafir kullanıcı politikası mevcut';
  ELSE
    RAISE NOTICE '❌ Misafir kullanıcı politikası YOK!';
    RAISE NOTICE '🔧 Çözüm: Aşağıdaki politikayı oluşturun';
  END IF;
END $;

-- 3. Eğer politika yoksa, oluştur
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'listings' 
    AND policyname = 'Guest users can create listings'
  ) THEN
    -- Politika oluştur
    EXECUTE 'CREATE POLICY "Guest users can create listings"
      ON listings FOR INSERT
      WITH CHECK (user_id IS NULL)';
    
    RAISE NOTICE '✅ Misafir kullanıcı politikası oluşturuldu!';
  END IF;
END $;

-- 4. listing_secret trigger'ını kontrol et
SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'generate_listing_secret_trigger';

-- 5. Trigger fonksiyonunu kontrol et
SELECT 
  proname as function_name,
  prosrc as function_code
FROM pg_proc
WHERE proname = 'generate_listing_secret';

-- 6. Test: Misafir kullanıcı olarak ilan oluşturabilir miyiz?
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
  
  -- Test ilanı oluştur
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
      'TEST - Misafir İlan',
      'Bu bir test ilanıdır. Silinebilir.',
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
    
    RAISE NOTICE '✅ Test ilanı oluşturuldu! ID: %', test_listing_id;
    
    -- Test ilanını sil
    DELETE FROM listings WHERE id = test_listing_id;
    RAISE NOTICE '🗑️ Test ilanı silindi';
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Test ilanı oluşturulamadı!';
      RAISE NOTICE 'Hata: %', SQLERRM;
  END;
END $;

-- 7. Özet rapor
DO $
DECLARE
  total_listings INTEGER;
  guest_listings INTEGER;
  pending_guest_listings INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_listings FROM listings;
  SELECT COUNT(*) INTO guest_listings FROM listings WHERE user_id IS NULL;
  SELECT COUNT(*) INTO pending_guest_listings FROM listings WHERE user_id IS NULL AND status = 'pending';
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 İlan İstatistikleri:';
  RAISE NOTICE '   Toplam İlan: %', total_listings;
  RAISE NOTICE '   Misafir İlanları: %', guest_listings;
  RAISE NOTICE '   Bekleyen Misafir İlanları: %', pending_guest_listings;
END $;

-- Başarı mesajı
DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Misafir kullanıcı RLS kontrolü tamamlandı!';
  RAISE NOTICE '📝 Yukarıdaki sonuçları inceleyin';
END $;
