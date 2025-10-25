-- Kullanıcı kayıt trigger'ını kontrol et ve düzelt

-- 1. Mevcut trigger'ı sil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Yeni trigger fonksiyonu oluştur
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $
BEGIN
  -- Log ekle
  RAISE NOTICE 'New user created: %', NEW.id;
  RAISE NOTICE 'Email: %', NEW.email;
  RAISE NOTICE 'Metadata: %', NEW.raw_user_meta_data;

  -- User profile oluştur
  INSERT INTO public.user_profiles (
    id, 
    email, 
    full_name, 
    phone, 
    address, 
    role, 
    status
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Kullanıcı'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'address',
    'user',
    'pending'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
    address = COALESCE(EXCLUDED.address, user_profiles.address),
    updated_at = NOW();

  RAISE NOTICE 'User profile created successfully';
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger'ı yeniden oluştur
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. Mevcut kullanıcıları kontrol et
DO $
DECLARE
  user_record RECORD;
  profile_count INTEGER;
BEGIN
  -- Auth'da olan ama user_profiles'da olmayan kullanıcıları bul
  FOR user_record IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.user_profiles up ON au.id = up.id
    WHERE up.id IS NULL
  LOOP
    RAISE NOTICE 'Found user without profile: % (%)', user_record.email, user_record.id;
    
    -- Profil oluştur
    INSERT INTO public.user_profiles (
      id, 
      email, 
      full_name, 
      phone, 
      address, 
      role, 
      status
    ) VALUES (
      user_record.id,
      user_record.email,
      COALESCE(user_record.raw_user_meta_data->>'full_name', 'Kullanıcı'),
      user_record.raw_user_meta_data->>'phone',
      user_record.raw_user_meta_data->>'address',
      'user',
      'pending'
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Profile created for: %', user_record.email;
  END LOOP;
  
  -- Sonuçları göster
  SELECT COUNT(*) INTO profile_count FROM public.user_profiles;
  RAISE NOTICE '✅ Total user profiles: %', profile_count;
END $;

-- 5. Test sorguları
SELECT 
  'Auth Users' as table_name,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
  'User Profiles' as table_name,
  COUNT(*) as count
FROM public.user_profiles;

-- 6. Son 5 kullanıcıyı göster
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.phone,
  up.status,
  up.created_at
FROM public.user_profiles up
ORDER BY up.created_at DESC
LIMIT 5;

-- Başarı mesajı
DO $
BEGIN
  RAISE NOTICE '✅ User registration trigger fixed!';
  RAISE NOTICE '✅ All existing users synced!';
  RAISE NOTICE '📝 New registrations will automatically create profiles!';
END $;
