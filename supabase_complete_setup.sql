-- ============================================
-- SUPABASE COMPLETE DATABASE SETUP
-- KöydenAL - Doğrudan Çiftçiden Tüketiciye
-- ============================================

-- 1. EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM TYPES
-- ============================================
DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM ('pending', 'approved', 'rejected', 'expired', 'sold');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE listing_type AS ENUM ('ürün', 'hizmet', 'makine');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE contact_preference AS ENUM ('telefon', 'whatsapp', 'email');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. CATEGORIES TABLE
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

-- Insert default categories
INSERT INTO categories (name, slug, description, icon, display_order) VALUES
  ('Tahıllar', 'tahillar', 'Buğday, arpa, mısır ve diğer tahıl ürünleri', '🌾', 1),
  ('Sebzeler', 'sebzeler', 'Taze sebze ve yeşillikler', '🥕', 2),
  ('Meyveler', 'meyveler', 'Taze meyveler ve meyve ürünleri', '🍎', 3),
  ('Bakliyat', 'bakliyat', 'Nohut, mercimek, fasulye ve diğer baklagiller', '🫘', 4),
  ('Hayvancılık', 'hayvancilik', 'Besi hayvanları, kümes hayvanları ve ürünleri', '🐄', 5),
  ('Ekipman', 'ekipman', 'Tarım makinaları ve ekipmanları', '🚜', 6)
ON CONFLICT (name) DO NOTHING;

-- 4. USER PROFILES TABLE
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

-- Create indexes for user_profiles
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_status ON user_profiles(status);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at DESC);

-- 5. LISTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  
  -- Basic Info
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  listing_type listing_type DEFAULT 'ürün',
  status listing_status DEFAULT 'pending',
  
  -- Pricing
  price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
  currency VARCHAR(3) DEFAULT 'TRY',
  quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(50) NOT NULL,
  
  -- Location
  location VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Contact Info
  contact_person VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  contact_email VARCHAR(255),
  preferred_contact contact_preference DEFAULT 'telefon',
  
  -- Images
  images TEXT[], -- Array of image URLs
  main_image TEXT,
  
  -- Admin Actions
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Guest Listing Support
  listing_secret VARCHAR(64) UNIQUE, -- For non-registered users
  
  -- Metadata
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT phone_format CHECK (contact_phone ~ '^0?5[0-9]{9}$'),
  CONSTRAINT email_format CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR contact_email IS NULL),
  CONSTRAINT title_length CHECK (char_length(title) >= 8),
  CONSTRAINT description_length CHECK (char_length(description) >= 20)
);

-- Create indexes for listings
CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_category_id ON listings(category_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX idx_listings_location ON listings(location);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_listing_secret ON listings(listing_secret) WHERE listing_secret IS NOT NULL;
CREATE INDEX idx_listings_featured ON listings(is_featured, featured_until) WHERE is_featured = true;

-- 6. ADMIN ACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'approved', 'rejected', 'suspended', 'deleted', etc.
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT action_target CHECK (listing_id IS NOT NULL OR user_id IS NOT NULL)
);

CREATE INDEX idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_listing_id ON admin_actions(listing_id);
CREATE INDEX idx_admin_actions_user_id ON admin_actions(user_id);
CREATE INDEX idx_admin_actions_created_at ON admin_actions(created_at DESC);

-- 7. FAVORITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, listing_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_listing_id ON favorites(listing_id);

-- 8. MESSAGES TABLE
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

