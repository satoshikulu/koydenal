# Admin Dashboard Kullanıcı Görüntüleme Sorunu - Çözüm

## Sorun
Üyeler kayıt olduğunda Supabase'de "beklemede" olarak görünüyor ama admin dashboard'da onay için görünmüyor.

## Kök Neden
Admin login sistemi sadece şifre kontrolü yapıyor ve Supabase auth kullanmıyor. Bu yüzden:
1. Admin şifre ile giriş yapıyor ✅
2. Ama Supabase'de oturum açmıyor ❌
3. Dashboard veri çekmeye çalışıyor ama auth token yok ❌
4. Sonuç: Veriler görünmüyor ❌

## Test Sonuçları
- ✅ Kullanıcılar Supabase'de kayıtlı (3 bekleyen kullanıcı)
- ✅ `pending_users` view çalışıyor
- ✅ Trigger (`handle_new_user`) çalışıyor
- ❌ Admin dashboard Supabase auth kullanmıyor

## Çözüm Seçenekleri

### Seçenek 1: Admin Login'i Supabase Auth ile Entegre Et (ÖNERİLEN)
Admin kullanıcısı email/şifre ile Supabase'e giriş yapmalı.

**Avantajlar:**
- Güvenli
- RLS politikaları çalışır
- Audit trail (kim ne yaptı) takibi
- Session yönetimi

**Değişiklikler:**
1. AdminLogin.jsx - Email + şifre ile Supabase auth
2. AdminContext.jsx - Auth state yönetimi
3. RLS politikaları - Admin rolü kontrolü

### Seçenek 2: View'ları Herkese Açık Yap (GÜVENLİK RİSKİ)
pending_users, approved_users, rejected_users view'larını herkese açık yap.

**Dezavantajlar:**
- ❌ Güvenlik riski
- ❌ Herkes bekleyen kullanıcıları görebilir
- ❌ Önerilmez

## Önerilen Çözüm: Seçenek 1

### Adım 1: Admin Kullanıcısı Oluştur
```sql
-- Admin kullanıcısı zaten var: satoshinakamototokyo42@gmail.com
-- Şifre: Sevimbebe4242.
-- Rol: admin
-- Durum: approved
```

### Adım 2: AdminLogin.jsx Güncelle
Email + şifre ile Supabase auth kullan.

### Adım 3: AdminContext.jsx Güncelle
Supabase auth state'ini takip et.

### Adım 4: RLS Politikaları Ekle
Admin rolü kontrolü ile view'lara erişim.

## Uygulama
Şimdi bu değişiklikleri uygulayalım...
