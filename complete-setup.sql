-- =====================================================
-- KÖYDENAL - TAM ŞEMA OLUŞTURMA (TEK DOSYADA)
-- =====================================================
-- Bu dosyayı çalıştırın ve tüm hatalar çözülecek!

-- ADIM 1: MEVCUT TABLOLARI SİL
DROP TABLE IF EXISTS admin_actions CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- ADIM 2: YENİ ŞEMAYI OLUŞTUR
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'TRY',
    location TEXT NOT NULL,
    category_id UUID REFERENCES categories(id),
    listing_type TEXT DEFAULT 'ürün',
    status TEXT DEFAULT 'approved',
    quantity DECIMAL(10,2) DEFAULT 1,
    unit TEXT,
    contact_phone TEXT,
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

CREATE TABLE admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ADIM 3: KATEGORİLERİ EKLE
INSERT INTO categories (id, name, description, icon, created_at) VALUES
('ceddf343-3ded-4f8a-b5aa-7fde58d34a67', 'Tahıllar', 'Buğday, arpa, mısır gibi tahıl ürünleri', '🌾', NOW()),
('51022018-881c-4b1d-a963-bd66bae1f446', 'Sebzeler', 'Domates, biber, patlıcan gibi sebzeler', '🥕', NOW()),
('4c8d0f30-aa66-47b1-8e36-139a4e971968', 'Meyveler', 'Elma, armut, şeftali, üzüm gibi meyveler', '🍎', NOW()),
('0a943db0-9b30-411b-9ebb-f5ba9882a7bb', 'Bakliyat', 'Mercimek, nohut, fasulye gibi bakliyat ürünleri', '🫘', NOW()),
('af2c27dc-707d-48e3-b685-d45249903dd0', 'Hayvancılık', 'Büyükbaş, küçükbaş hayvanlar ve ürünleri', '🐄', NOW()),
('c9641343-52e1-46e6-bd76-d5982293dc84', 'Ekipman', 'Traktör, pulluk, sulama sistemleri', '🚜', NOW())
ON CONFLICT (id) DO NOTHING;

-- ADIM 4: ADMİN KULLANICISI EKLE (ÖNCE KULLANICIYI OLUŞTURUN)
-- 1. Supabase Dashboard > Authentication > Users > Add User
-- Email: admin@koydendal.com, Password: güçlü şifre

INSERT INTO user_profiles (id, email, full_name, phone, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@koydendal.com'),
  'admin@koydendal.com',
  'Sistem Admini',
  '+905551234567',
  'admin'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  updated_at = NOW();

-- ADIM 5: TEST İLANI EKLE
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
  'Test İlanı - Organik Domates',
  'Bu bir test ilanıdır. Sistem çalışıp çalışmadığını kontrol etmek için.',
  25.50,
  'TRY',
  'Kulu Merkez',
  (SELECT id FROM categories WHERE name = 'Sebzeler' LIMIT 1),
  'ürün',
  'approved',
  100,
  'kg',
  '+905551234567',
  'test@example.com',
  'Test Kullanıcı',
  ARRAY['https://picsum.photos/400/300?random=1'],
  'https://picsum.photos/400/300?random=1',
  (SELECT id FROM auth.users WHERE email = 'test@example.com' LIMIT 1),
  NOW(),
  NOW()
);

-- ADIM 6: SON KONTROL
SELECT 'Şema başarıyla oluşturuldu!' as status;
SELECT COUNT(*) as kategoriler FROM categories;
SELECT COUNT(*) as ilanlar FROM listings;
SELECT COUNT(*) as admin_kullanicilari FROM user_profiles WHERE role = 'admin';
