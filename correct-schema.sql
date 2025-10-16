-- =====================================================
-- KÖYDENAL - DÜZELTİLMİŞ VERİTABANI ŞEMASI
-- =====================================================
-- Bu dosya mevcut hatalı şemayı düzeltir

-- =====================================================
-- ADIM 1: MEVCUT TABLOLARI TEMİZLE (DİKKAT!)
-- =====================================================

-- NOT: Önce mevcut veriyi yedekleyin!
/*
DROP TABLE IF EXISTS admin_actions CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
*/

-- =====================================================
-- ADIM 2: DOĞRU ŞEMAYI OLUŞTUR
-- =====================================================

-- Categories tablosu
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles tablosu (DÜZELTİLMİŞ)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone VARCHAR(15), -- +90XXXXXXXXXX formatı için
    location TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Listings tablosu (DÜZELTİLMİŞ)
CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'TRY',
    location TEXT NOT NULL,
    category_id UUID REFERENCES categories(id),
    listing_type TEXT DEFAULT 'ürün' CHECK (listing_type IN ('ürün', 'hizmet')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    quantity DECIMAL(10,2) DEFAULT 1,
    unit TEXT,
    contact_phone VARCHAR(15),
    contact_email TEXT,
    contact_person TEXT,
    images TEXT[] DEFAULT '{}',
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
    action TEXT NOT NULL CHECK (action IN ('approved', 'rejected')),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ADIM 3: RLS POLİTİKALARI
-- =====================================================

-- Listings tablosu için RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Herkes onaylanmış ilanları görebilir
DROP POLICY IF EXISTS "Anyone can view approved listings" ON listings;
CREATE POLICY "Anyone can view approved listings" ON listings
    FOR SELECT USING (status = 'approved');

-- Kullanıcılar kendi ilanlarını ekleyebilir
DROP POLICY IF EXISTS "Users can insert own listings" ON listings;
CREATE POLICY "Users can insert own listings" ON listings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi ilanlarını güncelleyebilir
DROP POLICY IF EXISTS "Users can update own listings" ON listings;
CREATE POLICY "Users can update own listings" ON listings
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin kullanıcıları tüm ilanları yönetebilir
DROP POLICY IF EXISTS "Admins can manage all listings" ON listings;
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
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admin kullanıcıları tüm profilleri görebilir
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin actions için RLS
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Sadece adminler admin_actions'ı görebilir
DROP POLICY IF EXISTS "Admins can view admin actions" ON admin_actions;
CREATE POLICY "Admins can view admin actions" ON admin_actions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Sadece adminler admin_actions ekleyebilir
DROP POLICY IF EXISTS "Admins can insert admin actions" ON admin_actions;
CREATE POLICY "Admins can insert admin actions" ON admin_actions
    FOR INSERT WITH CHECK (
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

CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_user ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(location);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at);

-- =====================================================
-- ADIM 6: KONTROL VE DOĞRULAMA
-- =====================================================

-- Tüm kategorileri listele
SELECT 'Kategoriler:' as info, COUNT(*) as count FROM categories;

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
  'Şema kontrolü tamamlandı!' as status,
  NOW() as completed_at;
