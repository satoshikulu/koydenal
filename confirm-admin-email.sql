-- Admin kullanıcısının email'ini onayla
-- Bu scripti Supabase Dashboard > SQL Editor'de çalıştırın

-- 1. Admin kullanıcısını bul ve email'ini onayla
UPDATE auth.users
SET 
  email_confirmed_at = NOW()
WHERE email = 'satoshinakamototokyo42@gmail.com';

-- 2. Kontrol et
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at
FROM auth.users
WHERE email = 'satoshinakamototokyo42@gmail.com';
