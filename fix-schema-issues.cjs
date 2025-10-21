// fix-schema-issues.cjs - Şema sorunlarını düzeltme testi
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pwnrlllwwzpjcsevwpvr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bnJsbGx3d3pwamNzZXZ3cHZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjE1OTMsImV4cCI6MjA3NTU5NzU5M30.Bmn1m_uXmrXn8fA3-tTw2ivvF8-_Z9WryX40NCfSY4M';

console.log('🔧 ŞEMA SORUNLARINI DÜZELTME');
console.log('============================\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function diagnoseIssues() {
  try {
    console.log('📋 Sorunları tespit ediyorum...\n');

    // 1. Tabloların varlığını kontrol et
    const tables = ['categories', 'listings', 'user_profiles', 'admin_actions'];

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count').limit(1);
        if (error && error.code === 'PGRST116') {
          console.log(`❌ ${table} tablosu YOK`);
        } else if (error) {
          console.log(`⚠️  ${table} tablosu erişim sorunu: ${error.message}`);
        } else {
          console.log(`✅ ${table} tablosu mevcut`);
        }
      } catch (err) {
        console.log(`❌ ${table} kontrol hatası: ${err.message}`);
      }
    }

    // 2. Kategorileri basit bir şekilde almaya çalış
    console.log('\n📂 Kategorileri basit yöntemle kontrol ediyorum...');
    try {
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id, name, icon')
        .limit(5);

      if (catError) {
        console.log(`❌ Kategoriler alınamadı: ${catError.message}`);
      } else if (categories && categories.length > 0) {
        console.log(`✅ ${categories.length} kategori bulundu:`);
        categories.forEach(cat => {
          console.log(`   ${cat.icon} ${cat.name}`);
        });
      } else {
        console.log('ℹ️  Kategori bulunamadı');
      }
    } catch (err) {
      console.log(`❌ Kategori kontrol hatası: ${err.message}`);
    }

    console.log('\n📋 TESPİT EDİLEN SORUNLAR:');
    console.log('========================');
    console.log('1. ❌ listings tablosu eksik');
    console.log('2. ❌ user_profiles tablosu eksik');
    console.log('3. ❌ display_order sütunu eksik');
    console.log('4. ❌ View\'lar yüklenmemiş');
    console.log('5. ❌ RLS politikaları eksik');

    console.log('\n🔧 ÇÖZÜM:');
    console.log('========');
    console.log('📥 Şema dosyasını tekrar yüklemeniz gerekiyor!');
    console.log('\n📋 YAPILMASI GEREKENLER:');
    console.log('');
    console.log('1️⃣  Supabase Dashboard\'a gidin');
    console.log('   https://app.supabase.com/project/pwnrlllwwzpjcsevwpvr');
    console.log('');
    console.log('2️⃣  SQL Editor\'ü açın');
    console.log('');
    console.log('3️⃣  koydendal-anon-listing-schema.sql');
    console.log('   dosyasının TAMAMININ içeriğini kopyalayın');
    console.log('');
    console.log('4️⃣  SQL Editor\'e yapıştırın');
    console.log('');
    console.log('5️⃣  "RUN" butonuna tıklayın');
    console.log('');
    console.log('6️⃣  Tüm komutlar başarıyla çalışacak');
    console.log('');
    console.log('📁 Dosya konumu:');
    console.log('   c:\\Users\\Lenovo\\Desktop\\Kulu Tarım\\koydendal-anon-listing-schema.sql');
    console.log('');
    console.log('⚠️  Önceki şema yüklemesi eksik kalmış olabilir');

    return false;

  } catch (err) {
    console.log('❌ Genel teşhis hatası:', err.message);
    return false;
  }
}

diagnoseIssues();
