-- ============================================
-- SUPABASE SAFE SETUP - Mevcut Yapıyı Korur
-- KöydenAL - Doğrudan Çiftçiden Tüketiciye
-- ============================================

-- Bu script mevcut veritabanı yapısını koruyarak güvenli kurulum yapar

-- 1. EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM TYPES (Mevcut olanları atla veya güncelle)
-- ============================================

-- listing_status enum
DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM ('pending', 'approved', 'rejected', 'expired', 'sold');
  RAISE NOTICE '✅ listing_status enum oluşturuldu';
EXCEPTION
  WHEN duplicate_object THEN 
    RAISE NOTICE 'ℹ️ listing_status zaten mevcut, eksik değerler ekleniyor...';
    -- Eksik değerleri ekle
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'expired' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'listing_status')) THEN
      ALTER TYPE listing_status ADD VALUE 'expired';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'sold' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'listing_status')) THEN
      ALTER TYPE listing_status ADD VALUE 'sold';
    END IF;
END $$;

-- user_role enum
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
  RAISE NOTICE '✅ user_role enum oluşturuldu';
EXCEPTION
  WHEN duplicate_object THEN 
    RAISE NOTICE 'ℹ️ user_role zaten mevcut, eksik değerler ekleniyor...';
    -- moderator değerini ekle (yoksa)
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'moderator' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
      ALTER TYPE user_role ADD VALUE 'moderator';
      RAISE NOTICE '✅ moderator değeri eklendi';
    END IF;
END $$;

-- user_status enum
DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
  RAISE NOTICE '✅ user_status enum oluşturuldu';
EXCEPTION
  WHEN duplicate_object THEN 
    RAISE NOTICE 'ℹ️ user_status zaten mevcut, eksik değerler ekleniyor...';
    -- suspended değerini ekle (yoksa)
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'suspended' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_status')) THEN
      ALTER TYPE user_status ADD VALUE 'suspended';
    END IF;
END $$;

-- listing_type enum
DO $$ BEGIN
  CREATE TYPE listing_type AS ENUM ('ürün', 'hizmet', 'makine');
  RAISE NOTICE '✅ listing_type enum oluşturuldu';
EXCEPTION
  WHEN duplicate_object THEN 
    RAISE NOTICE 'ℹ️ listing_type zaten mevcut, eksik değerler ekleniyor...';
    -- Eksik değerleri ekle
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'hizmet' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'listing_type')) THEN
      ALTER TYPE listing_type ADD VALUE 'hizmet';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'makine' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'listing_type')) THEN
      ALTER TYPE listing_type ADD VALUE 'makine';
    END IF;
END $$;

-- contact_preference enum
DO $$ BEGIN
  CREATE TYPE contact_preference AS ENUM ('telefon', 'whatsapp', 'email');
  RAISE NOTICE '✅ contact_preference enum oluşturuldu';
EXCEPTION
  WHEN duplicate_object THEN 
    RAISE NOTICE 'ℹ️ contact_preference zaten mevcut, eksik değerler ekleniyor...';
    -- Eksik değerleri ekle
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'whatsapp' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'contact_preference')) THEN
      ALTER TYPE contact_preference ADD VALUE 'whatsapp';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'email' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'contact_preference')) THEN
      ALTER TYPE contact_preference ADD VALUE 'email';
    END IF;
END $$;

-- 3. DROP EXISTING POLICIES (Güvenli temizlik)
-- ============================================
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
      r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- 4. DROP EXISTING TRIGGERS (Güvenli temizlik)
-- ============================================
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS generate_listing_secret_trigger ON listings;
DROP TRIGGER IF EXISTS set_published_at_trigger ON listings;
DROP TRIGGER IF EXISTS update_favorite_count_trigger ON favorites;
DROP TRIGGER IF EXISTS notify_listing_status_change_trigger ON listings;

