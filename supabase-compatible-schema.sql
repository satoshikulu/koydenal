-- =====================================================
-- KÖYDENAL - SUPABASE UYUMLU VERİTABANI ŞEMASI
-- =====================================================
-- Bu şema Supabase Auth sistemi ile tam uyumludur

-- =====================================================
-- ADIM 1: MEVCUT TABLOLARI SİL (DİKKAT!)
-- =====================================================

-- NOT: Önce mevcut veriyi yedekleyin!
DROP TABLE IF EXISTS admin_actions CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- =====================================================
-- ADIM 2: DOĞRU ŞEMAYI OLUŞTUR (SUPABASE AUTH İLE UYUMLU)
-- =====================================================

-- Categories tablosu
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles tablosu (SUPABASE AUTH İLE BAĞLANTILI)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT, -- Üye olmadan da çalışsın diye TEXT
    location TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Listings tablosu (SUPABASE AUTH İLE BAĞLANTILI)
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'TRY',
    location TEXT NOT NULL,
    category_id UUID REFERENCES categories(id),
    listing_type TEXT DEFAULT 'ürün',
    status TEXT DEFAULT 'approved', -- Otomatik onaylı olsun
    quantity DECIMAL(10,2) DEFAULT 1,
    unit TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    contact_person TEXT,
    images TEXT[] DEFAULT '{}',
    main_image TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Boş bırakılabilir
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin actions tablosu
CREATE TABLE admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ADIM 3: RLS POLİTİKALARI (SUPABASE AUTH İLE UYUMLU)
-- =====================================================

-- Listings tablosu için RLS - HERKES İÇİN AÇIK
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Herkes onaylanmış ilanları görebilir (üyelik gerekmez)
CREATE POLICY "Anyone can view listings" ON listings
    FOR SELECT USING (true);

-- Üye olanlar ilan ekleyebilir
CREATE POLICY "Authenticated users can insert listings" ON listings
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Kullanıcılar kendi ilanlarını güncelleyebilir
CREATE POLICY "Users can update own listings" ON listings
    FOR UPDATE USING (auth.uid() = user_id);

-- Herkes ilan ekleyebilir (üye olmadan da)
CREATE POLICY "Anyone can insert listings" ON listings
    FOR INSERT WITH CHECK (true);

-- User profiles tablosu için RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi profillerini görebilir
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Kullanıcılar kendi profillerini güncelleyebilir
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Herkes profil oluşturabilir
CREATE POLICY "Anyone can insert profiles" ON user_profiles
    FOR INSERT WITH CHECK (true);

-- Categories tablosu için RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Herkes kategorileri görebilir
CREATE POLICY "Anyone can view categories" ON categories
    FOR SELECT USING (true);

-- Admin actions için RLS
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Sadece adminler admin_actions'ı görebilir
CREATE POLICY "Admins can view admin actions" ON admin_actions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- ADIM 4: KATEGORİLERİ EKLE
-- =====================================================

INSERT INTO categories (id, name, description, icon, created_at) VALUES
('ceddf343-3ded-4f8a-b5aa-7fde58d34a67', 'Tahıllar', 'Buğday, arpa, mısır gibi tahıl ürünleri', '🌾', NOW()),
('51022018-881c-4b1d-a963-bd66bae1f446', 'Sebzeler', 'Domates, biber, patlıcan gibi sebzeler', '🥕', NOW()),
('4c8d0f30-aa66-47b1-8e36-139a4e971968', 'Meyveler', 'Elma, armut, şeftali, üzüm gibi meyveler', '🍎', NOW()),
('0a943db0-9b30-411b-9ebb-f5ba9882a7bb', 'Bakliyat', 'Mercimek, nohut, fasulye gibi bakliyat ürünleri', '🫘', NOW()),
('af2c27dc-707d-48e3-b685-d45249903dd0', 'Hayvancılık', 'Büyükbaş, küçükbaş hayvanlar ve ürünleri', '🐄', NOW()),
('c9641343-52e1-46e6-bd76-d5982293dc84', 'Ekipman', 'Traktör, pulluk, sulama sistemleri', '🚜', NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ADIM 5: İNDEXLER (Performans için)
-- =====================================================

CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_category ON listings(category_id);
CREATE INDEX idx_listings_user ON listings(user_id);
CREATE INDEX idx_listings_location ON listings(location);
CREATE INDEX idx_listings_created_at ON listings(created_at);

-- =====================================================
-- ADIM 6: KONTROL VE DOĞRULAMA
-- =====================================================

-- Tüm kategorileri listele
SELECT 'Kategoriler yüklendi:' as info, COUNT(*) as count FROM categories;

-- Tüm ilanları listele
SELECT 'İlanlar:' as info, COUNT(*) as count FROM listings;

-- İlan durumlarını kontrol et
SELECT
  status,
  COUNT(*) as count
FROM listings
GROUP BY status;

-- Admin kullanıcılarını kontrol et
SELECT 'Admin kullanıcıları:' as info, COUNT(*) as count FROM user_profiles WHERE role = 'admin';

-- Şema kontrolü
SELECT
  'Şema başarıyla oluşturuldu!' as status,
  NOW() as completed_at;
