// Supabase Veritabanı Yapısı Kontrol Scripti
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

// .env dosyasını oku
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL veya ANON KEY bulunamadı!');
  process.exit(1);
}

console.log('🔗 Supabase\'e bağlanılıyor...');
console.log('📍 URL:', supabaseUrl);
console.log('');

const supabase = createClient(supabaseUrl, supabaseKey);

// Veritabanı yapısını kontrol et
async function checkDatabaseStructure() {
  console.log('📊 VERİTABANI YAPISI KONTROLÜ\n');
  console.log('='.repeat(60));

  // 1. Kategorileri kontrol et
  console.log('\n1️⃣ KATEGORİLER:');
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('❌ Kategoriler alınamadı:', error.message);
    } else {
      console.log(`✅ ${categories.length} kategori bulundu:`);
      categories.forEach(cat => {
        console.log(`   - ${cat.icon} ${cat.name} (${cat.slug}) - Sıra: ${cat.display_order}, Aktif: ${cat.is_active}`);
      });
    }
  } catch (err) {
    console.error('❌ Hata:', err.message);
  }

  // 2. User Profiles yapısını kontrol et
  console.log('\n2️⃣ KULLANICI PROFİLLERİ:');
  try {
    const { data: profiles, error, count } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ User profiles kontrol edilemedi:', error.message);
    } else {
      console.log(`✅ Toplam ${count} kullanıcı profili var`);
      
      // Admin kullanıcıları kontrol et
      const { data: admins } = await supabase
        .from('user_profiles')
        .select('email, role, status')
        .in('role', ['admin', 'moderator']);
      
      if (admins && admins.length > 0) {
        console.log(`   👑 ${admins.length} admin/moderator bulundu:`);
        admins.forEach(admin => {
          console.log(`      - ${admin.email} (${admin.role}) - Durum: ${admin.status}`);
        });
      }
    }
  } catch (err) {
    console.error('❌ Hata:', err.message);
  }

  // 3. Listings yapısını kontrol et
  console.log('\n3️⃣ İLANLAR:');
  try {
    const { data: listings, error, count } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Listings kontrol edilemedi:', error.message);
    } else {
      console.log(`✅ Toplam ${count} ilan var`);
      
      // Status dağılımı
      const { data: statusCounts } = await supabase
        .from('listings')
        .select('status');
      
      if (statusCounts) {
        const statusMap = {};
        statusCounts.forEach(l => {
          statusMap[l.status] = (statusMap[l.status] || 0) + 1;
        });
        console.log('   📊 Durum dağılımı:');
        Object.entries(statusMap).forEach(([status, count]) => {
          console.log(`      - ${status}: ${count}`);
        });
      }

      // Öne çıkan ilanlar
      const { data: featured } = await supabase
        .from('listings')
        .select('id, title, is_featured, is_opportunity')
        .eq('is_featured', true)
        .limit(5);
      
      if (featured && featured.length > 0) {
        console.log(`   ⭐ ${featured.length} öne çıkan ilan var`);
      }

      // Fırsat ilanları
      const { data: opportunities } = await supabase
        .from('listings')
        .select('id, title')
        .eq('is_opportunity', true)
        .limit(5);
      
      if (opportunities && opportunities.length > 0) {
        console.log(`   🔥 ${opportunities.length} fırsat ilanı var`);
      }
    }
  } catch (err) {
    console.error('❌ Hata:', err.message);
  }

  // 4. Admin Actions kontrolü
  console.log('\n4️⃣ ADMIN İŞLEMLERİ:');
  try {
    const { data: actions, error, count } = await supabase
      .from('admin_actions')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Admin actions kontrol edilemedi:', error.message);
    } else {
      console.log(`✅ Toplam ${count} admin işlemi kaydedilmiş`);
    }
  } catch (err) {
    console.error('❌ Hata:', err.message);
  }

  // 5. Tablo yapısı kontrolü (SQL ile - anon key ile sınırlı)
  console.log('\n5️⃣ TABLO YAPISI:');
  console.log('   ⚠️  Detaylı tablo yapısı için Supabase Dashboard > SQL Editor kullanın');
  console.log('   📄 check_database_structure.sql dosyasını çalıştırın');

  // 6. Öneriler
  console.log('\n' + '='.repeat(60));
  console.log('\n💡 ÖNERİLER:\n');
  
  // Kategori kontrolü
  const { data: categories } = await supabase
    .from('categories')
    .select('name, display_order')
    .order('display_order');
  
  const hasKumes = categories?.some(c => c.name.includes('Kümes') || c.name.includes('kumes'));
  const hasSut = categories?.some(c => c.name.includes('Süt') || c.name.includes('sut'));
  
  if (!hasKumes || !hasSut) {
    console.log('1. ⚠️  Kategori güncellemesi gerekli:');
    console.log('   → update_categories_for_pwa.sql dosyasını çalıştırın');
  } else {
    console.log('1. ✅ Kategoriler PWA için güncellenmiş görünüyor');
  }

  // is_opportunity kontrolü
  const { data: testListing } = await supabase
    .from('listings')
    .select('is_opportunity')
    .limit(1);
  
  if (testListing && testListing.length > 0 && testListing[0].hasOwnProperty('is_opportunity')) {
    console.log('2. ✅ is_opportunity alanı mevcut');
  } else {
    console.log('2. ⚠️  is_opportunity alanı eksik olabilir:');
    console.log('   → add_opportunity_field.sql dosyasını kontrol edin');
  }

  console.log('\n3. 📋 Veritabanı iyileştirmeleri için:');
  console.log('   → fix_and_optimize_database.sql dosyasını çalıştırın');

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Kontrol tamamlandı!\n');
}

// Çalıştır
checkDatabaseStructure().catch(console.error);