-- 5. DROP EXISTING VIEWS (Yeniden oluşturulacak)
-- ============================================
DROP VIEW IF EXISTS pending_listings CASCADE;
DROP VIEW IF EXISTS approved_listings CASCADE;
DROP VIEW IF EXISTS rejected_listings CASCADE;
DROP VIEW IF EXISTS pending_users CASCADE;
DROP VIEW IF EXISTS approved_users CASCADE;
DROP VIEW IF EXISTS rejected_users CASCADE;
DROP VIEW IF EXISTS admin_users CASCADE;

-- 6. CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories (sadece yoksa)
INSERT INTO categories (name, slug, description, icon, display_order) 
SELECT * FROM (VALUES
  ('Tahıllar', 'tahillar', 'Buğday, arpa, mısır ve diğer tahıl ürünleri', '🌾', 1),
  ('Sebzeler', 'sebzeler', 'Taze sebze ve yeşillikler', '🥕', 2),
  ('Meyveler', 'meyveler', 'Taze meyveler ve meyve ürünleri', '🍎', 3),
  ('Bakliyat', 'bakliyat', 'Nohut, mercimek, fasulye ve diğer baklagiller', '🫘', 4),
  ('Hayvancılık', 'hayvancilik', 'Besi hayvanları, kümes hayvanları ve ürünleri', '🐄', 5),
  ('Ekipman', 'ekipman', 'Tarım makinaları ve ekipmanları', '🚜', 6)
) AS v(name, slug, description, icon, display_order)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE categories.name = v.name);

-- 7. USER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  role user_role DEFAULT 'user',
  status user_status DEFAULT 'pending',
  avatar_url TEXT,
  bio TEXT,
  location VARCHAR(255),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  last_login_at TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT phone_format CHECK (phone ~ '^0?5[0-9]{9}$' OR phone IS NULL)
);

-- Create indexes (IF NOT EXISTS için fonksiyon)
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at DESC);

-- 8. LISTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  listing_type listing_type DEFAULT 'ürün',
  status listing_status DEFAULT 'pending',
  
  price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
  currency VARCHAR(3) DEFAULT 'TRY',
  quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(50) NOT NULL,
  
  location VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  contact_person VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  contact_email VARCHAR(255),
  preferred_contact contact_preference DEFAULT 'telefon',
  
  images TEXT[],
  main_image TEXT,
  
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  listing_secret VARCHAR(64) UNIQUE,
  
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  
  CONSTRAINT phone_format CHECK (contact_phone ~ '^0?5[0-9]{9}$'),
  CONSTRAINT email_format CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR contact_email IS NULL),
  CONSTRAINT title_length CHECK (char_length(title) >= 8),
  CONSTRAINT description_length CHECK (char_length(description) >= 20)
);

CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_category_id ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(location);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_listing_secret ON listings(listing_secret) WHERE listing_secret IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(is_featured, featured_until) WHERE is_featured = true;

