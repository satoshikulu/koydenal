// comprehensive-test.cjs - Kapsamlı Supabase test
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pwnrlllwwzpjcsevwpvr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bnJsbGx3d3pwamNzZXZ3cHZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjE1OTMsImV4cCI6MjA3NTU5NzU5M30.Bmn1m_uXmrXn8fA3-tTw2ivvF8-_Z9WryX40NCfSY4M';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function comprehensiveTest() {
  console.log('🌾 KÖYDENAL - KAPSAMLI SUPABASE TESTİ');
  console.log('=====================================\n');

  const results = {
    connection: false,
    categories: false,
    listings: false,
    userProfiles: false,
    adminActions: false,
    rlsPolicies: false,
    functions: false,
    views: false
  };

  try {
    // 1. Bağlantı testi
    console.log('🔌 1. Bağlantı testini yapıyorum...');
    const { data: connectionTest, error: connError } = await supabase
      .from('categories')
      .select('count')
      .limit(1);

    if (connError && connError.code === 'PGRST116') {
      console.log('❌ Bağlantı başarısız - Tablo bulunamadı');
      console.log('📥 Şema yüklenmemiş görünüyor');
      return showNextSteps();
    } else if (connError) {
      console.log('❌ Bağlantı hatası:', connError.message);
      return false;
    } else {
      console.log('✅ Bağlantı başarılı!');
      results.connection = true;
    }

    // 2. Kategoriler testi
    console.log('\n📂 2. Kategorileri test ediyorum...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*');

    if (catError) {
      console.log('❌ Kategoriler alınamadı:', catError.message);
    } else {
      console.log(`✅ ${categories.length} kategori bulundu:`);
      categories.forEach(cat => {
        console.log(`   ${cat.icon} ${cat.name} (${cat.id})`);
      });
      results.categories = true;
    }

    // 3. İlanlar testi
    console.log('\n📋 3. İlanları test ediyorum...');
    const { data: listings, error: listError } = await supabase
      .from('listings')
      .select('*')
      .limit(5);

    if (listError) {
      console.log('❌ İlanlar alınamadı:', listError.message);
    } else if (listings && listings.length > 0) {
      console.log(`✅ ${listings.length} ilan bulundu`);
      results.listings = true;
    } else {
      console.log('ℹ️  Henüz ilan bulunamadı (normal)');
    }

    // 4. Kullanıcı profilleri testi
    console.log('\n👤 4. Kullanıcı profillerini test ediyorum...');
    const { data: profiles, error: profError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(3);

    if (profError) {
      console.log('❌ Kullanıcı profilleri alınamadı:', profError.message);
    } else if (profiles && profiles.length > 0) {
      console.log(`✅ ${profiles.length} kullanıcı profili bulundu`);
      results.userProfiles = true;
    } else {
      console.log('ℹ️  Henüz kullanıcı profili bulunamadı (normal)');
    }

    // 5. Admin actions testi
    console.log('\n⚙️ 5. Admin işlemlerini test ediyorum...');
    const { data: actions, error: actError } = await supabase
      .from('admin_actions')
      .select('*')
      .limit(3);

    if (actError) {
      console.log('❌ Admin işlemleri alınamadı:', actError.message);
    } else if (actions && actions.length > 0) {
      console.log(`✅ ${actions.length} admin işlemi bulundu`);
      results.adminActions = true;
    } else {
      console.log('ℹ️  Henüz admin işlemi bulunamadı (normal)');
    }

    // 6. RLS politikaları testi
    console.log('\n🔒 6. RLS politikalarını test ediyorum...');
    try {
      const { data: policies, error: polError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('schemaname', 'public')
        .limit(5);

      if (polError) {
        console.log('⚠️  RLS politikaları sorgusu başarısız:', polError.message);
      } else if (policies && policies.length > 0) {
        console.log(`✅ ${policies.length} RLS politikası aktif`);
        results.rlsPolicies = true;
      } else {
        console.log('ℹ️  RLS politikası bulunamadı');
      }
    } catch (e) {
      console.log('⚠️  RLS politikaları sorgusu desteklenmiyor');
    }

    // 7. View'ları test et
    console.log('\n📊 7. View\'ları test ediyorum...');
    try {
      const { data: viewData, error: viewError } = await supabase
        .from('active_listings_summary')
        .select('*')
        .limit(3);

      if (viewError) {
        console.log('❌ View sorgusu başarısız:', viewError.message);
      } else if (viewData && viewData.length >= 0) {
        console.log('✅ View\'lar çalışır durumda');
        results.views = true;
      }
    } catch (e) {
      console.log('⚠️  View sorgusu desteklenmiyor veya view yüklenmemiş');
    }

    // 8. Fonksiyonları test et
    console.log('\n⚡ 8. Fonksiyonları test ediyorum...');
    try {
      const { data: funcData, error: funcError } = await supabase.rpc('increment_listing_view', {
        listing_id: '00000000-0000-0000-0000-000000000000'
      });

      if (funcError) {
        console.log('❌ Fonksiyon çağrısı başarısız:', funcError.message);
      } else {
        console.log('✅ Fonksiyonlar çalışır durumda');
        results.functions = true;
      }
    } catch (e) {
      console.log('⚠️  Fonksiyon çağrısı desteklenmiyor veya fonksiyon yüklenmemiş');
    }

    // Sonuçları göster
    console.log('\n📈 TEST SONUÇLARI ÖZETİ');
    console.log('========================');

    Object.entries(results).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      const name = key.replace(/([A-Z])/g, ' $1').toLowerCase();
      console.log(`${status} ${name.charAt(0).toUpperCase() + name.slice(1)}`);
    });

    const successCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;

    console.log(`\n🎯 Başarı Oranı: ${successCount}/${totalCount}`);

    if (successCount >= 3) {
      console.log('\n🎉 Temel şema başarıyla yüklenmiş!');
      console.log('\n📋 Sonraki adımlar:');
      console.log('1. Admin kullanıcısı oluşturun');
      console.log('2. Storage bucket ayarlayın');
      console.log('3. React uygulamasını test edin');
    } else {
      console.log('\n⚠️  Şema yüklenmemiş veya eksik!');
      return showNextSteps();
    }

    return successCount >= 3;

  } catch (err) {
    console.error('❌ Genel test hatası:', err.message);
    return false;
  }
}

function showNextSteps() {
  console.log('\n📥 ŞEMA YÜKLEME GEREKLİ!');
  console.log('======================');
  console.log('\n📋 Yapmanız gerekenler:');
  console.log('');
  console.log('1️⃣  Supabase Dashboard\'a gidin');
  console.log('   https://app.supabase.com');
  console.log('');
  console.log('2️⃣  SQL Editor\'ü açın');
  console.log('');
  console.log('3️⃣  koydendal-anon-listing-schema.sql');
  console.log('   dosyasının içeriğini kopyalayın');
  console.log('');
  console.log('4️⃣  SQL Editor\'e yapıştırın');
  console.log('');
  console.log('5️⃣  RUN butonuna tıklayın');
  console.log('');
  console.log('6️⃣  Bu testi tekrar çalıştırın');
  console.log('');
  console.log('📁 Dosya konumu:');
  console.log('   c:\\Users\\Lenovo\\Desktop\\Kulu Tarım\\koydendal-anon-listing-schema.sql');

  return false;
}

// Testi çalıştır
comprehensiveTest();
