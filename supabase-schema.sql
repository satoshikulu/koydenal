-- Kulu Tarım - Agricultural Marketplace Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE listing_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE listing_type AS ENUM ('ürün', 'hizmet', 'arazi', 'ekipman', 'hayvan');
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Users profile table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    location TEXT,
    role user_role DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Categories table for agricultural listings
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Main listings table
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2),
    currency TEXT DEFAULT 'TRY',
    location TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id),
    listing_type listing_type NOT NULL,
    status listing_status DEFAULT 'pending',

    -- Product/Service specific fields
    quantity DECIMAL(10,2),
    unit TEXT, -- kg, ton, adet, etc.
    quality_grade TEXT,
    harvest_date DATE,
    expiry_date DATE,

    -- Contact information
    contact_phone TEXT,
    contact_email TEXT,
    contact_person TEXT,

    -- Media
    images TEXT[], -- Array of image URLs
    main_image TEXT,

    -- Location coordinates (optional)
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),

    -- User who created the listing
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,

    -- Admin fields
    approved_by UUID REFERENCES public.user_profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),

    -- Search optimization
    search_vector tsvector
);

-- Admin actions log table
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'approved', 'rejected', 'edited'
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON public.listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_category_id ON public.listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_location ON public.listings(location);
CREATE INDEX IF NOT EXISTS idx_listings_search ON public.listings USING gin(search_vector);

-- Insert some default categories
INSERT INTO public.categories (name, description, icon) VALUES
('Tahıllar', 'Buğday, arpa, mısır, çeltik gibi tahıl ürünleri', '🌾'),
('Sebzeler', 'Domates, biber, patlıcan, salata gibi sebzeler', '🥕'),
('Meyveler', 'Elma, armut, şeftali, üzüm gibi meyveler', '🍎'),
('Bakliyat', 'Mercimek, nohut, fasulye gibi bakliyat ürünleri', '🫘'),
('Hayvancılık', 'Büyükbaş, küçükbaş hayvanlar ve ürünleri', '🐄'),
('Ekipman', 'Traktör, pulluk, sulama sistemleri', '🚜'),
('Arazi', 'Tarım arazileri, bağlar, bahçeler', '🏞️'),
('Hizmetler', 'Tarım danışmanlığı, nakliye, ilaçlama', '🔧')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for listings (everyone can create, view approved ones)
CREATE POLICY "Anyone can view approved listings" ON public.listings
    FOR SELECT USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Users can create listings" ON public.listings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings" ON public.listings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings" ON public.listings
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for categories (read-only for everyone)
CREATE POLICY "Anyone can view categories" ON public.categories
    FOR SELECT USING (true);

-- RLS Policies for admin_actions (admins can view all, users can view their own listing actions)
CREATE POLICY "Admins can view all admin actions" ON public.admin_actions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view actions on their listings" ON public.admin_actions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.listings
            WHERE listings.id = admin_actions.listing_id
            AND listings.user_id = auth.uid()
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at
    BEFORE UPDATE ON public.listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_listing_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('turkish', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('turkish', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('turkish', COALESCE(NEW.location, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create storage bucket for listing images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for listing images
CREATE POLICY "Anyone can view listing images" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-images');

CREATE POLICY "Users can upload listing images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'listing-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own listing images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'listing-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own listing images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'listing-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admin can manage all images
CREATE POLICY "Admins can manage all listing images" ON storage.objects
  FOR ALL USING (
    bucket_id = 'listing-images'
    AND EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
