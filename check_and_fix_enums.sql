-- ============================================
-- ENUM TİPLERİNİ KONTROL ET VE OLUŞTUR
-- ============================================

-- Önce mevcut enum'ları listele
DO $$
DECLARE
  enum_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔍 MEVCUT ENUM TİPLERİ KONTROL EDİLİYOR';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  -- listing_status kontrolü
  SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') INTO enum_exists;
  IF enum_exists THEN
    RAISE NOTICE '✅ listing_status mevcut';
  ELSE
    RAISE NOTICE '❌ listing_status YOK - oluşturulacak';
  END IF;
  
  -- user_role kontrolü
  SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') INTO enum_exists;
  IF enum_exists THEN
    RAISE NOTICE '✅ user_role mevcut';
  ELSE
    RAISE NOTICE '❌ user_role YOK - oluşturulacak';
  END IF;
  
  -- user_status kontrolü
  SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') INTO enum_exists;
  IF enum_exists THEN
    RAISE NOTICE '✅ user_status mevcut';
  ELSE
    RAISE NOTICE '❌ user_status YOK - oluşturulacak';
  END IF;
  
  -- listing_type kontrolü
  SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_type') INTO enum_exists;
  IF enum_exists THEN
    RAISE NOTICE '✅ listing_type mevcut';
  ELSE
    RAISE NOTICE '❌ listing_type YOK - oluşturulacak';
  END IF;
  
  -- contact_preference kontrolü
  SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_preference') INTO enum_exists;
  IF enum_exists THEN
    RAISE NOTICE '✅ contact_preference mevcut';
  ELSE
    RAISE NOTICE '❌ contact_preference YOK - oluşturulacak';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ============================================
-- 1. listing_status ENUM
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') THEN
    CREATE TYPE listing_status AS ENUM ('pending', 'approved', 'rejected', 'expired', 'sold');
    RAISE NOTICE '✅ listing_status enum oluşturuldu';
  ELSE
    RAISE NOTICE 'ℹ️ listing_status zaten mevcut, eksik değerler kontrol ediliyor...';
    
    -- expired ekle
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'expired' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'listing_status')
    ) THEN
      ALTER TYPE listing_status ADD VALUE 'expired';
      RAISE NOTICE '  ✅ expired eklendi';
    END IF;
    
    -- sold ekle
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'sold' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'listing_status')
    ) THEN
      ALTER TYPE listing_status ADD VALUE 'sold';
      RAISE NOTICE '  ✅ sold eklendi';
    END IF;
  END IF;
END $$;

-- ============================================
-- 2. user_role ENUM
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
    RAISE NOTICE '✅ user_role enum oluşturuldu';
  ELSE
    RAISE NOTICE 'ℹ️ user_role zaten mevcut, eksik değerler kontrol ediliyor...';
    
    -- moderator ekle
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'moderator' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
      ALTER TYPE user_role ADD VALUE 'moderator';
      RAISE NOTICE '  ✅ moderator eklendi';
    END IF;
  END IF;
END $$;

-- ============================================
-- 3. user_status ENUM
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
    RAISE NOTICE '✅ user_status enum oluşturuldu';
  ELSE
    RAISE NOTICE 'ℹ️ user_status zaten mevcut, eksik değerler kontrol ediliyor...';
    
    -- suspended ekle
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'suspended' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_status')
    ) THEN
      ALTER TYPE user_status ADD VALUE 'suspended';
      RAISE NOTICE '  ✅ suspended eklendi';
    END IF;
  END IF;
END $$;

-- ============================================
-- 4. listing_type ENUM
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_type') THEN
    CREATE TYPE listing_type AS ENUM ('ürün', 'hizmet', 'makine');
    RAISE NOTICE '✅ listing_type enum oluşturuldu';
  ELSE
    RAISE NOTICE 'ℹ️ listing_type zaten mevcut, eksik değerler kontrol ediliyor...';
    
    -- hizmet ekle
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'hizmet' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'listing_type')
    ) THEN
      ALTER TYPE listing_type ADD VALUE 'hizmet';
      RAISE NOTICE '  ✅ hizmet eklendi';
    END IF;
    
    -- makine ekle
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'makine' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'listing_type')
    ) THEN
      ALTER TYPE listing_type ADD VALUE 'makine';
      RAISE NOTICE '  ✅ makine eklendi';
    END IF;
  END IF;
END $$;

-- ============================================
-- 5. contact_preference ENUM
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_preference') THEN
    CREATE TYPE contact_preference AS ENUM ('telefon', 'whatsapp', 'email');
    RAISE NOTICE '✅ contact_preference enum oluşturuldu';
  ELSE
    RAISE NOTICE 'ℹ️ contact_preference zaten mevcut, eksik değerler kontrol ediliyor...';
    
    -- whatsapp ekle
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'whatsapp' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'contact_preference')
    ) THEN
      ALTER TYPE contact_preference ADD VALUE 'whatsapp';
      RAISE NOTICE '  ✅ whatsapp eklendi';
    END IF;
    
    -- email ekle
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'email' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'contact_preference')
    ) THEN
      ALTER TYPE contact_preference ADD VALUE 'email';
      RAISE NOTICE '  ✅ email eklendi';
    END IF;
  END IF;
END $$;

-- ============================================
-- SONUÇ RAPORU
-- ============================================
DO $$
DECLARE
  enum_info RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 GÜNCEL ENUM TİPLERİ VE DEĞERLERİ';
  RAISE NOTICE '========================================';
  
  FOR enum_info IN 
    SELECT 
      t.typname as enum_name,
      string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    WHERE t.typname IN ('listing_status', 'user_role', 'user_status', 'listing_type', 'contact_preference')
    GROUP BY t.typname
    ORDER BY t.typname
  LOOP
    RAISE NOTICE '';
    RAISE NOTICE '📌 %', enum_info.enum_name;
    RAISE NOTICE '   Değerler: %', enum_info.values;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ENUM KURULUMU TAMAMLANDI';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Şimdi supabase_safe_setup.sql çalıştırabilirsiniz!';
  RAISE NOTICE '';
END $$;
