-- ============================================
-- KULLANICI VE İLAN ONAY SİSTEMİNİ DÜZELTİR
-- ============================================
-- Bu dosya admin panelinde üye ve ilanların görünmemesi sorununu çözer
-- Sevim tarafından hazırlanmıştır - 24 Ekim 2025
-- ============================================

-- 1. ADIM: user_profiles tablosuna status kolonları ekle
-- ============================================
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Mevcut kullanıcıların status'ü NULL ise 'approved' yap
UPDATE user_profiles 
SET status = 'approved' 
WHERE status IS NULL;

-- 2. ADIM: listings tablosuna status kolonları ekle (varsa)
-- ============================================
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Mevcut ilanların status'ü NULL ise 'pending' yap
UPDATE listings 
SET status = 'pending' 
WHERE status IS NULL;

-- 3. ADIM: KULLANICI VIEW'LARINI OLUŞTUR
-- ============================================

-- Onay bekleyen kullanıcılar
CREATE OR REPLACE VIEW pending_users AS
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.phone,
  up.address,
  up.role,
  up.status,
  up.created_at,
  up.updated_at,
  up.rejection_reason,
  up.approved_by,
  up.approved_at
FROM user_profiles up
WHERE up.status = 'pending'
ORDER BY up.created_at DESC;

-- Onaylanmış kullanıcılar
CREATE OR REPLACE VIEW approved_users AS
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.phone,
  up.address,
  up.role,
  up.status,
  up.created_at,
  up.updated_at,
  up.approved_by,
  up.approved_at
FROM user_profiles up
WHERE up.status = 'approved'
ORDER BY up.approved_at DESC NULLS LAST;

-- Reddedilen kullanıcılar
CREATE OR REPLACE VIEW rejected_users AS
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.phone,
  up.address,
  up.role,
  up.status,
  up.created_at,
  up.updated_at,
  up.rejection_reason,
  up.approved_by,
  up.approved_at
FROM user_profiles up
WHERE up.status = 'rejected'
ORDER BY up.updated_at DESC;

-- 4. ADIM: İLAN VIEW'LARINI OLUŞTUR
-- ============================================

-- Onay bekleyen ilanlar
CREATE OR REPLACE VIEW pending_listings AS
SELECT 
  l.*,
  up.full_name as user_name,
  up.email as user_email,
  up.phone as user_phone,
  c.name as category_name
FROM listings l
LEFT JOIN user_profiles up ON l.user_id = up.id
LEFT JOIN categories c ON l.category_id = c.id
WHERE l.status = 'pending'
ORDER BY l.created_at DESC;

-- Onaylanmış ilanlar
CREATE OR REPLACE VIEW approved_listings AS
SELECT 
  l.*,
  up.full_name as user_name,
  up.email as user_email,
  up.phone as user_phone,
  c.name as category_name
FROM listings l
LEFT JOIN user_profiles up ON l.user_id = up.id
LEFT JOIN categories c ON l.category_id = c.id
WHERE l.status = 'approved'
ORDER BY l.approved_at DESC NULLS LAST;

-- Reddedilen ilanlar
CREATE OR REPLACE VIEW rejected_listings AS
SELECT 
  l.*,
  up.full_name as user_name,
  up.email as user_email,
  up.phone as user_phone,
  c.name as category_name
FROM listings l
LEFT JOIN user_profiles up ON l.user_id = up.id
LEFT JOIN categories c ON l.category_id = c.id
WHERE l.status = 'rejected'
ORDER BY l.updated_at DESC;

-- 5. ADIM: RLS POLİTİKALARINI GÜNCELLE
-- ============================================

-- RLS'i etkinleştir (eğer değilse)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- user_profiles için RLS politikaları (varsa önce sil)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view approved profiles" ON user_profiles;
    DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
    DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Yeni politikalar oluştur
CREATE POLICY "Users can view approved profiles"
  ON user_profiles FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
    )
  );

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- View'lar için SELECT yetkisi ver (view'lar üzerinde policy değil, GRANT kullanılır)
GRANT SELECT ON pending_users TO authenticated, anon;
GRANT SELECT ON approved_users TO authenticated, anon;
GRANT SELECT ON rejected_users TO authenticated, anon;
GRANT SELECT ON pending_listings TO authenticated, anon;
GRANT SELECT ON approved_listings TO authenticated, anon;
GRANT SELECT ON rejected_listings TO authenticated, anon;

-- 6. ADIM: YENİ KULLANICI KAYITLARINI OTOMATİK PENDING YAP
-- ============================================

-- Trigger fonksiyonu: Yeni kullanıcı oluştuğunda status'ü pending yap
CREATE OR REPLACE FUNCTION set_new_user_pending()
RETURNS TRIGGER AS $$
BEGIN
  -- Eğer status belirtilmemişse veya NULL ise pending yap
  IF NEW.status IS NULL THEN
    NEW.status := 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı kaldır (varsa)
DROP TRIGGER IF EXISTS on_user_profile_create ON user_profiles;

-- Yeni trigger oluştur
CREATE TRIGGER on_user_profile_create
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_new_user_pending();

-- ============================================
-- TAMAMLANDI!
-- ============================================
-- Şimdi admin panelinde:
-- 1. Kullanıcı Onayları sekmesinde bekleyen kullanıcılar görünecek
-- 2. İlan Yönetimi sekmesinde bekleyen ilanlar görünecek
-- 3. Filtreleme ve arama çalışacak
-- ============================================

-- KONTROL SORGUSU: Bekleyen kullanıcıları göster
SELECT id, email, full_name, status, created_at 
FROM user_profiles 
WHERE status = 'pending' 
ORDER BY created_at DESC 
LIMIT 10;

-- KONTROL SORGUSU: Bekleyen ilanları göster
SELECT id, title, status, created_at 
FROM listings 
WHERE status = 'pending' 
ORDER BY created_at DESC 
LIMIT 10;