CREATE INDEX idx_messages_listing_id ON messages(listing_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- 9. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'listing_approved', 'listing_rejected', 'new_message', etc.
  related_id UUID, -- listing_id, message_id, etc.
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- 10. LISTING VIEWS TABLE (Analytics)
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

CREATE INDEX idx_listing_views_listing_id ON listing_views(listing_id);
CREATE INDEX idx_listing_views_viewer_id ON listing_views(viewer_id);
CREATE INDEX idx_listing_views_created_at ON listing_views(created_at DESC);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- 1. Function: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Function: Create user profile on signup
-- ============================================
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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. Function: Generate listing secret for guest users
-- ============================================
CREATE OR REPLACE FUNCTION generate_listing_secret()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.listing_secret IS NULL THEN
    NEW.listing_secret := encode(gen_random_bytes(32), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_listing_secret_trigger ON listings;
CREATE TRIGGER generate_listing_secret_trigger
  BEFORE INSERT ON listings
  FOR EACH ROW EXECUTE FUNCTION generate_listing_secret();

-- 4. Function: Set published_at when status changes to approved
-- ============================================
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    NEW.published_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_published_at_trigger ON listings;
CREATE TRIGGER set_published_at_trigger
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION set_published_at();

-- 5. Function: Update favorite count
-- ============================================
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

DROP TRIGGER IF EXISTS update_favorite_count_trigger ON favorites;
CREATE TRIGGER update_favorite_count_trigger
  AFTER INSERT OR DELETE ON favorites
  FOR EACH ROW EXECUTE FUNCTION update_favorite_count();

-- 6. Function: Create notification on listing status change
-- ============================================
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

DROP TRIGGER IF EXISTS notify_listing_status_change_trigger ON listings;
CREATE TRIGGER notify_listing_status_change_trigger
  AFTER UPDATE ON listings
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_listing_status_change();

-- 7. Function: Update user login stats
-- ============================================
CREATE OR REPLACE FUNCTION update_user_login_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET 
    last_login_at = NOW(),
    login_count = login_count + 1
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: This trigger should be created on auth.users table
-- But we can't directly create triggers on auth schema
-- So we'll handle this in the application layer

-- ============================================
-- VIEWS FOR ADMIN DASHBOARD
-- ============================================

-- 1. Pending Listings View
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

-- 2. Approved Listings View
-- ============================================
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

-- 3. Rejected Listings View
-- ============================================
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

-- 4. Pending Users View
-- ============================================
CREATE OR REPLACE VIEW pending_users AS
SELECT *
FROM user_profiles
WHERE status = 'pending'
ORDER BY created_at DESC;

-- 5. Approved Users View
-- ============================================
CREATE OR REPLACE VIEW approved_users AS
SELECT *
FROM user_profiles
WHERE status = 'approved'
ORDER BY created_at DESC;

-- 6. Rejected Users View
-- ============================================
CREATE OR REPLACE VIEW rejected_users AS
SELECT *
FROM user_profiles
WHERE status = 'rejected'
ORDER BY updated_at DESC;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_views ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CATEGORIES POLICIES
-- ============================================

-- Everyone can read categories
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (is_active = true);

-- Only admins can insert/update/delete categories
DROP POLICY IF EXISTS "Only admins can manage categories" ON categories;
CREATE POLICY "Only admins can manage categories"
  ON categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- USER PROFILES POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Users can update their own profile (except role and status)
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM user_profiles WHERE id = auth.uid()) AND
    status = (SELECT status FROM user_profiles WHERE id = auth.uid())
  );

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- New users can insert their profile (handled by trigger)
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- LISTINGS POLICIES
-- ============================================

-- Everyone can view approved listings
CREATE POLICY "Approved listings are viewable by everyone"
  ON listings FOR SELECT
  USING (status = 'approved');

-- Users can view their own listings (any status)
CREATE POLICY "Users can view own listings"
  ON listings FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all listings
CREATE POLICY "Admins can view all listings"
  ON listings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Authenticated users can create listings
CREATE POLICY "Authenticated users can create listings"
  ON listings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    auth.uid() IS NOT NULL
  );

-- Guest users can create listings (user_id will be NULL)
CREATE POLICY "Guest users can create listings"
  ON listings FOR INSERT
  WITH CHECK (user_id IS NULL);

-- Users can update their own pending listings
CREATE POLICY "Users can update own pending listings"
  ON listings FOR UPDATE
  USING (
    auth.uid() = user_id AND
    status = 'pending'
  )
  WITH CHECK (
    auth.uid() = user_id AND
    status = 'pending'
  );

-- Guest users can update their listings with secret
CREATE POLICY "Guest users can update with secret"
  ON listings FOR UPDATE
  USING (
    user_id IS NULL AND
    listing_secret IS NOT NULL
  );

-- Admins can update any listing
CREATE POLICY "Admins can update any listing"
  ON listings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Users can delete their own pending listings
CREATE POLICY "Users can delete own pending listings"
  ON listings FOR DELETE
  USING (
    auth.uid() = user_id AND
    status = 'pending'
  );

-- Admins can delete any listing
CREATE POLICY "Admins can delete any listing"
  ON listings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- ADMIN ACTIONS POLICIES
-- ============================================

-- Only admins can view admin actions
CREATE POLICY "Only admins can view admin actions"
  ON admin_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Only admins can create admin actions
CREATE POLICY "Only admins can create admin actions"
  ON admin_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    ) AND
    auth.uid() = admin_id
  );

