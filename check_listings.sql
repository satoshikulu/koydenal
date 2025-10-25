-- İlanları kontrol et

-- 1. Toplam ilan sayısı
SELECT 
  'Toplam İlan' as bilgi,
  COUNT(*) as sayi
FROM listings;

-- 2. Durum bazında ilanlar
SELECT 
  status,
  COUNT(*) as sayi
FROM listings
GROUP BY status
ORDER BY sayi DESC;

-- 3. Son 10 ilan
SELECT 
  id,
  title,
  status,
  price,
  location,
  contact_phone,
  created_at,
  user_id
FROM listings
ORDER BY created_at DESC
LIMIT 10;

-- 4. Bekleyen ilanlar (Admin onayı bekleyenler)
SELECT 
  l.id,
  l.title,
  l.price,
  l.location,
  l.contact_person,
  l.contact_phone,
  l.status,
  l.created_at,
  c.name as kategori,
  CASE 
    WHEN l.user_id IS NULL THEN 'Misafir'
    ELSE up.full_name
  END as kullanici
FROM listings l
LEFT JOIN categories c ON l.category_id = c.id
LEFT JOIN user_profiles up ON l.user_id = up.id
WHERE l.status = 'pending'
ORDER BY l.created_at DESC;

-- 5. Kategori bazında ilan dağılımı
SELECT 
  c.name as kategori,
  c.icon,
  COUNT(l.id) as ilan_sayisi
FROM categories c
LEFT JOIN listings l ON c.id = l.category_id
GROUP BY c.id, c.name, c.icon
ORDER BY ilan_sayisi DESC;

-- 6. Bugün oluşturulan ilanlar
SELECT 
  COUNT(*) as bugun_ilan_sayisi
FROM listings
WHERE DATE(created_at) = CURRENT_DATE;

-- 7. Son 24 saatte oluşturulan ilanlar
SELECT 
  id,
  title,
  status,
  created_at
FROM listings
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Başarı mesajı
DO $
BEGIN
  RAISE NOTICE '✅ İlan kontrol sorguları tamamlandı!';
  RAISE NOTICE '📊 Yukarıdaki sonuçları inceleyin';
END $;
