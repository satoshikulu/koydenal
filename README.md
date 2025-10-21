# Kulu Tarım - Tarımsal İlan Platformu

Bu proje, Kulu ilçesindeki çiftçiler ve üreticiler için hazırlanmış bir tarımsal ilan platformudur. Üreticiler ürün ilanı verebilir, alıcılar ise bu ilanları görüntüleyebilir.

## Özellikler

- Kullanıcı kaydı ve girişi
- İlan oluşturma (admin onayı gerekir)
- Kategori bazlı ilan listeleme
- Detaylı ilan görüntüleme
- Admin paneli ile ilan onay/red işlemleri
- Responsive tasarım

## Teknolojiler

- React 18
- Vite
- Supabase (Authentication & Database)
- Bootstrap 5

## Kurulum

### Gereksinimler

- Node.js 16+
- npm veya yarn
- Supabase hesabı

### Adımlar

1. Repoyu klonlayın:
```bash
git clone <repo-url>
cd kulu-tarim
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. .env dosyasını oluşturun ve Supabase bilgilerinizi ekleyin:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Veritabanı şemasını kurun (aşağıya bakın)

5. Uygulamayı başlatın:
```bash
npm run dev
```

## Veritabanı Kurulumu

Proje için gerekli olan Supabase veritabanı şeması `kulu-tarim-complete-schema.sql` dosyasında bulunmaktadır.

1. Supabase Dashboard'a gidin
2. SQL Editor'ü açın
3. `kulu-tarim-complete-schema.sql` dosyasının içeriğini kopyalayın ve çalıştırın
4. Admin kullanıcısı oluşturun

Detaylı kurulum talimatları için `DATABASE_SETUP.md` dosyasına bakın.

## Kullanım

1. Uygulamayı başlatın: `npm run dev`
2. Tarayıcınızda `http://localhost:5173` adresine gidin
3. Kayıt olun veya giriş yapın
4. İlan oluşturmak için "İlan Ver" butonuna tıklayın
5. Admin olarak giriş yaptıysanız, "/admin" adresinden admin paneline erişebilirsiniz

## Admin Paneli

Admin paneli üzerinden:
- Beklemede olan ilanları görüntüleyebilir
- İlanları onaylayabilir veya reddedebilir
- Reddedilen ilanlar için neden belirtebilirsiniz

Admin kullanıcısı oluşturmak için `DATABASE_SETUP.md` dosyasındaki talimatları izleyin.

## Katkıda Bulunma

1. Forklayın
2. Yeni bir branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik ekle'`)
4. Branch'inizi push edin (`git push origin feature/yeni-ozellik`)
5. Pull request oluşturun

## Lisans

Bu proje MIT lisansı ile lisanslanmıştır.

---

*Sevim tarafından yapılmıştır*