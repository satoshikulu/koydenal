-- ============================================
-- KÖYDENAl - UYARLANMIŞ SUPABASE ŞEMASI
-- Çalışan kulutarimagore.sql temel alınarak hazırlanmıştır
-- ============================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TİPLERİ (Önce oluştur)
DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM ('pending', 'approved', 'rejected', 'expired', 'sold');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE listing_type AS ENUM ('ürün', 'hizmet', 'makine');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE contact_preference AS ENUM ('telefon', 'whatsapp', 'email');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================
-- 3. CATEGORIES TABLOSU
-- ============================================
CREATE TABLE IF NOT EXISTS public.categories (
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

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);

-- Varsayılan kategoriler
INSERT INTO public.categories (name, slug, description, icon, display_order) VALUES
  ('Tahıllar', 'tahillar', 'Buğday, arpa, mısır ve diğer tahıl ürünleri', '🌾', 1),
  ('Sebzeler', 'sebzeler', 'Taze sebze ve yeşillikler', '🥕', 2),
  ('Meyveler', 'meyveler', 'Taze meyveler ve meyve ürünleri', '🍎', 3),
  ('Bakliyat', 'bakliyat', 'Nohut, mercimek, fasulye ve diğer baklagiller', '🫘', 4),
  ('Hayvancılık', 'hayvancilik', 'Besi hayvanları, kümes hayvanları ve ürünleri', '🐄', 5),
  ('Ekipman', 'ekipman', 'Tarım makinaları ve ekipmanları', '🚜', 6)
ON CONFLICT (name) DO NOTHING;

-- RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_policy" ON public.categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "categories_all_policy" ON public.categories
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- 4. USER_PROFILES TABLOSU (users_min yerine)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
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

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON public.user_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at DESC);

-- RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles_insert_policy" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_select_own" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "user_profiles_select_admin" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
    );

CREATE POLICY "user_profiles_update_own" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        role = (SELECT role FROM public.user_profiles WHERE id = auth.uid()) AND
        status = (SELECT status FROM public.user_profiles WHERE id = auth.uid())
    );

CREATE POLICY "user_profiles_update_admin" ON public.user_profiles
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- 5. LISTINGS TABLOSU (Genişletilmiş)
-- ============================================
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    
    -- Temel Bilgiler
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    listing_type listing_type DEFAULT 'ürün',
    status listing_status DEFAULT 'pending',
    
    -- Fiyat Bilgileri
    price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
    currency VARCHAR(3) DEFAULT 'TRY',
    quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    
    -- Lokasyon
    location VARCHAR(255) NOT NULL,
    neighborhood TEXT, -- kulutarimagore'den
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- İletişim Bilgileri
    contact_person VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(255),
    preferred_contact contact_preference DEFAULT 'telefon',
    
    -- Emlak Detayları (kulutarimagore'den)
    property_type TEXT,
    rooms TEXT,
    area_m2 INTEGER,
    is_for TEXT CHECK (is_for IN ('satilik', 'kiralik')),
    
    -- Görseller
    images TEXT[],
    main_image TEXT,
    
    -- Admin İşlemleri
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Misafir Kullanıcı Desteği
    listing_secret VARCHAR(64) UNIQUE,
    
    -- Metadata
    view_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    featured_until TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    -- Zaman Damgaları
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    
    -- Kısıtlamalar
    CONSTRAINT phone_format CHECK (contact_phone ~ '^0?5[0-9]{9}$'),
    CONSTRAINT email_format CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR contact_email IS NULL),
    CONSTRAINT title_length CHECK (char_length(title) >= 8),
    CONSTRAINT description_length CHECK (char_length(description) >= 20)
);