-- ============================================
-- FAVORITES POLICIES
-- ============================================

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add favorites
CREATE POLICY "Users can add favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own favorites
CREATE POLICY "Users can remove own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- MESSAGES POLICIES
-- ============================================

-- Listing owners can view messages for their listings
CREATE POLICY "Listing owners can view messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE id = messages.listing_id AND user_id = auth.uid()
    )
  );

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Anyone can send messages
CREATE POLICY "Anyone can send messages"
  ON messages FOR INSERT
  WITH CHECK (true);

-- Listing owners can mark messages as read
CREATE POLICY "Listing owners can update messages"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE id = messages.listing_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- System can create notifications (handled by triggers)
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- LISTING VIEWS POLICIES
-- ============================================

-- Anyone can create listing views (for analytics)
CREATE POLICY "Anyone can create listing views"
  ON listing_views FOR INSERT
  WITH CHECK (true);

-- Listing owners can view their listing analytics
CREATE POLICY "Listing owners can view analytics"
  ON listing_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE id = listing_views.listing_id AND user_id = auth.uid()
    )
  );

-- Admins can view all analytics
CREATE POLICY "Admins can view all analytics"
  ON listing_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- ============================================
-- HELPER FUNCTIONS FOR APPLICATION
-- ============================================

-- Function: Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get listing by secret (for guest users)
CREATE OR REPLACE FUNCTION get_listing_by_secret(secret_key VARCHAR)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  status listing_status,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT l.id, l.title, l.status, l.created_at
  FROM listings l
  WHERE l.listing_secret = secret_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Increment view count
CREATE OR REPLACE FUNCTION increment_view_count(listing_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE listings
  SET view_count = view_count + 1
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS TABLE (
  total_listings BIGINT,
  approved_listings BIGINT,
  pending_listings BIGINT,
  total_views BIGINT,
  total_favorites BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE true) as total_listings,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_listings,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_listings,
    COALESCE(SUM(view_count), 0) as total_views,
    COALESCE(SUM(favorite_count), 0) as total_favorites
  FROM listings
  WHERE listings.user_id = get_user_stats.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CREATE ADMIN USER
-- ============================================

-- Note: This should be run AFTER the first user signs up
-- Or you can create the user directly in Supabase Auth Dashboard

-- Insert admin user profile (if user already exists in auth.users)
-- Replace 'USER_UUID_HERE' with actual UUID from auth.users table

-- Example (run this after admin user signs up):
/*
UPDATE user_profiles
SET 
  role = 'admin',
  status = 'approved',
  approved_at = NOW()
WHERE email = 'satoshinakamototokyo42@gmail.com';
*/

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample listings (uncomment if needed)
/*
INSERT INTO listings (
  title, description, price, currency, quantity, unit,
  location, category_id, listing_type, status,
  contact_person, contact_phone, contact_email
) VALUES
  (
    'Organik Buğday - 100 kg',
    'Tamamen organik, kimyasal gübre kullanılmadan yetiştirilmiş buğday. Taze hasat edilmiştir.',
    1500.00, 'TRY', 100, 'kg',
    'ACIKUYU MAHALLESİ',
    (SELECT id FROM categories WHERE name = 'Tahıllar'),
    'ürün', 'approved',
    'Ahmet Yılmaz', '05551234567', 'ahmet@example.com'
  ),
  (
    'Taze Domates - 50 kg',
    'Sera domatesi, günlük taze. Toptan satış yapılır.',
    250.00, 'TRY', 50, 'kg',
    'CUMHURİYET MAHALLESİ',
    (SELECT id FROM categories WHERE name = 'Sebzeler'),
    'ürün', 'pending',
    'Mehmet Demir', '05559876543', 'mehmet@example.com'
  );
*/

-- ============================================
-- MAINTENANCE QUERIES
-- ============================================

-- Clean up expired listings (run periodically)
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

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database setup completed successfully!';
  RAISE NOTICE '📋 Tables created: categories, user_profiles, listings, admin_actions, favorites, messages, notifications, listing_views';
  RAISE NOTICE '🔒 RLS policies enabled on all tables';
  RAISE NOTICE '⚡ Triggers and functions created';
  RAISE NOTICE '👁️ Admin views created for dashboard';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next steps:';
  RAISE NOTICE '1. Create admin user: Sign up with email satoshinakamototokyo42@gmail.com';
  RAISE NOTICE '2. Run: UPDATE user_profiles SET role = ''admin'', status = ''approved'' WHERE email = ''satoshinakamototokyo42@gmail.com'';
  RAISE NOTICE '3. Test the application!';
END $$;
