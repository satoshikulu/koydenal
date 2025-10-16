-- =====================================================
-- USER PROFILES TELEFON KOLONUNU TEXT -> VARCHAR ÇEVİRME (DAHA İYİ YAKLAŞIM)
-- =====================================================

-- DİKKAT: Bu işlem mevcut verileri etkileyebilir!
-- Önce mevcut veriyi kontrol edin

-- Adım 1: Yeni varchar kolon oluştur (telefon numarası için ideal: +90XXXXXXXXXX formatı)
ALTER TABLE user_profiles
ADD COLUMN phone_new VARCHAR(15);

-- Adım 2: Mevcut text veriyi temizle ve yeni kolona aktar
UPDATE user_profiles
SET phone_new = REGEXP_REPLACE(TRIM(phone), '[^0-9+]', '', 'g')
WHERE phone IS NOT NULL AND phone != '';

-- Adım 3: Eski text kolonu sil
ALTER TABLE user_profiles
DROP COLUMN phone;

-- Adım 4: Yeni kolonu rename et
ALTER TABLE user_profiles
RENAME COLUMN phone_new TO phone;

-- Adım 5: Kontrol et
SELECT 'Telefon kolonu başarıyla VARCHAR yapıldı!' as status;

-- Şema kontrolü
SELECT column_name, data_type, is_nullable, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'user_profiles' AND column_name = 'phone';