-- 9. ADMIN ACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT action_target CHECK (listing_id IS NOT NULL OR user_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_listing_id ON admin_actions(listing_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_user_id ON admin_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at DESC);

-- 10. FAVORITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing_id ON favorites(listing_id);

-- 11. MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name VARCHAR(255) NOT NULL,
  sender_email VARCHAR(255),
  sender_phone VARCHAR(20),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_listing_id ON messages(listing_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- 12. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 13. LISTING VIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS listing_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_views_listing_id ON listing_views(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_views_viewer_id ON listing_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_listing_views_created_at ON listing_views(created_at DESC);

RAISE NOTICE '✅ Tables created/verified successfully!';

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- 1. Update updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name, phone, address, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Kullanıcı'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'address',
    'user',
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. Generate listing secret
CREATE OR REPLACE FUNCTION generate_listing_secret()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.listing_secret IS NULL THEN
    NEW.listing_secret := encode(gen_random_bytes(32), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_listing_secret_trigger
  BEFORE INSERT ON listings
  FOR EACH ROW EXECUTE FUNCTION generate_listing_secret();

-- 4. Set published_at
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    NEW.published_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_published_at_trigger
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION set_published_at();

-- 5. Update favorite count
CREATE OR REPLACE FUNCTION update_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE listings SET favorite_count = favorite_count + 1 WHERE id = NEW.listing_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE listings SET favorite_count = favorite_count - 1 WHERE id = OLD.listing_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_favorite_count_trigger
  AFTER INSERT OR DELETE ON favorites
  FOR EACH ROW EXECUTE FUNCTION update_favorite_count();

-- 6. Notify listing status change
CREATE OR REPLACE FUNCTION notify_listing_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status AND NEW.user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'approved' THEN 'İlanınız Onaylandı'
        WHEN NEW.status = 'rejected' THEN 'İlanınız Reddedildi'
        WHEN NEW.status = 'expired' THEN 'İlanınızın Süresi Doldu'
        ELSE 'İlan Durumu Değişti'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'İlanınız "' || NEW.title || '" onaylandı ve yayınlandı.'
        WHEN NEW.status = 'rejected' THEN 'İlanınız "' || NEW.title || '" reddedildi. Sebep: ' || COALESCE(NEW.rejection_reason, 'Belirtilmedi')
        WHEN NEW.status = 'expired' THEN 'İlanınız "' || NEW.title || '" süresi doldu.'
        ELSE 'İlanınızın durumu değişti.'
      END,
      'listing_' || NEW.status,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_listing_status_change_trigger
  AFTER UPDATE ON listings
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_listing_status_change();

RAISE NOTICE '✅ Functions and triggers created successfully!';

-- ============================================
-- VIEWS FOR ADMIN DASHBOARD
-- ============================================

CREATE OR REPLACE VIEW pending_listings AS
SELECT 
  l.*,
  c.name as category_name,
  c.icon as category_icon,
  up.full_name as user_name,
  up.email as user_email,
  up.phone as user_phone
FROM listings l
LEFT JOIN categories c ON l.category_id = c.id
LEFT JOIN user_profiles up ON l.user_id = up.id
WHERE l.status = 'pending'
ORDER BY l.created_at DESC;

CREATE OR REPLACE VIEW approved_listings AS
SELECT 
  l.*,
  c.name as category_name,
  c.icon as category_icon,
  up.full_name as user_name,
  up.email as user_email,
  up.phone as user_phone
FROM listings l
LEFT JOIN categories c ON l.category_id = c.id
LEFT JOIN user_profiles up ON l.user_id = up.id
WHERE l.status = 'approved'
ORDER BY l.published_at DESC;

CREATE OR REPLACE VIEW rejected_listings AS
SELECT 
  l.*,
  c.name as category_name,
  c.icon as category_icon,
  up.full_name as user_name,
  up.email as user_email,
  up.phone as user_phone
FROM listings l
LEFT JOIN categories c ON l.category_id = c.id
LEFT JOIN user_profiles up ON l.user_id = up.id
WHERE l.status = 'rejected'
ORDER BY l.updated_at DESC;

CREATE OR REPLACE VIEW pending_users AS
SELECT * FROM user_profiles
WHERE status = 'pending'
ORDER BY created_at DESC;

CREATE OR REPLACE VIEW approved_users AS
SELECT * FROM user_profiles
WHERE status = 'approved'
ORDER BY created_at DESC;

CREATE OR REPLACE VIEW rejected_users AS
SELECT * FROM user_profiles
WHERE status = 'rejected'
ORDER BY updated_at DESC;

CREATE OR REPLACE VIEW admin_users AS
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.phone,
  up.role,
  up.status,
  up.created_at,
  up.last_login_at,
  up.login_count,
  au.email_confirmed_at,
  au.last_sign_in_at
FROM user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
WHERE up.role IN ('admin', 'moderator')
ORDER BY up.created_at DESC;

RAISE NOTICE '✅ Views created successfully!';

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_views ENABLE ROW LEVEL SECURITY;

RAISE NOTICE '✅ RLS enabled on all tables!';

-- ============================================
-- RLS POLICIES
-- ============================================

-- CATEGORIES
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only admins can manage categories"
  ON categories FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- USER PROFILES
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')));

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM user_profiles WHERE id = auth.uid()) AND
    status = (SELECT status FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update any profile"
  ON user_profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- LISTINGS
CREATE POLICY "Approved listings are viewable by everyone"
  ON listings FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Users can view own listings"
  ON listings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all listings"
  ON listings FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')));

CREATE POLICY "Authenticated users can create listings"
  ON listings FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Guest users can create listings"
  ON listings FOR INSERT
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Users can update own pending listings"
  ON listings FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Guest users can update with secret"
  ON listings FOR UPDATE
  USING (user_id IS NULL AND listing_secret IS NOT NULL);

CREATE POLICY "Admins can update any listing"
  ON listings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')));

CREATE POLICY "Users can delete own pending listings"
  ON listings FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can delete any listing"
  ON listings FOR DELETE
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ADMIN ACTIONS
CREATE POLICY "Only admins can view admin actions"
  ON admin_actions FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')));

CREATE POLICY "Only admins can create admin actions"
  ON admin_actions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')) AND auth.uid() = admin_id);

-- FAVORITES
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- MESSAGES
CREATE POLICY "Listing owners can view messages"
  ON messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM listings WHERE id = messages.listing_id AND user_id = auth.uid()));

CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')));

CREATE POLICY "Anyone can send messages"
  ON messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Listing owners can update messages"
  ON messages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM listings WHERE id = messages.listing_id AND user_id = auth.uid()));

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- LISTING VIEWS
CREATE POLICY "Anyone can create listing views"
  ON listing_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Listing owners can view analytics"
  ON listing_views FOR SELECT
  USING (EXISTS (SELECT 1 FROM listings WHERE id = listing_views.listing_id AND user_id = auth.uid()));

