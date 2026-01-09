-- ============================================
-- VERİTABANI İYİLEŞTİRME VE OPTİMİZASYON
-- KöydenAL - PWA için optimize edilmiş
-- ============================================

-- 1. KATEGORİ GÜNCELLEMESİ (PWA için)
-- ============================================
-- update_categories_for_pwa.sql dosyasını çalıştırın

-- 2. CONTACT_COUNT ALANI EKLEME
-- ============================================
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS contact_count INTEGER DEFAULT 0;

COMMENT ON COLUMN listings.contact_count IS 'İlan için iletişime geçen kişi sayısı';

-- 3. IS_OPPORTUNITY ALANI KONTROLÜ
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'is_opportunity'
  ) THEN
    ALTER TABLE listings 
    ADD COLUMN is_opportunity BOOLEAN DEFAULT false;
    
    COMMENT ON COLUMN listings.is_opportunity IS 'Fırsat ilanı işareti';
  END IF;
END $$;

-- 4. GUEST LISTING RLS POLİTİKASI İYİLEŞTİRME
-- ============================================
-- Guest listing'ler herkese açık olmalı (secret ile yönetim)
DROP POLICY IF EXISTS "Guest listings accessible by secret" ON listings;

-- Not: Guest listing'ler zaten "Approved listings are viewable by everyone" 
-- politikası ile görüntülenebilir. Secret sadece yönetim için kullanılır.

-- 5. CONTACT COUNT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION increment_listing_contact()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE listings 
  SET contact_count = contact_count + 1
  WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger oluştur (admin_actions tablosunda contact action için)
DROP TRIGGER IF EXISTS trigger_increment_contact_count ON admin_actions;
CREATE TRIGGER trigger_increment_contact_count
  AFTER INSERT ON admin_actions
  FOR EACH ROW
  WHEN (NEW.action = 'contact')
  EXECUTE FUNCTION increment_listing_contact();

-- Not: Gerçek contact tracking için ayrı bir tablo oluşturulabilir
-- Şimdilik admin_actions üzerinden takip edilebilir

-- 6. İNDEX OPTİMİZASYONLARI
-- ============================================

-- Contact count için index (sıralama için)
CREATE INDEX IF NOT EXISTS idx_listings_contact_count 
ON listings(contact_count DESC) 
WHERE contact_count > 0;

-- Opportunity ilanlar için index
CREATE INDEX IF NOT EXISTS idx_listings_opportunity 
ON listings(is_opportunity, created_at DESC) 
WHERE is_opportunity = true;

-- Status ve featured kombinasyonu
CREATE INDEX IF NOT EXISTS idx_listings_status_featured 
ON listings(status, is_featured, created_at DESC) 
WHERE status = 'approved';

-- 7. VIEW İYİLEŞTİRMELERİ
-- ============================================

-- Öne çıkan ilanlar view'ı
CREATE OR REPLACE VIEW featured_listings AS
SELECT 
  l.*,
  c.name as category_name,
  c.icon as category_icon,
  c.slug as category_slug,
  up.full_name as user_name,
  up.email as user_email
FROM listings l
LEFT JOIN categories c ON l.category_id = c.id
LEFT JOIN user_profiles up ON l.user_id = up.id
WHERE l.status = 'approved' 
  AND l.is_featured = true
  AND (l.featured_until IS NULL OR l.featured_until > NOW())
ORDER BY l.created_at DESC;

-- Fırsat ilanları view'ı
CREATE OR REPLACE VIEW opportunity_listings AS
SELECT 
  l.*,
  c.name as category_name,
  c.icon as category_icon,
  c.slug as category_slug,
  up.full_name as user_name
FROM listings l
LEFT JOIN categories c ON l.category_id = c.id
LEFT JOIN user_profiles up ON l.user_id = up.id
WHERE l.status = 'approved' 
  AND l.is_opportunity = true
ORDER BY l.created_at DESC;

-- Popüler ilanlar (en çok görüntülenen ve iletişime geçilen)
CREATE OR REPLACE VIEW popular_listings AS
SELECT 
  l.*,
  c.name as category_name,
  c.icon as category_icon,
  (l.view_count + l.contact_count * 2) as popularity_score
FROM listings l
LEFT JOIN categories c ON l.category_id = c.id
WHERE l.status = 'approved'
ORDER BY popularity_score DESC, l.created_at DESC
LIMIT 50;

-- 8. PERFORMANS İYİLEŞTİRMELERİ
-- ============================================

-- VACUUM ve ANALYZE (manuel çalıştırılmalı)
-- VACUUM ANALYZE listings;
-- VACUUM ANALYZE user_profiles;
-- VACUUM ANALYZE categories;

-- 9. KONTROL SORGULARI
-- ============================================

-- Tablo yapısını kontrol et
DO $$
DECLARE
  has_contact_count BOOLEAN;
  has_opportunity BOOLEAN;
BEGIN
  -- contact_count kontrolü
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'contact_count'
  ) INTO has_contact_count;
  
  -- is_opportunity kontrolü
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'is_opportunity'
  ) INTO has_opportunity;
  
  RAISE NOTICE 'contact_count alanı: %', 
    CASE WHEN has_contact_count THEN '✅ Var' ELSE '❌ Yok' END;
  RAISE NOTICE 'is_opportunity alanı: %', 
    CASE WHEN has_opportunity THEN '✅ Var' ELSE '❌ Yok' END;
END $$;

-- İstatistikler
SELECT 
  'Toplam İlan' as metric,
  COUNT(*)::text as value
FROM listings
UNION ALL
SELECT 
  'Onaylı İlan',
  COUNT(*)::text
FROM listings
WHERE status = 'approved'
UNION ALL
SELECT 
  'Öne Çıkan İlan',
  COUNT(*)::text
FROM listings
WHERE is_featured = true
UNION ALL
SELECT 
  'Fırsat İlanı',
  COUNT(*)::text
FROM listings
WHERE is_opportunity = true
UNION ALL
SELECT 
  'Toplam Kullanıcı',
  COUNT(*)::text
FROM user_profiles
UNION ALL
SELECT 
  'Admin Kullanıcı',
  COUNT(*)::text
FROM user_profiles
WHERE role IN ('admin', 'moderator');

RAISE NOTICE '✅ Veritabanı iyileştirmeleri tamamlandı!';
