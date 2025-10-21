// quick-check.cjs - Hızlı durum kontrolü
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pwnrlllwwzpjcsevwpvr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bnJsbGx3d3pwamNzZXZ3cHZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjE1OTMsImV4cCI6MjA3NTU5NzU5M30.Bmn1m_uXmrXn8fA3-tTw2ivvF8-_Z9WryX40NCfSY4M';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function quickCheck() {
  console.log('🔍 Hızlı Supabase durumu kontrolü...\n');

  try {
    // Bağlantı testi
    console.log('📡 Bağlantı testi...');
    const { error: connError } = await supabase.from('categories').select('count').limit(1);

    if (connError) {
      if (connError.code === 'PGRST116') {
        console.log('❌ Şema yüklenmemiş - kategoriler tablosu bulunamadı');
        console.log('\n📥 ŞEMA YÜKLEME GEREKLİ!');
        return showInstructions();
      } else {
        console.log('❌ Bağlantı hatası:', connError.message);
        return false;
      }
    }

    console.log('✅ Bağlantı başarılı!');

    // Tabloları kontrol et
    const tables = ['categories', 'listings', 'user_profiles', 'admin_actions'];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: ${data} kayıt`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

    console.log('\n✅ Şema yüklü görünüyor!');
    return true;

  } catch (err) {
    console.log('❌ Genel hata:', err.message);
    return false;
  }
}

function showInstructions() {
  console.log('\n📋 ŞEMA YÜKLEME TALİMATLARI:');
  console.log('==============================');
  console.log('');
  console.log('1️⃣  Tarayıcıda Supabase Dashboard\'a gidin');
  console.log('   https://app.supabase.com/project/pwnrlllwwzpjcsevwpvr');
  console.log('');
  console.log('2️⃣  Sol menüden "SQL Editor"\'ı seçin');
  console.log('');
  console.log('3️⃣  Yeni bir sorgu sekmesi açın');
  console.log('');
  console.log('4️⃣  Dosya açın: koydendal-anon-listing-schema.sql');
  console.log('   Konum: c:\\Users\\Lenovo\\Desktop\\Kulu Tarım\\');
  console.log('');
  console.log('5️⃣  Tüm içeriği kopyalayıp SQL Editor\'e yapıştırın');
  console.log('');
  console.log('6️⃣  "RUN" butonuna tıklayın');
  console.log('');
  console.log('7️⃣  İşlem tamamlandıktan sonra bu testi tekrar çalıştırın');
  console.log('');
  console.log('📁 SQL dosyası 800+ satır içeriyor - yükleme 1-2 dakika sürebilir');

  return false;
}

quickCheck();
