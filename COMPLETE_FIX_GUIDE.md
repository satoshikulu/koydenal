# Kulu Tarım - Tam Onarım Kılavuzu

Sevim tarafından yapılmıştır

Bu kılavuz, Kulu Tarım projesindeki tüm sorunların çözümünü açıklar.

## Sorun Özeti

1. **Admin panelinde kullanıcı onayları görünmüyor**: Üye olan kullanıcıların onayları admin paneline düşmüyor
2. **Veritabanı şeması eksik**: Kullanıcı onay sistemi için gerekli veritabanı alanları ve görünümler eksik
3. **Admin paneli sınırlı**: Eski admin paneli sadece ilan onaylarını gösteriyor, kullanıcı onaylarını göstermiyor

## Çözüm Bileşenleri

### 1. Kod Düzeltmeleri

Aşağıdaki dosyalar güncellendi:
- `src/components/NewAdminPanel.jsx`: Artık `NewAdminDashboard` bileşenini kullanıyor
- `src/components/NewAdminDashboard.jsx`: Zaten kullanıcı onay işlevini içeriyordu

### 2. Veritabanı Düzeltmeleri

Aşağıdaki SQL dosyaları oluşturuldu:
- `update-user-profiles-for-approval.sql`: Kullanıcı onay sistemi için gerekli veritabanı güncellemeleri
- `apply-database-fixes.sql`: Genel veritabanı düzeltmeleri (varsa)

## Uygulama Adımları

### Adım 1: Kod Güncellemelerini Doğrulama

1. `src/components/NewAdminPanel.jsx` dosyasının aşağıdaki satırları içerdiğinden emin olun:

```javascript
import NewAdminDashboard from './NewAdminDashboard';
// ...
return isAdmin ? <NewAdminDashboard /> : <AdminLogin />;
```

### Adım 2: Veritabanı Düzeltmelerini Uygulama

#### 2.1. Kullanıcı Onay Sistemi Güncellemeleri

1. Supabase Dashboard'a giriş yapın
2. Sol menüden "SQL Editor" seçeneğine tıklayın
3. `update-user-profiles-for-approval.sql` dosyasının içeriğini kopyalayın
4. SQL Editor'e yapıştırın
5. "Run" butonuna tıklayın

Bu işlem aşağıdaki değişiklikleri yapar:
- `user_profiles` tablosuna `status`, `approved_by`, `approved_at`, `rejection_reason` alanlarını ekler
- `pending_users`, `approved_users`, `rejected_users` görünümlerini oluşturur
- Gerekli güvenlik politikalarını günceller
- Yeni kullanıcıların otomatik olarak "pending" durumuna gelmesini sağlar

#### 2.2. Genel Veritabanı Düzeltmeleri (Gerekirse)

1. Supabase Dashboard'a giriş yapın
2. Sol menüden "SQL Editor" seçeneğine tıklayın
3. `apply-database-fixes.sql` dosyasının içeriğini kopyalayın (varsa)
4. SQL Editor'e yapıştırın
5. "Run" butonuna tıklayın

### Adım 3: Mevcut Kullanıcıları Onaylama

Uygulama zaten çalışan bir sistemse, mevcut kullanıcıları onaylamanız gerekebilir:

1. Supabase Dashboard'a giriş yapın
2. Sol menüden "SQL Editor" seçeneğine tıklayın
3. Aşağıdaki SQL sorgusunu çalıştırın:

```sql
-- Mevcut tüm kullanıcıları onayla
UPDATE user_profiles 
SET status = 'approved' 
WHERE status IS NULL;
```

### Adım 4: Sistemi Test Etme

1. Terminalde aşağıdaki komutu çalıştırın:
```bash
npm run dev
```

2. Tarayıcıda `http://localhost:5173/admin` adresine gidin
3. Admin şifresini girin: `Sevimbebe4242.`
4. "Kullanıcı Onayları" sekmesine tıklayın
5. Onay bekleyen kullanıcılar artık görünmelidir

## Kullanıcı Onay İşlemi

1. Admin panelinde "Kullanıcı Onayları" sekmesine tıklayın
2. Onay bekleyen kullanıcıları görün
3. "Detay" butonu ile kullanıcı detaylarını inceleyin
4. "Onayla" butonu ile kullanıcıyı onaylayın
5. "Reddet" butonu ile kullanıcıyı reddedin (neden sorulacaktır)

## Sorun Giderme

### Kullanıcılar hala görünmüyor

1. Supabase SQL Editor'de aşağıdaki sorguyu çalıştırın:
```sql
SELECT id, email, full_name, status FROM user_profiles WHERE status = 'pending' OR status IS NULL;
```

2. Eğer sonuç dönüyorsa ama admin panelinde görünmüyorsa, veritabanı görünümleri düzgün oluşturulmamış olabilir

3. `update-user-profiles-for-approval.sql` dosyasını tekrar çalıştırın

### Yeni kullanıcılar "pending" durumunda değil

1. Supabase SQL Editor'de aşağıdaki sorguyu çalıştırın:
```sql
SELECT * FROM user_profiles WHERE status IS NULL;
```

2. Eğer sonuç dönüyorsa, tüm kullanıcıları "pending" durumuna getirmek için:
```sql
UPDATE user_profiles SET status = 'pending' WHERE status IS NULL;
```

### Admin paneli hala eski görünümde

1. `src/components/NewAdminPanel.jsx` dosyasının doğru güncellendiğinden emin olun
2. Uygulamayı yeniden başlatın: `npm run dev`
3. Tarayıcı önbelleğini temizleyin

## Teknik Detaylar

### Yeni Veritabanı Yapısı

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

1. Mevcut kullanıcılar manuel olarak onaylanmalıdır (ilk kurulumda)
2. Kullanıcı onay durumu değiştiğinde otomatik bildirim sistemi yoktur

---

Made by Sevim