-- Listings tablosundaki tüm RLS politikalarını kontrol et

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'listings'
ORDER BY cmd, policyname;

-- RLS'in aktif olup olmadığını kontrol et
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'listings';
