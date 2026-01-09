-- Listings tablosuna is_opportunity alanı ekle
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS is_opportunity BOOLEAN DEFAULT false;

-- Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_listings_is_opportunity 
ON listings(is_opportunity) 
WHERE is_opportunity = true;

-- Mevcut featured_until alanını kontrol et ve yoksa ekle
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

-- Başarı mesajı
DO $
BEGIN
  RAISE NOTICE '✅ is_opportunity alanı başarıyla eklendi!';
  RAISE NOTICE '✅ featured_until alanı kontrol edildi!';
  RAISE NOTICE '📊 Artık ilanları fırsat ilanı olarak işaretleyebilirsiniz!';
END $;
