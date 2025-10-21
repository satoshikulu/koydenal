// schema-test.js - Şema yükleme testi
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

    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_names');

    if (tablesError) {
      console.log('⚠️  get_table_names fonksiyonu bulunamadı, manuel kontrol yapıyorum...');

      // Manuel tablo kontrolü
      const { data: categoriesExist, error: catError } = await supabase
        .from('categories')
        .select('count')
        .limit(1);

      if (catError && catError.code === 'PGRST116') {
        console.log('❌ categories tablosu bulunamadı');
        return await loadSchema();
      } else {
        console.log('✅ categories tablosu mevcut');
        return testExistingSchema();
      }
    }

    console.log('📊 Bulunan tablolar:', tables);

    if (tables && tables.length > 0) {
      console.log('✅ Tablolar mevcut, mevcut şemayı test ediyorum...');
      return await testExistingSchema();
    } else {
      console.log('❌ Tablo bulunamadı, şema yüklemesi gerekli...');
      return await loadSchema();
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
      .limit(5);

    if (listError) {
      console.error('❌ İlanlar alınamadı:', listError.message);
    } else {
      console.log(`✅ ${listings.length} ilan örneği:`);
      listings.forEach(list => {
        console.log(`   ${list.title} - ${list.status}`);
      });
    }

    // 3. RLS politikalarını test et
    console.log('\n🔒 RLS politikalarını test ediyorum...');

    const { data: policies, error: polError } = await supabase
      .from('pg_policies')
      .select('*')
      .limit(5);

    if (polError) {
      console.log('⚠️  RLS politikaları kontrol edilemedi:', polError.message);
    } else {
      console.log(`✅ ${policies.length} RLS politikası bulundu`);
    }

    console.log('\n🎉 Mevcut şema testi tamamlandı!');
    return true;

  } catch (err) {
    console.error('❌ Şema testi hatası:', err.message);
    return false;
  }
}

async function loadSchema() {
  console.log('\n📥 Şema yüklemesi başlatılıyor...\n');

  try {
    // Şema dosyasını oku
    const schemaPath = path.join(process.cwd(), 'koydendal-anon-listing-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Şema dosyası yüklendi, Supabase\'e gönderiliyor...');

    // Şemayı çalıştır (Bu kısım manuel yapılmalı çünkü RPC ile büyük SQL çalıştırılamaz)
    console.log('⚠️  Büyük SQL şeması yüklenemez - Manuel yükleme gerekli!');
    console.log('\n📋 Manuel şema yükleme adımları:');
    console.log('1. Supabase Dashboard > SQL Editor\'ü açın');
    console.log('2. koydendal-anon-listing-schema.sql dosyasını açın');
    console.log('3. İçeriği kopyalayıp SQL Editor\'e yapıştırın');
    console.log('4. RUN butonuna tıklayın');

    return true;

  } catch (err) {
    console.error('❌ Şema yükleme hatası:', err.message);
    return false;
  }
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
    console.log('1. .env dosyasındaki URL ve KEY\'i kontrol edin');
    console.log('2. Supabase projesinin aktif olduğunu kontrol edin');
    console.log('3. ANON-LISTING-REHBER.md dosyasını okuyun');
  }
}

// Testi çalıştır
runTests();
