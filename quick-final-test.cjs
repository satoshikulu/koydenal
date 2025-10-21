// quick-final-test.cjs - Son test
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pwnrlllwwzpjcsevwpvr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bnJsbGx3d3pwamNzZXZ3cHZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjE1OTMsImV4cCI6MjA3NTU5NzU5M30.Bmn1m_uXmrXn8fA3-tTw2ivvF8-_Z9WryX40NCfSY4M';

console.log('🌾 SON TEST - KÖYDENAL SUPABASE');
console.log('==============================\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runFinalTest() {
  try {
    // Tüm temel tabloları test et
    const tables = [
      { name: 'categories', minCount: 6 },
      { name: 'listings', minCount: 0 },
      { name: 'user_profiles', minCount: 0 },
      { name: 'admin_actions', minCount: 0 }
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
          const status = count >= table.minCount ? '✅' : '⚠️';
          console.log(`${status} ${table.name}: ${count} kayıt`);
        }
      } catch (err) {
        console.log(`❌ ${table.name}: ${err.message}`);
        allSuccess = false;
      }
    }

    // Kategorileri detaylı göster
    console.log('\n📂 Kategoriler:');
    try {
      const { data: categories, error } = await supabase
        .from('categories')
        .select('name, icon')
        .order('display_order');

      if (!error && categories) {
        categories.forEach(cat => {
          console.log(`   ${cat.icon} ${cat.name}`);
        });
      }
    } catch (err) {
      console.log(`⚠️  Kategoriler detaylı gösterilemedi: ${err.message}`);
    }

    // View'ları test et
    console.log('\n📊 View testi:');
    try {
      const { error: viewError } = await supabase
        .from('active_listings_summary')
        .select('count')
        .limit(1);

      if (viewError) {
        console.log(`⚠️  View çalışmıyor: ${viewError.message}`);
      } else {
        console.log('✅ View\'lar çalışır durumda');
      }
    } catch (err) {
      console.log(`⚠️  View testi yapılamadı: ${err.message}`);
    }

    console.log('\n' + '='.repeat(50));

    if (allSuccess) {
      console.log('🎉 SUPABASE ŞEMASI BAŞARIYLA HAZIR!');
      console.log('\n🚀 SONRAKİ ADIMLAR:');
      console.log('1. ✅ Admin kullanıcısı oluşturun');
      console.log('2. ✅ Storage bucket ayarlayın');
      console.log('3. ✅ React uygulamasını test edin');
      console.log('4. ✅ İlk ilanları ekleyin');

      console.log('\n🌾 KÖYDENAL PLATFORMU HAZIR!');
    } else {
      console.log('⚠️  Hala bazı sorunlar var');
      console.log('\n🔧 Lütfen şema yüklemesini tekrar kontrol edin');
    }

    return allSuccess;

  } catch (err) {
    console.log('❌ Genel test hatası:', err.message);
    return false;
  }
}

runFinalTest();
