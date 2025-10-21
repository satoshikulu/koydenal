// final-verification.cjs - Son doğrulama testi
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pwnrlllwwzpjcsevwpvr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bnJsbGx3d3pwamNzZXZ3cHZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjE1OTMsImV4cCI6MjA3NTU5NzU5M30.Bmn1m_uXmrXn8fA3-tTw2ivvF8-_Z9WryX40NCfSY4M';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function finalVerification() {
  console.log('🌾 KÖYDENAL - SON DOĞRULAMA TESTİ');
  console.log('==================================\n');

  try {
    // Tüm tabloları kontrol et
    const tables = [
      { name: 'categories', expectedMin: 6 },
      { name: 'listings', expectedMin: 0 },
      { name: 'user_profiles', expectedMin: 0 },
      { name: 'admin_actions', expectedMin: 0 }
    ];

    let allSuccess = true;

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`❌ ${table.name}: ${error.message}`);
          allSuccess = false;
        } else {
          const status = count >= table.expectedMin ? '✅' : '⚠️';
          console.log(`${status} ${table.name}: ${count} kayıt`);

          if (count < table.expectedMin) {
            allSuccess = false;
          }
        }
      } catch (err) {
        console.log(`❌ ${table.name}: ${err.message}`);
        allSuccess = false;
      }
    }

    // Kategorileri detaylı kontrol et
    console.log('\n📂 Kategoriler detayı:');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('display_order');

    if (catError) {
      console.log(`❌ Kategoriler alınamadı: ${catError.message}`);
      allSuccess = false;
    } else {
      categories.forEach(cat => {
        console.log(`   ${cat.icon} ${cat.name} (${cat.id})`);
      });
    }

    // View'ları kontrol et
    console.log('\n📊 View\'ları kontrol ediyorum...');
    try {
      const { data: viewData, error: viewError } = await supabase
        .from('active_listings_summary')
        .select('*')
        .limit(1);

      if (viewError) {
        console.log(`⚠️  View henüz kullanılamıyor: ${viewError.message}`);
      } else {
        console.log('✅ View\'lar çalışır durumda');
      }
    } catch (e) {
      console.log('⚠️  View kontrolü yapılamadı');
    }

    // RLS politikalarını kontrol et
    console.log('\n🔒 RLS politikalarını kontrol ediyorum...');
    try {
      const { data: policies, error: polError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('schemaname', 'public')
        .limit(5);

      if (polError) {
        console.log(`⚠️  RLS politikaları sorgusu başarısız: ${polError.message}`);
      } else if (policies && policies.length > 0) {
        console.log(`✅ ${policies.length} RLS politikası aktif`);
      } else {
        console.log('⚠️  RLS politikası bulunamadı');
      }
    } catch (e) {
      console.log('⚠️  RLS kontrolü yapılamadı');
    }

    // Sonuç
    console.log('\n' + '='.repeat(50));

    if (allSuccess) {
      console.log('🎉 SUPABASE ŞEMASI BAŞARIYLA YÜKLENDİ!');
      console.log('\n📋 SONRAKİ ADIMLAR:');
      console.log('1. ✅ Admin kullanıcısı oluşturun');
      console.log('2. ✅ Storage bucket ayarlayın');
      console.log('3. ✅ React uygulamasını test edin');
      console.log('4. ✅ İlk test ilanları ekleyin');

      console.log('\n🚀 KöydenAL platformu kullanıma hazır!');
    } else {
      console.log('⚠️  Bazı tablolar eksik veya hatalı');
      console.log('\n🔧 Şema yüklemesini tekrar kontrol edin');
    }

    return allSuccess;

  } catch (err) {
    console.log('❌ Genel doğrulama hatası:', err.message);
    return false;
  }
}

finalVerification();
