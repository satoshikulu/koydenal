-- =====================================================
-- KULU TARIM - KULLANICI ONAY SİSTEMİ GÜNCELLEMESİ
-- Sevim tarafından yapılmıştır
-- =====================================================

-- Bu script, kullanıcı onay sistemini ekler

-- =====================================================
-- 1. USER_PROFILES TABLOSUNA STATUS ALANI EKLE
-- =====================================================

-- Önce status alanını ekleyelim (varsayılan olarak 'pending')
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'; -- pending, approved, rejected

-- Onayla ve red için ek alanlar
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- =====================================================
-- 2. USER_PROFILES TABLOSU İÇİN YENİ POLİTİKALAR
-- =====================================================

-- Onaylanmış kullanıcı profillerini herkes görebilir
DROP POLICY IF EXISTS "Onaylanmış profilleri herkes görüntüleyebilir" ON user_profiles;
CREATE POLICY "Onaylanmış profilleri herkes görüntüleyebilir" ON user_profiles
FOR SELECT USING (status = 'approved');

-- Kullanıcılar kendi profillerini görebilir
DROP POLICY IF EXISTS "Kullanıcılar kendi profillerini görebilir" ON user_profiles;
CREATE POLICY "Kullanıcılar kendi profillerini görebilir" ON user_profiles
FOR SELECT USING (auth.uid() = id);

-- Adminler tüm profilleri görebilir
DROP POLICY IF EXISTS "Adminler tüm profilleri görebilir" ON user_profiles;
CREATE POLICY "Adminler tüm profilleri görebilir" ON user_profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.role = 'admin'
  )
);

-- =====================================================
-- 3. YENİ GÖRÜNÜMLER
-- =====================================================

-- Admin dashboard için onay bekleyen kullanıcılar
DROP VIEW IF EXISTS pending_users;
CREATE OR REPLACE VIEW pending_users AS
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.phone,
  up.role,
  up.created_at,
  up.updated_at
FROM user_profiles up
WHERE up.status = 'pending'
ORDER BY up.created_at DESC;

-- Onaylanmış kullanıcılar
DROP VIEW IF EXISTS approved_users;
CREATE OR REPLACE VIEW approved_users AS
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.phone,
  up.role,
  up.approved_by,
  up.approved_at,
  up.created_at,
  up.updated_at
FROM user_profiles up
WHERE up.status = 'approved'
ORDER BY up.approved_at DESC;

-- Reddedilmiş kullanıcılar
DROP VIEW IF EXISTS rejected_users;
CREATE OR REPLACE VIEW rejected_users AS
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.phone,
  up.role,
  up.rejection_reason,
  up.approved_by,
  up.approved_at,
  up.created_at,
  up.updated_at
FROM user_profiles up
WHERE up.status = 'rejected'
ORDER BY up.approved_at DESC;

-- =====================================================
-- 4. İZİNLER
-- =====================================================

-- Admin kullanıcıların erişebileceği yeni view'lar
GRANT SELECT ON pending_users TO authenticated;
GRANT SELECT ON approved_users TO authenticated;
GRANT SELECT ON rejected_users TO authenticated;

-- =====================================================
-- 5. TRIGGER FONKSİYONU GÜNCELLEMESİ
-- =====================================================

-- Kullanıcı kayıt olduğunda otomatik profil oluşturma fonksiyonunu güncelle
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role, status)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'user', 'pending');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı yeniden oluştur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 6. MEVCUT KULLANICILARI GÜNCELLE
-- =====================================================

-- Mevcut tüm kullanıcıları 'approved' durumuna getir (uygulama zaten çalışıyor)
-- Bu sadece yeni kurulumlarda çalışır, mevcut kullanıcılar manuel onaylanmalıdır
UPDATE user_profiles 
SET status = 'approved' 
WHERE status IS NULL;

-- =====================================================
-- 7. KULLANIM ÖRNEKLERİ
-- =====================================================

/*
-- Admin olarak kullanıcı onaylamak:
UPDATE user_profiles 
SET status = 'approved', approved_by = 'ADMIN_UUID', approved_at = NOW()
WHERE id = 'USER_ID_BURAYA';

-- Admin olarak kullanıcı reddetmek:
UPDATE user_profiles 
SET status = 'rejected', approved_by = 'ADMIN_UUID', approved_at = NOW(), rejection_reason = 'Uygun değil'
WHERE id = 'USER_ID_BURAYA';

-- Onay bekleyen kullanıcıları listelemek (sadece adminler):
SELECT * FROM pending_users;

-- Onaylanmış kullanıcıları listelemek:
SELECT * FROM approved_users;
*/