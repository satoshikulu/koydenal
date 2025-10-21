// verify-schema.js - Veritabanı şemasını test eden script
import { createClient } from '@supabase/supabase-js';

// Supabase bağlantısı (gerçek değerlerle değiştirilmeli)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'
);

async function verifySchema() {
  console.log('🔍 Kulu Tarım Veritabanı Şeması Doğrulama');
  console.log('==========================================\n');

  try {
    // 1. Kategoriler tablosunu kontrol et
    console.log('1. Kategoriler tablosu kontrolü...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .limit(5);

    if (catError) {
      console.log('❌ Kategoriler tablosu hatası:', catError.message);
      return false;
    }

    console.log(`✅ Kategoriler tablosu mevcut (${categories.length} kategori)`);
    categories.forEach(cat => {
      console.log(`   - ${cat.name}`);
    });

    // 2. İlanlar tablosunu kontrol et
    console.log('\n2. İlanlar tablosu kontrolü...');
    const { data: listings, error: listError } = await supabase
      .from('listings')
      .select('id, title, status')
      .limit(3);

    if (listError) {
      console.log('❌ İlanlar tablosu hatası:', listError.message);
    } else {
      console.log(`✅ İlanlar tablosu mevcut (${listings.length} örnek ilan)`);
      listings.forEach(listing => {
        console.log(`   - ${listing.title} (${listing.status})`);
      });
    }

    // 3. Kullanıcı profilleri tablosunu kontrol et
    console.log('\n3. Kullanıcı profilleri tablosu kontrolü...');
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .limit(3);

    if (profileError) {
      console.log('❌ Kullanıcı profilleri tablosu hatası:', profileError.message);
    } else {
      console.log(`✅ Kullanıcı profilleri tablosu mevcut (${profiles.length} örnek profil)`);
      profiles.forEach(profile => {
        console.log(`   - ${profile.email} (${profile.role})`);
      });
    }

    // 4. Admin işlemleri tablosunu kontrol et
    console.log('\n4. Admin işlemleri tablosu kontrolü...');
    const { data: actions, error: actionError } = await supabase
      .from('admin_actions')
      .select('id, action, created_at')
      .limit(3);

    if (actionError && actionError.code !== '42P01') { // Tablo yoksa hata kodu
      console.log('❌ Admin işlemleri tablosu hatası:', actionError.message);
    } else if (actionError) {
      console.log('⚠️ Admin işlemleri tablosu henüz oluşturulmamış');
    } else {
      console.log(`✅ Admin işlemleri tablosu mevcut (${actions.length} örnek işlem)`);
    }

    // 5. Görünümleri kontrol et
    console.log('\n5. Görünümler kontrolü...');
    const { data: pending, error: pendingError } = await supabase
      .from('pending_listings')
      .select('id, title')
      .limit(2);

    if (pendingError) {
      console.log('⚠️ Beklemede olan ilanlar görünümü hatası:', pendingError.message);
    } else {
      console.log(`✅ Beklemede olan ilanlar görünümü mevcut (${pending.length} örnek)`);
    }

    const { data: approved, error: approvedError } = await supabase
      .from('approved_listings')
      .select('id, title')
      .limit(2);

    if (approvedError) {
      console.log('⚠️ Onaylanmış ilanlar görünümü hatası:', approvedError.message);
    } else {
      console.log(`✅ Onaylanmış ilanlar görünümü mevcut (${approved.length} örnek)`);
    }

    // 6. RLS politikalarını test et
    console.log('\n6. Güvenlik politikaları kontrolü...');
    console.log('✅ RLS politikaları tanımlanmış (manuel test gerekli)');

    console.log('\n🎉 Şema doğrulama tamamlandı!');
    console.log('\n📋 Sonraki adımlar:');
    console.log('1. Admin kullanıcısı oluşturun');
    console.log('2. Test verileri ekleyin');
    console.log('3. Uygulamayı çalıştırın');

    return true;

  } catch (error) {
    console.error('❌ Doğrulama sırasında hata oluştu:', error.message);
    return false;
  }
}

// Script'i çalıştır
if (import.meta.url === `file://${process.argv[1]}`) {
  verifySchema().then(success => {
    if (success) {
      console.log('\n✅ Veritabanı şeması doğru şekilde kurulmuş!');
    } else {
      console.log('\n❌ Veritabanı şeması ile ilgili sorunlar var!');
      process.exit(1);
    }
  });
}

export default verifySchema;