-- =====================================================
-- TELEFON NUMARASI SORUNU DEBUG SCRIPT
-- =====================================================

-- Adım 1: Mevcut kolon tipini kontrol et
SELECT column_name, data_type, is_nullable, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'user_profiles' AND column_name = 'phone';

-- Adım 2: Mevcut veriyi kontrol et
SELECT id, email, phone, phone IS NULL as phone_is_null, LENGTH(phone) as phone_length
FROM user_profiles
WHERE phone IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Adım 3: Telefon numarası örnekleri göster
SELECT
    'Örnek telefon formatları:' as info,
    phone as mevcut_telefon,
    CASE
        WHEN phone ~ '^[0-9+\-\s()]+$' THEN 'Geçerli format'
        ELSE 'Geçersiz format'
    END as format_durumu
FROM user_profiles
WHERE phone IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- Adım 4: Eğer hala TEXT ise dönüştür
DO $$
BEGIN
    -- Eğer phone kolonu hala TEXT ise
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'phone'
        AND data_type = 'text'
    ) THEN
        RAISE NOTICE 'Phone kolonu hala TEXT, VARCHAR(15) olarak değiştiriliyor...';

        -- Yeni kolon oluştur
        ALTER TABLE user_profiles ADD COLUMN phone_new VARCHAR(15);

        -- Veriyi dönüştür (sayı olmayan karakterleri temizle)
        UPDATE user_profiles
        SET phone_new = REGEXP_REPLACE(TRIM(phone), '[^0-9+]', '', 'g')
        WHERE phone IS NOT NULL AND phone != '';

        -- Eski kolonu sil
        ALTER TABLE user_profiles DROP COLUMN phone;

        -- Yeni kolonu rename et
        ALTER TABLE user_profiles RENAME COLUMN phone_new TO phone;

        RAISE NOTICE 'Dönüştürme tamamlandı!';
    ELSE
        RAISE NOTICE 'Phone kolonu zaten doğru tipte: %',
            (SELECT data_type FROM information_schema.columns
             WHERE table_name = 'user_profiles' AND column_name = 'phone');
    END IF;
END $$;

-- Sonuç kontrolü
SELECT 'Son durum:' as info, column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'user_profiles' AND column_name = 'phone';