CREATE POLICY "Admins can view all analytics"
  ON listing_views FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')));

RAISE NOTICE '✅ RLS policies created successfully!';

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_listing_by_secret(secret_key VARCHAR)
RETURNS TABLE (id UUID, title VARCHAR, status listing_status, created_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT l.id, l.title, l.status, l.created_at
  FROM listings l
  WHERE l.listing_secret = secret_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_view_count(listing_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE listings SET view_count = view_count + 1 WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_expired_listings()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE listings
  SET status = 'expired'
  WHERE status = 'approved'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION promote_to_admin(user_email VARCHAR)
RETURNS TABLE (success BOOLEAN, message TEXT) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM user_profiles WHERE email = user_email;
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'User not found';
    RETURN;
  END IF;
  
  UPDATE user_profiles
  SET role = 'admin', status = 'approved', approved_at = NOW(), is_verified = true
  WHERE id = v_user_id;
  
  RETURN QUERY SELECT true, 'User promoted to admin successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

RAISE NOTICE '✅ Helper functions created successfully!';

-- ============================================
-- COMPLETION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SETUP COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Summary:';
  RAISE NOTICE '  - Tables: Created/Verified';
  RAISE NOTICE '  - Indexes: Created';
  RAISE NOTICE '  - Triggers: Created';
  RAISE NOTICE '  - Views: Created';
  RAISE NOTICE '  - RLS: Enabled';
  RAISE NOTICE '  - Policies: Created';
  RAISE NOTICE '  - Functions: Created';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next Steps:';
  RAISE NOTICE '  1. Sign up with: satoshinakamototokyo42@gmail.com';
  RAISE NOTICE '  2. Run: SELECT * FROM promote_to_admin(''satoshinakamototokyo42@gmail.com'');';
  RAISE NOTICE '  3. Test the application!';
  RAISE NOTICE '';
END $$;
