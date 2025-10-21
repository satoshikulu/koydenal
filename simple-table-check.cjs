// simple-table-check.cjs - Basit tablo kontrolü
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pwnrlllwwzpjcsevwpvr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bnJsbGx3d3pwamNzZXZ3cHZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjE1OTMsImV4cCI6MjA3NTU5NzU5M30.Bmn1m_uXmrXn8fA3-tTw2ivvF8-_Z9WryX40NCfSY4M';

console.log('🔍 BASİT TABLO KONTROLÜ');
console.log('=======================\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTables() {
  try {
    console.log('📋 Tabloları tek tek kontrol ediyorum...\n');

    // Kategorileri test et
    console.log('1️⃣ Kategoriler tablosu:');
    try {
      const { data, error } = await supabase.from('categories').select('id');
      if (error) {
        console.log(`   ❌ Hata: ${error.message}`);
      } else {
        console.log(`   ✅ Başarılı - ${data ? data.length : 0} kayıt`);
      }
    } catch (err) {
      console.log(`   ❌ Catch hatası: ${err.message}`);
    }

    // Listings tablosunu test et
    console.log('\n2️⃣ Listings tablosu:');
    try {
      const { data, error } = await supabase.from('listings').select('id');
      if (error) {
        console.log(`   ❌ Hata: ${error.message}`);
      } else {
        console.log(`   ✅ Başarılı - ${data ? data.length : 0} kayıt`);
      }
    } catch (err) {
      console.log(`   ❌ Catch hatası: ${err.message}`);
    }

    // User profiles tablosunu test et
    console.log('\n3️⃣ User profiles tablosu:');
    try {
      const { data, error } = await supabase.from('user_profiles').select('id');
      if (error) {
        console.log(`   ❌ Hata: ${error.message}`);
      } else {
        console.log(`   ✅ Başarılı - ${data ? data.length : 0} kayıt`);
      }
    } catch (err) {
      console.log(`   ❌ Catch hatası: ${err.message}`);
    }

    // Admin actions tablosunu test et
    console.log('\n4️⃣ Admin actions tablosu:');
    try {
      const { data, error } = await supabase.from('admin_actions').select('id');
      if (error) {
        console.log(`   ❌ Hata: ${error.message}`);
      } else {
        console.log(`   ✅ Başarılı - ${data ? data.length : 0} kayıt`);
      }
    } catch (err) {
      console.log(`   ❌ Catch hatası: ${err.message}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('📋 SONUÇ: Eğer tüm tablolar ✅ gösteriyorsa şema düzgün yüklenmiş!');
    console.log('🔍 Eğer hala ❌ görüyorsanız şema yüklemesi tekrar gerekli.');

  } catch (err) {
    console.log('❌ Genel kontrol hatası:', err.message);
  }
}

checkTables();
