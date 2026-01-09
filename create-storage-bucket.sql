-- ============================================
-- STORAGE BUCKET SETUP FOR LISTING IMAGES
-- ============================================

-- 1. Create storage bucket for listing images
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing_images', 'listing_images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Create storage bucket for user avatars
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('user_avatars', 'user_avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. RLS Policies for listing_images bucket
-- ============================================

-- Enable RLS on storage objects
-- Note: These policies need to be created in Supabase Dashboard Storage section
-- or via Supabase CLI as they're not standard SQL

-- For listing_images bucket:
-- Everyone can read (SELECT) images
-- Authenticated users can insert (INSERT) images
-- Users can update (UPDATE) their own images
-- Users can delete (DELETE) their own images
-- Admins can manage all images

-- Policy: Anyone can read listing images
CREATE POLICY "Anyone can read listing images"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing_images');

-- Policy: Authenticated users can upload listing images
CREATE POLICY "Authenticated users can upload listing images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'listing_images' 
  AND auth.role() = 'authenticated'
);

-- Policy: Users can update their own listing images
CREATE POLICY "Users can update their own listing images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'listing_images' 
  AND auth.uid() = owner
);

-- Policy: Users can delete their own listing images
CREATE POLICY "Users can delete their own listing images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'listing_images' 
  AND auth.uid() = owner
);

-- Policy: Admins can manage all listing images
CREATE POLICY "Admins can manage all listing images"
ON storage.objects FOR ALL
USING (
  bucket_id = 'listing_images' 
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. RLS Policies for user_avatars bucket
-- ============================================

-- Policy: Anyone can read user avatars
CREATE POLICY "Anyone can read user avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'user_avatars');

-- Policy: Authenticated users can upload avatars
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user_avatars' 
  AND auth.role() = 'authenticated'
);

-- Policy: Users can update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user_avatars' 
  AND auth.uid() = owner
);

-- Policy: Users can delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user_avatars' 
  AND auth.uid() = owner
);

-- Policy: Admins can manage all avatars
CREATE POLICY "Admins can manage all avatars"
ON storage.objects FOR ALL
USING (
  bucket_id = 'user_avatars' 
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 5. Storage Functions
-- ============================================

-- Function to get image URL
CREATE OR REPLACE FUNCTION get_image_url(bucket_id TEXT, file_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CONCAT(
    'https://pwnrlllwwzpjcsevwpvr.supabase.co/storage/v1/object/public/',
    bucket_id,
    '/',
    file_name
  );
END;
$$ LANGUAGE plpgsql;

-- Function to delete listing images when listing is deleted
CREATE OR REPLACE FUNCTION delete_listing_images()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all images associated with the listing
  DELETE FROM storage.objects 
  WHERE bucket_id = 'listing_images' 
  AND name LIKE CONCAT(OLD.id, '%');
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to delete images when listing is deleted
CREATE TRIGGER delete_listing_images_trigger
  AFTER DELETE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION delete_listing_images();

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Storage bucket setup completed successfully!';
  RAISE NOTICE '📁 Buckets created: listing_images, user_avatars';
  RAISE NOTICE '🔒 RLS policies enabled on storage objects';
  RAISE NOTICE '⚡ Triggers and functions created';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next steps:';
  RAISE NOTICE '1. Upload images to listing_images bucket';
  RAISE NOTICE '2. Use get_image_url function to retrieve image URLs';
  RAISE NOTICE '3. Images will be automatically deleted when listing is removed';
END $$;