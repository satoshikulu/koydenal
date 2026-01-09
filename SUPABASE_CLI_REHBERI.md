# 🔗 Supabase CLI Bağlantı Rehberi

## ✅ Bağlantı Durumu

Supabase CLI başarıyla bağlandı:
- **Project Ref:** `pwnrlllwwzpjcsevwpvr`
- **URL:** `https://pwnrlllwwzpjcsevwpvr.supabase.co`

## 📋 Kullanılabilir Komutlar

### 1. Şema Çekme (Pull)
```bash
# Remote veritabanından şemayı çek
supabase db pull

# Belirli bir şemayı çek
supabase db pull --schema public
```

### 2. Şema Gönderme (Push)
```bash
# Local migration'ları remote'a gönder
supabase db push
```

### 3. Şema Farklarını Görme (Diff)
```bash
# Local ve remote arasındaki farkları gör
supabase db diff
```

### 4. Veritabanı Dump
```bash
# Remote veritabanından dump al
supabase db dump -f backup.sql

# Sadece şema dump'ı
supabase db dump --schema-only -f schema.sql

# Sadece veri dump'ı
supabase db dump --data-only -f data.sql
```

### 5. SQL Sorguları Çalıştırma

Supabase CLI ile direkt SQL sorguları çalıştırmak için:

**Yöntem 1: Supabase Dashboard SQL Editor (Önerilen)**
1. https://supabase.com/dashboard adresine gidin
2. Projenizi seçin
3. SQL Editor'ı açın
4. SQL dosyalarınızı yapıştırın ve çalıştırın

**Yöntem 2: psql ile Bağlanma**
```bash
# Connection string'i al
supabase status

# psql ile bağlan (Windows'ta psql yüklü olmalı)
psql "postgresql://postgres:[PASSWORD]@db.pwnrlllwwzpjcsevwpvr.supabase.co:5432/postgres"
```

**Yöntem 3: Node.js Script (Mevcut)**
```bash
# check_supabase_database.js kullan
npm run check-db
```

## 🔍 Veritabanı Kontrolü

### Mevcut Kontrol Scripti
```bash
npm run check-db
```

Bu script şunları kontrol eder:
- ✅ Kategoriler
- ✅ Kullanıcı profilleri
- ✅ İlanlar
- ✅ Admin işlemleri
- ✅ Tablo yapısı önerileri

### SQL Dosyalarını Çalıştırma

1. **Kategori Güncellemesi:**
   - Supabase Dashboard > SQL Editor
   - `update_categories_for_pwa.sql` dosyasını çalıştır

2. **Veritabanı İyileştirmeleri:**
   - Supabase Dashboard > SQL Editor
   - `fix_and_optimize_database.sql` dosyasını çalıştır

3. **Detaylı Kontrol:**
   - Supabase Dashboard > SQL Editor
   - `check_database_structure.sql` dosyasını çalıştır

## 📊 Mevcut Durum (Son Kontrol)

- ✅ **Kategoriler:** 6 kategori (PWA için güncellenmeli)
- ✅ **Kullanıcılar:** 1 admin kullanıcı
- ✅ **İlanlar:** 1 ilan (approved)
- ✅ **is_opportunity:** Mevcut
- ⚠️ **Kategori Güncellemesi:** Gerekli

## 🚀 Hızlı Başlangıç

### 1. Kategori Güncellemesi
```sql
-- Supabase Dashboard > SQL Editor
-- update_categories_for_pwa.sql dosyasını çalıştır
```

### 2. Veritabanı İyileştirmeleri
```sql
-- Supabase Dashboard > SQL Editor
-- fix_and_optimize_database.sql dosyasını çalıştır
```

### 3. Kontrol
```bash
npm run check-db
```

## 📚 Yararlı Linkler

- [Supabase CLI Docs](https://supabase.com/docs/reference/cli)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

**Not:** Supabase CLI ile direkt SQL sorguları çalıştırmak için `psql` veya Supabase Dashboard SQL Editor kullanın.
