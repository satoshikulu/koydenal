// schema-test.cjs - Şema yükleme testi (CommonJS)
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://pwnrlllwwzpjcsevwpvr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bnJsbGx3d3pwamNzZXZ3cHZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjE1OTMsImV4cCI6MjA3NTU5NzU5M30.Bmn1m_uXmrXn8fA3-tTw2ivvF8-_Z9WryX40NCfSY4M';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSchemaLoad() {
  console.log('🔄 Şema yükleme testini başlatıyorum...\n');

  try {
    // 1. Mevcut tabloları kontrol et
    console.log('📋 Mevcut tabloları kontrol ediyorum...');

    // Manuel tablo kontrolü
    const { data: categoriesExist, error: catError } = await supabase
      .from('categories')
      .select('count')
      .limit(1);

    if (catError && catError.code === 'PGRST116') {
      console.log('❌ categories tablosu bulunamadı');
      console.log('📥 Şema yüklemesi gerekli...');
      return await loadSchema();
    } else if (catError) {
      console.log('❌ Tablo kontrolü sırasında hata:', catError.message);
      return false;
    } else {
      console.log('✅ categories tablosu mevcut');
      console.log('🔍 Mevcut şemayı test ediyorum...');
      return await testExistingSchema();
    }

  } catch (err) {
    console.error('❌ Test sırasında hata:', err.message);
    return false;
  }
}

async function testExistingSchema() {
  console.log('\n🔍 Mevcut şemayı test ediyorum...\n');

  try {
    // 1. Kategorileri test et
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*');

    if (catError) {
      console.error('❌ Kategoriler alınamadı:', catError.message);
      return false;
    }

    console.log(`✅ ${categories.length} kategori bulundu:`);
    categories.forEach(cat => {
      console.log(`   ${cat.icon} ${cat.name}`);
    });

    // 2. İlanları test et
    const { data: listings, error: listError } = await supabase
      .from('listings')
      .select('*')
      .limit(3);

    if (listError) {
      console.log('⚠️  İlanlar alınamadı (henüz ilan olmayabilir):', listError.message);
    } else if (listings && listings.length > 0) {
      console.log(`✅ ${listings.length} ilan örneği:`);
      listings.forEach(list => {
        console.log(`   ${list.title} - ${list.status}`);
      });
    } else {
      console.log('ℹ️  Henüz ilan bulunamadı (normal)');
    }

    // 3. Kullanıcı profillerini test et
    const { data: profiles, error: profError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(3);

    if (profError) {
      console.log('⚠️  Kullanıcı profilleri alınamadı:', profError.message);
    } else if (profiles && profiles.length > 0) {
      console.log(`✅ ${profiles.length} kullanıcı profili örneği`);
    } else {
      console.log('ℹ️  Henüz kullanıcı profili bulunamadı (normal)');
    }

    console.log('\n🎉 Mevcut şema testi tamamlandı!');
    return true;

  } catch (err) {
    console.error('❌ Şema testi hatası:', err.message);
    return false;
  }
}

async function loadSchema() {
  console.log('\n📥 Şema yüklemesi için talimatlar:\n');

  console.log('📋 Manuel şema yükleme adımları:');
  console.log('1. 🌐 Supabase Dashboard\'a gidin: https://app.supabase.com');
  console.log('2. 📝 SQL Editor\'ü açın');
  console.log('3. 📄 koydendal-anon-listing-schema.sql dosyasını açın');
  console.log('4. 📋 Tüm içeriği kopyalayın');
  console.log('5. 📝 SQL Editor\'e yapıştırın');
  console.log('6. ▶️  RUN butonuna tıklayın');
  console.log('');
  console.log('⚠️  Büyük SQL dosyası otomatik yüklenemez - manuel yükleme gerekli!');

  return true;
}

// Ana test fonksiyonu
async function runTests() {
  console.log('🌾 KÖYDENAL SUPABASE TEST MERKEZİ');
  console.log('=====================================\n');

  const success = await testSchemaLoad();

  if (success) {
    console.log('\n✅ Tüm testler başarıyla tamamlandı!');
    console.log('\n📋 Sonraki adımlar:');
    console.log('1. Admin kullanıcısı oluşturun');
    console.log('2. Storage bucket ayarlayın');
    console.log('3. React uygulamasını test edin');
  } else {
    console.log('\n❌ Bazı testler başarısız oldu!');
    console.log('\n🔧 Sorun giderme:');
    console.log('1. İnternet bağlantınızı kontrol edin');
    console.log('2. Supabase projesinin aktif olduğunu kontrol edin');
    console.log('3. ANON-LISTING-REHBER.md dosyasını okuyun');
  }
}

// Testi çalıştır
runTests();
