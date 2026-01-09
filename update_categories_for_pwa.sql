-- ============================================
-- KATEGORİ GÜNCELLEMESİ - PWA İÇİN
-- KöydenAL - Kümes Hayvanları, Süt Ürünleri, Sebze Vurgusu
-- ============================================

-- Mevcut kategorileri güncelle ve yeni kategoriler ekle
-- Öncelik sırası: Kümes Hayvanları, Süt Ürünleri, Sebzeler

-- 1. Mevcut kategorileri güncelle
UPDATE categories 
SET 
  display_order = CASE 
    WHEN name = 'Kümes Hayvanları' THEN 1
    WHEN name = 'Süt ve Süt Ürünleri' THEN 2
    WHEN name = 'Sebzeler' THEN 3
    WHEN name = 'Meyveler' THEN 4
    WHEN name = 'Tahıllar' THEN 5
    WHEN name = 'Bakliyat' THEN 6
    WHEN name = 'Büyükbaş Hayvanlar' THEN 7
    WHEN name = 'Küçükbaş Hayvanlar' THEN 8
    WHEN name = 'Ekipman' THEN 9
    ELSE display_order
  END
WHERE name IN (
  'Kümes Hayvanları', 
  'Süt ve Süt Ürünleri', 
  'Sebzeler', 
  'Meyveler',
  'Tahıllar',
  'Bakliyat',
  'Büyükbaş Hayvanlar',
  'Küçükbaş Hayvanlar',
  'Ekipman'
);

-- 2. Yeni kategorileri ekle (yoksa)
INSERT INTO categories (name, slug, description, icon, display_order, is_active)
SELECT * FROM (VALUES
  -- Öncelikli Kategoriler
  ('Kümes Hayvanları', 'kumes-hayvanlari', 'Tavuk, horoz, ördek, kaz, hindi ve yumurta', '🐔', 1, true),
  ('Süt ve Süt Ürünleri', 'sut-urunleri', 'Süt, yoğurt, peynir, tereyağı, kaymak, lor, çökelek', '🥛', 2, true),
  ('Sebzeler', 'sebzeler', 'Taze sebze ve yeşillikler', '🥕', 3, true),
  
  -- Diğer Kategoriler
  ('Meyveler', 'meyveler', 'Taze meyveler ve meyve ürünleri', '🍎', 4, true),
  ('Tahıllar', 'tahillar', 'Buğday, arpa, mısır ve diğer tahıl ürünleri', '🌾', 5, true),
  ('Bakliyat', 'bakliyat', 'Nohut, mercimek, fasulye ve diğer baklagiller', '🫘', 6, true),
  ('Büyükbaş Hayvanlar', 'buyukbas-hayvanlar', 'İnek, dana, tosun, manda', '🐄', 7, true),
  ('Küçükbaş Hayvanlar', 'kucukbas-hayvanlar', 'Koyun, kuzu, keçi, oğlak', '🐑', 8, true),
  ('Ekipman', 'ekipman', 'Tarım makinaları ve ekipmanları', '🚜', 9, true)
) AS v(name, slug, description, icon, display_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE categories.name = v.name);

-- 3. Eski kategori isimlerini yeni isimlere güncelle (eğer varsa)
UPDATE categories 
SET 
  name = CASE 
    WHEN name = 'Hayvancılık' THEN 'Büyükbaş Hayvanlar'
    ELSE name
  END,
  slug = CASE 
    WHEN slug = 'hayvancilik' THEN 'buyukbas-hayvanlar'
    ELSE slug
  END
WHERE name = 'Hayvancılık';

-- 4. Kategori açıklamalarını güncelle
UPDATE categories 
SET description = CASE 
  WHEN name = 'Kümes Hayvanları' THEN 'Tavuk, horoz, ördek, kaz, hindi ve yumurta. Köy yumurtası, organik kümes hayvanları.'
  WHEN name = 'Süt ve Süt Ürünleri' THEN 'Süt, yoğurt, peynir, tereyağı, kaymak, lor, çökelek. Doğal ve organik süt ürünleri.'
  WHEN name = 'Sebzeler' THEN 'Taze sebze ve yeşillikler. Domates, biber, patlıcan, salatalık, kabak ve daha fazlası.'
  WHEN name = 'Meyveler' THEN 'Taze meyveler ve meyve ürünleri. Elma, armut, üzüm, şeftali ve daha fazlası.'
  WHEN name = 'Tahıllar' THEN 'Buğday, arpa, mısır ve diğer tahıl ürünleri. Organik tahıllar.'
  WHEN name = 'Bakliyat' THEN 'Nohut, mercimek, fasulye ve diğer baklagiller. Yerel bakliyat ürünleri.'
  WHEN name = 'Büyükbaş Hayvanlar' THEN 'İnek, dana, tosun, manda. Besi ve süt hayvanları.'
  WHEN name = 'Küçükbaş Hayvanlar' THEN 'Koyun, kuzu, keçi, oğlak. Küçükbaş hayvanlar ve ürünleri.'
  WHEN name = 'Ekipman' THEN 'Tarım makinaları ve ekipmanları. Traktör, pulluk, sulama ekipmanı.'
  ELSE description
END
WHERE name IN (
  'Kümes Hayvanları', 
  'Süt ve Süt Ürünleri', 
  'Sebzeler', 
  'Meyveler',
  'Tahıllar',
  'Bakliyat',
  'Büyükbaş Hayvanlar',
  'Küçükbaş Hayvanlar',
  'Ekipman'
);

-- 5. Sonuçları kontrol et
SELECT 
  name, 
  slug, 
  icon, 
  display_order, 
  is_active,
  description
FROM categories 
ORDER BY display_order ASC;

-- 6. İstatistikler
SELECT 
  COUNT(*) as toplam_kategori,
  COUNT(CASE WHEN is_active = true THEN 1 END) as aktif_kategori,
  COUNT(CASE WHEN display_order <= 3 THEN 1 END) as oncelikli_kategori
FROM categories;
