# 👨‍💼 Admin Onay Paneli Kullanım Rehberi

## 🎯 Genel Bakış

`AdminApprovalDashboard` bileşeni, admin kullanıcıların bekleyen kullanıcıları ve ilanları onaylamasını sağlar.

## 📍 Erişim

**URL:** `http://localhost:5173/admin/onay`

**Gereksinim:** Admin yetkisi (`role = 'admin'`)

## ✨ Özellikler

### 1. Kullanıcı Onaylama
- ✅ Bekleyen kullanıcıları listeler
- ✅ Kullanıcı bilgilerini gösterir (ad, email, telefon, kayıt tarihi)
- ✅ Tek tıkla onaylama
- ✅ Otomatik liste güncelleme

### 2. İlan Onaylama
- ✅ Bekleyen ilanları listeler
- ✅ İlan detaylarını gösterir (başlık, kategori, fiyat, kullanıcı)
- ✅ Tek tıkla onaylama
- ✅ Otomatik liste güncelleme

### 3. Güvenlik
- ✅ Admin kontrolü (sadece admin erişebilir)
- ✅ Supabase RLS politikaları
- ✅ Hata yönetimi

### 4. Kullanıcı Deneyimi
- ✅ Modern gradient tasarım
- ✅ Responsive (mobil uyumlu)
- ✅ Loading states
- ✅ Boş durum mesajları
- ✅ Bildirim badge'leri
- ✅ Smooth animasyonlar

## 🎨 Tasarım Özellikleri

### Renkler
- **Primary:** Mor-Pembe gradient (#667eea → #764ba2)
- **Success:** Yeşil gradient (#11998e → #38ef7d)
- **Background:** Beyaz
- **Text:** Koyu gri (#2c3e50)

### Animasyonlar
- Tab geçişleri
- Hover efektleri
- Loading spinner
- Button ripple

## 📊 Veri Akışı

```
1. Sayfa Yükleme
   ↓
2. Admin Kontrolü (auth.uid() → user_profiles.role)
   ↓
3. Veri Çekme (pending_users / pending_listings views)
   ↓
4. Tablo Gösterimi
   ↓
5. Onay Butonu Tıklama
   ↓
6. Supabase Update (status = 'approved', approved_at = NOW())
   ↓
7. State Güncelleme (React)
   ↓
8. Tablo Yenileme (onaylanan kayıt kaldırılır)
```

## 🔧 Teknik Detaylar

### Kullanılan Supabase Views

**pending_users:**
```sql
SELECT * FROM user_profiles WHERE status = 'pending'
```

**pending_listings:**
```sql
SELECT 
  l.*,
  c.name as category_name,
  c.icon as category_icon,
  up.full_name as user_name,
  up.email as user_email
FROM listings l
LEFT JOIN categories c ON l.category_id = c.id
LEFT JOIN user_profiles up ON l.user_id = up.id
WHERE l.status = 'pending'
```

### State Yönetimi

```javascript
const [pendingUsers, setPendingUsers] = useState([]);
const [pendingListings, setPendingListings] = useState([]);
const [isAdmin, setIsAdmin] = useState(false);
const [loading, setLoading] = useState(true);
const [activeTab, setActiveTab] = useState('users');
const [processingId, setProcessingId] = useState(null);
```

### Onay Fonksiyonları

**Kullanıcı Onaylama:**
```javascript
const approveUser = async (userId) => {
  const { error } = await supabase
    .from('user_profiles')
    .update({
      status: 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString()
    })
    .eq('id', userId);
    
  // State güncelleme
  setPendingUsers(prev => prev.filter(u => u.id !== userId));
};
```

**İlan Onaylama:**
```javascript
const approveListing = async (listingId) => {
  const { error } = await supabase
    .from('listings')
    .update({
      status: 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString()
    })
    .eq('id', listingId);
    
  // State güncelleme
  setPendingListings(prev => prev.filter(l => l.id !== listingId));
};
```

## 🚀 Kullanım

### 1. Admin Olarak Giriş Yapın

```
Email: satoshinakamototokyo42@gmail.com
Şifre: Sevimbebe4242.
```

### 2. Onay Paneline Gidin

```
http://localhost:5173/admin/onay
```

### 3. Kullanıcıları Onaylayın

1. "Bekleyen Kullanıcılar" sekmesine tıklayın
2. Listeyi inceleyin
3. "✅ Onayla" butonuna tıklayın
4. Onay mesajını bekleyin
5. Kullanıcı listeden otomatik kaldırılır

### 4. İlanları Onaylayın

1. "Bekleyen İlanlar" sekmesine tıklayın
2. İlan detaylarını inceleyin
3. "✅ Onayla" butonuna tıklayın
4. Onay mesajını bekleyin
5. İlan listeden otomatik kaldırılır

## 📱 Responsive Tasarım

### Desktop (1200px+)
- Tam genişlik tablo
- 2 sütunlu tab layout
- Tüm bilgiler görünür

### Tablet (768px - 1199px)
- Responsive tablo
- Yatay scroll
- Kompakt görünüm

### Mobile (< 768px)
- Stack layout
- Küçük font boyutları
- Touch-friendly butonlar
- Yatay scroll tablo

## 🐛 Hata Yönetimi

### Admin Değilse
```
🔒 Erişim Engellendi
Bu sayfaya erişim için admin yetkisi gereklidir.
```

### Veri Yüklenirken
```
⏳ Yükleniyor...
(Spinner animasyonu)
```

### Boş Liste
```
✅ Bekleyen kullanıcı/ilan yok
```

### Onay Hatası
```
❌ Kullanıcı/İlan onaylanırken hata oluştu: [hata mesajı]
```

### Başarılı Onay
```
✅ Kullanıcı/İlan başarıyla onaylandı!
```

## 🔐 Güvenlik

### RLS Politikaları

**user_profiles:**
```sql
-- Sadece adminler güncelleyebilir
CREATE POLICY "Admins can update any profile"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

**listings:**
```sql
-- Sadece adminler güncelleyebilir
CREATE POLICY "Admins can update any listing"
  ON listings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );
```

### Admin Kontrolü

```javascript
const checkAdminStatus = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  setIsAdmin(profile?.role === 'admin');
};
```

## 📊 Console Logları

Bileşen şu logları üretir:

```javascript
// Başarılı veri çekme
console.log('Fetched pending users:', 5);
console.log('Fetched pending listings:', 3);

// Başarılı onay
console.log('User approved successfully:', 'uuid-here');
console.log('Listing approved successfully:', 'uuid-here');

// Hatalar
console.error('Error fetching pending data:', error);
console.error('Error approving user:', error);
console.error('Error approving listing:', error);
```

## 🎯 Gelecek İyileştirmeler

- [ ] Toplu onaylama
- [ ] Reddetme özelliği
- [ ] Detay modal
- [ ] Filtreleme ve arama
- [ ] Sayfalama (pagination)
- [ ] Export to CSV
- [ ] Email bildirimleri
- [ ] Onay geçmişi

## 📝 Notlar

- Onaylanan kayıtlar otomatik olarak listeden kaldırılır
- Sayfa yenilemeye gerek yok (React state)
- Tüm işlemler Supabase RLS ile korunur
- Admin olmayan kullanıcılar erişemez
- Responsive tasarım tüm cihazlarda çalışır

---

**Hazırlayan:** Kiro AI Assistant
**Tarih:** 21 Ekim 2025
**Bileşen:** AdminApprovalDashboard.jsx
