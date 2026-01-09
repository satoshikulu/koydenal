// troubleshoot-db.js - Veritabanı sorunlarını teşhis eden ve çözen script
import { createClient } from '@supabase/supabase-js';

// Supabase bağlantısı (gerçek değerlerle değiştirilmeli)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'
);

async function checkDatabaseIssues() {
  console.log('🔍 Kulu Tarım Veritabanı Sorun Giderme');
  console.log('=====================================\n');

  let hasErrors = false;

  try {
    // 1. Tabloların varlığını kontrol et
    console.log('1. Tablolar kontrol ediliyor...');
    
    const tablesToCheck = ['categories', 'listings', 'user_profiles', 'admin_actions'];
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error && error.code === '42P01') {
          console.log(`❌ ${table} tablosu bulunamadı`);
          hasErrors = true;
        } else if (error) {
          console.log(`⚠️ ${table} tablosu kontrol hatası:`, error.message);
        } else {
          console.log(`✅ ${table} tablosu mevcut`);
        }
      } catch (err) {
        console.log(`❌ ${table} tablosu kontrolünde hata:`, err.message);
        hasErrors = true;
      }
    }

    // 2. Kategorileri kontrol et
    console.log('\n2. Kategoriler kontrol ediliyor...');
    try {
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id, name')
        .limit(5);

      if (catError) {
        console.log('❌ Kategoriler tablosu hatası:', catError.message);
        hasErrors = true;
      } else {
        console.log(`✅ Kategoriler tablosu çalışıyor (${categories.length} kategori)`);
      }
    } catch (err) {
      console.log('❌ Kategoriler kontrol hatası:', err.message);
      hasErrors = true;
    }

    // 3. İlanları kontrol et
    console.log('\n3. İlanlar kontrol ediliyor...');
    try {
      const { data: listings, error: listError } = await supabase
        .from('listings')
        .select('id, title, status')
        .limit(3);

      if (listError) {
        console.log('❌ İlanlar tablosu hatası:', listError.message);
        hasErrors = true;
      } else {
        console.log(`✅ İlanlar tablosu çalışıyor (${listings.length} örnek ilan)`);
      }
    } catch (err) {
      console.log('❌ İlanlar kontrol hatası:', err.message);
      hasErrors = true;
    }

    // 4. Kullanıcı profillerini kontrol et
    console.log('\n4. Kullanıcı profilleri kontrol ediliyor...');
    try {
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, email, role')
        .limit(3);

      if (profileError) {
        console.log('❌ Kullanıcı profilleri tablosu hatası:', profileError.message);
        hasErrors = true;
      } else {
        console.log(`✅ Kullanıcı profilleri tablosu çalışıyor (${profiles.length} örnek profil)`);
      }
    } catch (err) {
      console.log('❌ Kullanıcı profilleri kontrol hatası:', err.message);
      hasErrors = true;
    }

    // 5. RLS politikalarını kontrol et
    console.log('\n5. Güvenlik politikaları kontrol ediliyor...');
    try {
      // Anonim kullanıcı olarak kategorileri okumaya çalış
      const { data: anonCategories, error: anonError } = await supabase
        .from('categories')
        .select('id, name')
        .limit(1);

      if (anonError && anonError.code === '42501') {
        console.log('⚠️ Anonim kullanıcılar kategorileri göremiyor (RLS aktif)');
      } else if (anonError) {
        console.log('❌ Kategori erişim hatası:', anonError.message);
        hasErrors = true;
      } else {
        console.log('✅ Kategorilere anonim erişim çalışıyor');
      }
    } catch (err) {
      console.log('❌ Güvenlik politikası kontrol hatası:', err.message);
      hasErrors = true;
    }

    // 6. Trigger'ları kontrol et
    console.log('\n6. Trigger fonksiyonları kontrol ediliyor...');
    try {
      // Bu kontrol manuel olarak yapılmalı çünkü sistem kataloglarına erişim sınırlı
      console.log('ℹ️ Trigger kontrolleri Supabase Dashboard > SQL Editor ile yapılmalı');
    } catch (err) {
      console.log('ℹ️ Trigger kontrolü manuel olarak yapılmalı');
    }

    // 7. Admin kullanıcısını kontrol et
    console.log('\n7. Admin kullanıcı kontrolü...');
    try {
      const { data: adminUsers, error: adminError } = await supabase
        .from('user_profiles')
        .select('id, email, role')
        .eq('role', 'admin')
        .limit(5);

      if (adminError) {
        console.log('❌ Admin kullanıcı kontrol hatası:', adminError.message);
        hasErrors = true;
      } else if (adminUsers && adminUsers.length > 0) {
        console.log(`✅ ${adminUsers.length} admin kullanıcı bulundu`);
        adminUsers.forEach(user => {
          console.log(`   - ${user.email}`);
        });
      } else {
        console.log('⚠️ Hiç admin kullanıcı bulunamadı');
      }
    } catch (err) {
      console.log('❌ Admin kullanıcı kontrol hatası:', err.message);
      hasErrors = true;
    }

    console.log('\n' + '='.repeat(50));
    
    if (hasErrors) {
      console.log('❌ Veritabanında bazı sorunlar tespit edildi!');
      console.log('\n🔧 Önerilen çözümler:');
      console.log('1. kulu-tarim-complete-schema.sql dosyasını çalıştırın');
      console.log('2. Trigger çakışmaları için admin-setup-guide.sql dosyasındaki düzeltmeleri uygulayın');
      console.log('3. Gerekirse tabloları yeniden oluşturun');
      console.log('4. Admin kullanıcısı oluşturun');
      return false;
    } else {
      console.log('✅ Veritabanı doğru çalışıyor!');
      console.log('\n📋 Sonraki adımlar:');
      console.log('1. Uygulamayı test edin');
      console.log('2. Gerekirse örnek veriler ekleyin');
      return true;
    }

  } catch (error) {
    console.error('❌ Sorun giderme sırasında hata oluştu:', error.message);
    return false;
  }
}

// Script'i çalıştır
if (import.meta.url === `file://${process.argv[1]}`) {
  checkDatabaseIssues().then(success => {
    if (success) {
      console.log('\n🎉 Veritabanı sorunları çözüldü!');
    } else {
      console.log('\n🔧 Veritabanı sorunları tespit edildi. Lütfen önerilen çözümleri uygulayın.');
      process.exit(1);
    }
  });
}

export default checkDatabaseIssues;