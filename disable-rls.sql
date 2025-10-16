-- Geçici olarak RLS'yi devre dışı bırakmak için SQL komutları
-- Bu komutları Supabase SQL Editor'da çalıştırın

-- Listings tablosu için RLS'yi geçici olarak devre dışı bırak
ALTER TABLE public.listings DISABLE ROW LEVEL SECURITY;

-- Test tamamlandıktan sonra tekrar aktifleştir
-- ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