-- İndeksler (kulutarimagore'den + yeniler)
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON public.listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_category_id ON public.listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_listing_type ON public.listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_listings_is_for ON public.listings(is_for);
CREATE INDEX IF NOT EXISTS idx_listings_neighborhood ON public.listings(neighborhood);
CREATE INDEX IF NOT EXISTS idx_listings_property_type ON public.listings(property_type);
CREATE INDEX IF NOT EXISTS idx_listings_location ON public.listings(location);
CREATE INDEX IF NOT EXISTS idx_listings_price ON public.listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_area_m2 ON public.listings(area_m2);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_approved_at ON public.listings(approved_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_published_at ON public.listings(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_contact_phone ON public.listings(contact_phone);
CREATE INDEX IF NOT EXISTS idx_listings_listing_secret ON public.listings(listing_secret) WHERE listing_secret IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_featured ON public.listings(is_featured, featured_until) WHERE is_featured = true;

-- Text search için GIN index (Türkçe)
CREATE INDEX IF NOT EXISTS idx_listings_search ON public.listings 
    USING gin(to_tsvector('turkish', 
        coalesce(title, '') || ' ' || 
        coalesce(description, '') || ' ' || 
        coalesce(location, '') || ' ' || 
        coalesce(neighborhood, '')
    ));

-- RLS
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listings_insert_policy" ON public.listings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "listings_select_approved" ON public.listings
    FOR SELECT USING (status = 'approved');

CREATE POLICY "listings_select_own" ON public.listings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "listings_select_admin" ON public.listings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
    );

CREATE POLICY "listings_update_own_pending" ON public.listings
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending')
    WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "listings_update_guest_secret" ON public.listings
    FOR UPDATE USING (user_id IS NULL AND listing_secret IS NOT NULL);

CREATE POLICY "listings_update_admin" ON public.listings
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
    );

CREATE POLICY "listings_delete_own_pending" ON public.listings
    FOR DELETE USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "listings_delete_admin" ON public.listings
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- 6. ADMIN_ACTIONS TABLOSU
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT action_target CHECK (listing_id IS NOT NULL OR user_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_listing_id ON public.admin_actions(listing_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_user_id ON public.admin_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at DESC);

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_actions_select_policy" ON public.admin_actions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
    );

CREATE POLICY "admin_actions_insert_policy" ON public.admin_actions
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')) 
        AND auth.uid() = admin_id
    );

-- ============================================
-- 7. FAVORITES TABLOSU
-- ============================================
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing_id ON public.favorites(listing_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON public.favorites(created_at DESC);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_select_policy" ON public.favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "favorites_insert_policy" ON public.favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_delete_policy" ON public.favorites
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 8. MESSAGES TABLOSU
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255),
    sender_phone VARCHAR(20),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_listing_id ON public.messages(listing_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_owner" ON public.messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.listings WHERE id = messages.listing_id AND user_id = auth.uid())
    );

CREATE POLICY "messages_select_admin" ON public.messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
    );

CREATE POLICY "messages_insert_policy" ON public.messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "messages_update_owner" ON public.messages
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.listings WHERE id = messages.listing_id AND user_id = auth.uid())
    );

-- ============================================
-- 9. NOTIFICATIONS TABLOSU
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
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

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_policy" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_policy" ON public.notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "notifications_update_policy" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_delete_policy" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 10. LISTING_VIEWS TABLOSU
-- ============================================
CREATE TABLE IF NOT EXISTS public.listing_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_views_listing_id ON public.listing_views(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_views_viewer_id ON public.listing_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_listing_views_created_at ON public.listing_views(created_at DESC);

ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listing_views_insert_policy" ON public.listing_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "listing_views_select_owner" ON public.listing_views
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.listings WHERE id = listing_views.listing_id AND user_id = auth.uid())
    );

CREATE POLICY "listing_views_select_admin" ON public.listing_views
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
    );

-- ============================================
-- 11. STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings.images', 'listings.images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Politikaları
CREATE POLICY "listings_images_select_policy" ON storage.objects
    FOR SELECT USING (bucket_id = 'listings.images');

CREATE POLICY "listings_images_insert_policy" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'listings.images');

CREATE POLICY "listings_images_delete_policy" ON storage.objects
    FOR DELETE USING (bucket_id = 'listings.images');

-- ============================================
-- 12. TRIGGER'LAR VE FONKSİYONLAR
-- ============================================

-- Updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_listings_updated_at ON public.listings;
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Yeni kullanıcı profili oluşturma
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, phone, address, role, status)
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Misafir kullanıcı için gizli anahtar oluşturma
CREATE OR REPLACE FUNCTION generate_listing_secret()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.listing_secret IS NULL THEN
    NEW.listing_secret := encode(gen_random_bytes(32), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_listing_secret_trigger ON public.listings;
CREATE TRIGGER generate_listing_secret_trigger
  BEFORE INSERT ON public.listings
  FOR EACH ROW EXECUTE FUNCTION generate_listing_secret();

-- İlan onaylandığında published_at ayarla
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    NEW.published_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_published_at_trigger ON public.listings;
CREATE TRIGGER set_published_at_trigger
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION set_published_at();

-- Favori sayacını güncelle
CREATE OR REPLACE FUNCTION update_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.listings SET favorite_count = favorite_count + 1 WHERE id = NEW.listing_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.listings SET favorite_count = favorite_count - 1 WHERE id = OLD.listing_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_favorite_count_trigger ON public.favorites;
CREATE TRIGGER update_favorite_count_trigger
  AFTER INSERT OR DELETE ON public.favorites
  FOR EACH ROW EXECUTE FUNCTION update_favorite_count();

-- İlan durumu değiştiğinde bildirim gönder
CREATE OR REPLACE FUNCTION notify_listing_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
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

DROP TRIGGER IF EXISTS notify_listing_status_change_trigger ON public.listings;
CREATE TRIGGER notify_listing_status_change_trigger
  AFTER UPDATE ON public.listings
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_listing_status_change();

-- ============================================
-- 13. YARDIMCI FONKSİYONLAR (kulutarimagore'den)
-- ============================================

-- İlan arama fonksiyonu (Türkçe full-text search)
CREATE OR REPLACE FUNCTION search_listings(search_query TEXT)
RETURNS SETOF public.listings AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.listings
    WHERE 
        status = 'approved' AND
        to_tsvector('turkish', 
            coalesce(title, '') || ' ' || 
            coalesce(description, '') || ' ' || 
            coalesce(location, '') || ' ' || 
            coalesce(neighborhood, '')
        ) @@ plainto_tsquery('turkish', search_query)
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- İstatistik fonksiyonu (admin için)
CREATE OR REPLACE FUNCTION get_listings_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_listings', COUNT(*),
        'pending_listings', COUNT(*) FILTER (WHERE status = 'pending'),
        'approved_listings', COUNT(*) FILTER (WHERE status = 'approved'),
        'rejected_listings', COUNT(*) FILTER (WHERE status = 'rejected'),
        'expired_listings', COUNT(*) FILTER (WHERE status = 'expired'),
        'sold_listings', COUNT(*) FILTER (WHERE status = 'sold'),
        'satilik_count', COUNT(*) FILTER (WHERE is_for = 'satilik'),
        'kiralik_count', COUNT(*) FILTER (WHERE is_for = 'kiralik'),
        'avg_price', ROUND(AVG(price), 2) FILTER (WHERE price IS NOT NULL),
        'total_users', (SELECT COUNT(*) FROM public.user_profiles),
        'pending_users', (SELECT COUNT(*) FROM public.user_profiles WHERE status = 'pending'),
        'approved_users', (SELECT COUNT(*) FROM public.user_profiles WHERE status = 'approved'),
        'total_views', (SELECT COUNT(*) FROM public.listing_views),
        'total_favorites', (SELECT COUNT(*) FROM public.favorites)
    )
    INTO result
    FROM public.listings;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Admin kontrolü
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gizli anahtarla ilan getir
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
  FROM public.listings l
  WHERE l.listing_secret = secret_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Görüntüleme sayısını artır
CREATE OR REPLACE FUNCTION increment_view_count(listing_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.listings
  SET view_count = view_count + 1
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Süresi dolan ilanları temizle
CREATE OR REPLACE FUNCTION cleanup_expired_listings()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE public.listings
  SET status = 'expired'
  WHERE status = 'approved'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- Admin yap
CREATE OR REPLACE FUNCTION promote_to_admin(user_email VARCHAR)
RETURNS TABLE (success BOOLEAN, message TEXT) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM public.user_profiles WHERE email = user_email;
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'User not found';
    RETURN;
  END IF;
  
  UPDATE public.user_profiles
  SET role = 'admin', status = 'approved', approved_at = NOW(), is_verified = true
  WHERE id = v_user_id;
  
  RETURN QUERY SELECT true, 'User promoted to admin successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 14. ADMIN VIEWS
-- ============================================

CREATE OR REPLACE VIEW pending_listings AS
SELECT 
  l.*,
  c.name as category_name,
  c.icon as category_icon,
  up.full_name as user_name,
  up.email as user_email,
  up.phone as user_phone
FROM public.listings l
LEFT JOIN public.categories c ON l.category_id = c.id
LEFT JOIN public.user_profiles up ON l.user_id = up.id
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
FROM public.listings l
LEFT JOIN public.categories c ON l.category_id = c.id
LEFT JOIN public.user_profiles up ON l.user_id = up.id
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
FROM public.listings l
LEFT JOIN public.categories c ON l.category_id = c.id
LEFT JOIN public.user_profiles up ON l.user_id = up.id
WHERE l.status = 'rejected'
ORDER BY l.updated_at DESC;

CREATE OR REPLACE VIEW pending_users AS
SELECT * FROM public.user_profiles
WHERE status = 'pending'
ORDER BY created_at DESC;

CREATE OR REPLACE VIEW approved_users AS
SELECT * FROM public.user_profiles
WHERE status = 'approved'
ORDER BY created_at DESC;

CREATE OR REPLACE VIEW rejected_users AS
SELECT * FROM public.user_profiles
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
FROM public.user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
WHERE up.role IN ('admin', 'moderator')
ORDER BY up.created_at DESC;

-- ============================================
-- 15. ÖRNEK VERİLER (Test için - opsiyonel)
-- ============================================

-- Örnek ilanlar (kategoriler varsa)
DO $$
DECLARE
  tahillar_id UUID;
  sebzeler_id UUID;
BEGIN
  SELECT id INTO tahillar_id FROM public.categories WHERE name = 'Tahıllar' LIMIT 1;
  SELECT id INTO sebzeler_id FROM public.categories WHERE name = 'Sebzeler' LIMIT 1;
  
  IF tahillar_id IS NOT NULL THEN
    INSERT INTO public.listings (
      title, description, price, currency, quantity, unit,
      location, category_id, listing_type, status,
      contact_person, contact_phone, contact_email
    ) VALUES
      (
        'Organik Buğday - 100 kg',
        'Tamamen organik, kimyasal gübre kullanılmadan yetiştirilmiş buğday. Taze hasat edilmiştir.',
        1500.00, 'TRY', 100, 'kg',
        'ACIKUYU MAHALLESİ',
        tahillar_id,
        'ürün', 'approved',
        'Ahmet Yılmaz', '05551234567', 'ahmet@example.com'
      )
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF sebzeler_id IS NOT NULL THEN
    INSERT INTO public.listings (
      title, description, price, currency, quantity, unit,
      location, category_id, listing_type, status,
      contact_person, contact_phone
    ) VALUES
      (
        'Taze Domates - 50 kg',
        'Sera domatesi, günlük taze. Toptan satış yapılır.',
        250.00, 'TRY', 50, 'kg',
        'CUMHURİYET MAHALLESİ',
        sebzeler_id,
        'ürün', 'pending',
        'Mehmet Demir', '05559876543'
      )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================
-- KURULUM TAMAMLANDI
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ KÖYDENAl ŞEMASI KURULDU';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Oluşturulan Tablolar:';
  RAISE NOTICE '  - categories (6 kategori)';
  RAISE NOTICE '  - user_profiles (auth entegreli)';
  RAISE NOTICE '  - listings (genişletilmiş)';
  RAISE NOTICE '  - admin_actions';
  RAISE NOTICE '  - favorites';
  RAISE NOTICE '  - messages';
  RAISE NOTICE '  - notifications';
  RAISE NOTICE '  - listing_views';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 RLS Politikaları: Aktif';
  RAISE NOTICE '⚡ Trigger''lar: Kuruldu';
  RAISE NOTICE '👁️ Admin Views: Oluşturuldu';
  RAISE NOTICE '🔍 Türkçe Arama: Aktif';
  RAISE NOTICE '📦 Storage Bucket: Hazır';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Sonraki Adımlar:';
  RAISE NOTICE '  1. Admin kullanıcı oluştur';
  RAISE NOTICE '  2. SELECT * FROM promote_to_admin(''email@example.com'');';
  RAISE NOTICE '  3. Uygulamayı test et';
  RAISE NOTICE '';
END $$;
