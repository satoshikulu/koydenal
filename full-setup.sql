-- =====================================================
-- KÖYDENAL - KAPSAMLI VERİTABANI VE STORAGE KURULUMU
-- =====================================================
-- Bu dosya tüm sistemi tek seferde kurar
-- Sırasıyla çalıştırın (toplam 4 adım)

-- =====================================================
-- ADIM 1: STORAGE BUCKET OLUŞTURMA
-- =====================================================
-- NOT: Bu adım Supabase Dashboard'da manuel yapılmalıdır
-- Storage > Create new bucket > listing-images (public)

-- =====================================================
-- ADIM 2: TABLO OLUŞTURMA KOMUTLARI
-- =====================================================

-- Categories tablosu
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles tablosu
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone VARCHAR(15),  -- Telefon numarası için ideal tip (+90XXXXXXXXXX formatı)
    location TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Listings tablosu
CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2),
    currency TEXT DEFAULT 'TRY',
    location TEXT NOT NULL,
    category_id UUID REFERENCES categories(id),
    listing_type TEXT DEFAULT 'ürün',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    quantity DECIMAL(10,2),
    unit TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    contact_person TEXT,
    images TEXT[],
    main_image TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin actions tablosu
CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ADIM 3: RLS (Row Level Security) POLİTİKALARI
-- =====================================================

-- Listings tablosu için RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Herkes onaylanmış ilanları görebilir
CREATE POLICY "Anyone can view approved listings" ON listings
    FOR SELECT USING (status = 'approved');

-- Kullanıcılar kendi ilanlarını ekleyebilir
CREATE POLICY "Users can insert own listings" ON listings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi ilanlarını güncelleyebilir
CREATE POLICY "Users can update own listings" ON listings
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin kullanıcıları tüm ilanları yönetebilir
CREATE POLICY "Admins can manage all listings" ON listings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- User profiles tablosu için RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi profillerini görebilir ve güncelleyebilir
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admin kullanıcıları tüm profilleri görebilir
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- ADIM 4: VERİ EKLEME KOMUTLARI
-- =====================================================

-- Kategorileri ekle
INSERT INTO categories (id, name, description, icon, created_at) VALUES
('ceddf343-3ded-4f8a-b5aa-7fde58d34a67', 'Tahıllar', 'Buğday, arpa, mısır gibi tahıl ürünleri', '🌾', NOW()),
('51022018-881c-4b1d-a963-bd66bae1f446', 'Sebzeler', 'Domates, biber, patlıcan gibi sebzeler', '🥕', NOW()),
('4c8d0f30-aa66-47b1-8e36-139a4e971968', 'Meyveler', 'Elma, armut, şeftali, üzüm gibi meyveler', '🍎', NOW()),
('0a943db0-9b30-411b-9ebb-f5ba9882a7bb', 'Bakliyat', 'Mercimek, nohut, fasulye gibi bakliyat ürünleri', '🫘', NOW()),
('af2c27dc-707d-48e3-b685-d45249903dd0', 'Hayvancılık', 'Büyükbaş, küçükbaş hayvanlar ve ürünleri', '🐄', NOW()),
('c9641343-52e1-46e6-bd76-d5982293dc84', 'Ekipman', 'Traktör, pulluk, sulama sistemleri', '🚜', NOW()),
('58712a94-94cf-4c54-946d-f146c645ea9e', 'Arazi', 'Tarım arazileri, bağlar, bahçeler', '🏞️', NOW()),
('c557157d-43cb-4336-bdb0-76c9c53d6833', 'Hizmetler', 'Tarım danışmanlığı, nakliye, ilaçlama', '🔧', NOW())
ON CONFLICT (id) DO NOTHING;

-- Test ilanları ekle (kullanıcı oluşturulduktan sonra çalışacak)
INSERT INTO listings (
  title,
  description,
  price,
  currency,
  location,
  category_id,
  listing_type,
  status,
  quantity,
  unit,
  contact_phone,
  contact_email,
  contact_person,
  images,
  main_image,
  user_id,
  created_at,
  updated_at
) VALUES (
  'Organik Domates - Köy Ürünümüz',
  'Köyzümüzün özel toprağında yetişen, hormonsuz ve tamamen doğal domateslerimiz. Güneşin altında doğal yollarla yetişmiş, lezzetli ve sağlıklı ürünler.',
  25.50,
  'TRY',
  'Kulu, Konya',
  '51022018-881c-4b1d-a963-bd66bae1f446',
  'ürün',
  'approved',
  100,
  'kg',
  '+90 555 123 4567',
  'test@example.com',
  'Test Kullanıcısı',
  ARRAY['https://picsum.photos/400/300?random=1'],
  'https://picsum.photos/400/300?random=1',
  (SELECT id FROM auth.users WHERE email = 'test@example.com'),
  NOW(),
  NOW()
),
(
  'Taze Yumurta - Köy Tavuklarından',
  'Doğal ortamda yetişen tavuklarımızdan taze yumurtalar. Günlük olarak toplanır ve aynı gün teslim edilir.',
  15.00,
  'TRY',
  'Kulu, Konya',
  '0a943db0-9b30-411b-9ebb-f5ba9882a7bb',
  'ürün',
  'approved',
  50,
  'adet',
  '+90 555 123 4567',
  'test@example.com',
  'Test Kullanıcısı',
  ARRAY['https://picsum.photos/400/300?random=2'],
  'https://picsum.photos/400/300?random=2',
  (SELECT id FROM auth.users WHERE email = 'test@example.com'),
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ADIM 5: İNDEXLER (Performans için)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_user ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(location);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at);

-- =====================================================
-- ADIM 6: KONTROL VE DOĞRULAMA
-- =====================================================

-- Tüm kategorileri listele
SELECT 'Kategoriler:' as info, name FROM categories ORDER BY name;

-- Tüm ilanları listele
SELECT 'İlanlar:' as info, COUNT(*) as count FROM listings;

-- İlan istatistikleri
SELECT
  status,
  COUNT(*) as count
FROM listings
GROUP BY status;

-- =====================================================
-- KURULUM TAMAMLANDI!
-- =====================================================

SELECT '🎉 KöydenAL sistemi tamamen kuruldu!' as status;
