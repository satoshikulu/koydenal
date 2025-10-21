# Kullanıcı Onay Sistemi Özeti

Sevim tarafından yapılmıştır

## Özellik Açıklaması

Bu güncelleme ile admin paneline kullanıcı kayıt onay sistemi eklenmiştir. Artık yeni kullanıcı kayıtları da admin onayı gerektirir ve admin panelinde "Kullanıcı Onayları" sekmesi altında listelenir.

## Yapılan Değişiklikler

### 1. Veritabanı Güncellemeleri

`update-user-profiles-for-approval.sql` dosyası ile:

1. **user_profiles tablosuna yeni alanlar eklendi:**
   - `status` (TEXT, DEFAULT 'pending') - Kullanıcı onay durumu
   - `approved_by` (UUID) - Onaylayan admin
   - `approved_at` (TIMESTAMP) - Onay tarihi
   - `rejection_reason` (TEXT) - Reddetme nedeni

2. **Yeni veritabanı görünümleri oluşturuldu:**
   - `pending_users` - Onay bekleyen kullanıcılar
   - `approved_users` - Onaylanmış kullanıcılar
   - `rejected_users` - Reddedilmiş kullanıcılar

3. **Yeni RLS politikaları eklendi:**
   - Onaylanmış profilleri herkes görüntüleyebilir
   - Kullanıcılar kendi profillerini görebilir
   - Adminler tüm profilleri görebilir

### 2. Yeni Admin Paneli

`NewAdminDashboard.jsx` bileşeni ile:

1. **İki sekme desteği:**
   - İlan Yönetimi
   - Kullanıcı Onayları

2. **Kullanıcı onay işlemleri:**
   - Onay bekleyen kullanıcıların listelenmesi
   - Kullanıcı detaylarının görüntülenmesi
   - Kullanıcıların onaylanması veya reddedilmesi

### 3. Kullanıcı Kayıt Süreci

1. Yeni kullanıcılar kayıt olduklarında profilleri otomatik olarak "pending" (beklemede) durumuna geçer
2. Kullanıcılar sadece profilleri "approved" (onaylandı) durumunda olan admin paneline erişebilir

## Uygulama Talimatları

### 1. Veritabanı Güncellemesini Uygulama

```sql
-- Supabase SQL Editor'da update-user-profiles-for-approval.sql dosyasının içeriğini çalıştırın
```

### 2. Mevcut Kullanıcıları Onaylama

İlk kurulumda mevcut tüm kullanıcıları onaylamanız gerekebilir:

```sql
UPDATE user_profiles 
SET status = 'approved' 
WHERE status IS NULL OR status = 'pending';
```

### 3. Admin Panelini Test Etme

1. Uygulamayı başlatın: `npm run dev`
2. Yeni bir kullanıcı kaydı oluşturun
3. Admin paneline gidin: `http://localhost:5173/admin`
4. "Kullanıcı Onayları" sekmesine geçin
5. Yeni kayıtlı kullanıcıyı listede göreceksiniz
6. Kullanıcıyı onaylayın veya reddedin

## Teknik Detaylar

### Yeni Veritabanı Şeması

```sql
-- user_profiles tablosuna eklenen alanlar
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
```

### Yeni Görünümler

```sql
-- Onay bekleyen kullanıcılar
CREATE OR REPLACE VIEW pending_users AS
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.phone,
  up.role,
  up.created_at,
  up.updated_at
FROM user_profiles up
WHERE up.status = 'pending'
ORDER BY up.created_at DESC;
```

## Test Senaryoları

1. ✅ Yeni kullanıcı kaydı oluşturun ve admin panelinde görünmesini kontrol edin
2. ✅ Kullanıcıyı onaylayın ve profiline erişim sağlayın
3. ✅ Kullanıcıyı reddedin ve uygun mesajı gösterin
4. ✅ Arama ve filtreleme işlevlerini test edin
5. ✅ Kullanıcı detaylarını görüntüleyin

## Bilinen Sınırlamalar

1. Mevcut kullanıcılar manuel olarak onaylanmalıdır
2. Kullanıcı onay durumu değiştiğinde otomatik bildirim sistemi yoktur

---

Made by Sevim