import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pwnrlllwwzpjcsevwpvr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bnJsbGx3d3pwamNzZXZ3cHZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDAyMTU5MywiZXhwIjoyMDc1NTk3NTkzfQ.OScNq6TFw1Z08E3ZJ1vXVjmk-6bnDyIru-ZYBenKm-s'
);

async function detailedCheck() {
  console.log('🔍 Detaylı tablo analizi...\n');

  try {
    // Tüm kategorileri çek
    console.log('📂 TÜM KATEGORİLER:');
    const { data: allCategories, error: catError } = await supabase
      .from('categories')
      .select('*');

    if (catError) {
      console.log('❌ Kategoriler hatası:', catError.message);
    } else {
      console.log(`✅ ${allCategories.length} kategori bulundu:`);
      allCategories.forEach(cat => {
        console.log(`  📋 ${cat.id}: ${cat.name}`);
        if (cat.description) console.log(`     📝 ${cat.description}`);
      });
    }

    console.log('\n📋 LISTINGS TABLOSU DETAYLARI:');
    // Listings tablosunun şemasını kontrol et (eğer boşsa örnek veri ile)
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('*')
      .limit(1);

    if (listingsError) {
      console.log('❌ Listings sorgu hatası:', listingsError.message);
    } else if (listings && listings.length > 0) {
      console.log('✅ Listings tablosunda veri var');
      console.log('📊 İlk ilan alanları:', Object.keys(listings[0]));
      console.log('💾 İlk ilan örneği:', JSON.stringify(listings[0], null, 2));
    } else {
      console.log('ℹ️ Listings tablosu boş, şema kontrolü yapılamıyor');
      console.log('💡 Tabloda hiç ilan yok, önce test ilanı oluşturmamız gerekebilir');
    }

    console.log('\n👤 USER_PROFILES DETAYLARI:');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*');

    if (profilesError) {
      console.log('❌ User profiles hatası:', profilesError.message);
    } else {
      console.log(`✅ ${profiles.length} kullanıcı profili var`);
      profiles.forEach(profile => {
        console.log(`  👤 ${profile.email} (${profile.full_name})`);
      });
    }

    // İlan sayısını statüye göre kontrol et
    console.log('\n📊 İLAN İSTATİSTİKLERİ:');
    const statuses = ['pending', 'approved', 'rejected'];
    for (const status of statuses) {
      const { count, error } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);

      if (error) {
        console.log(`❌ ${status} sayım hatası:`, error.message);
      } else {
        console.log(`📈 ${status}: ${count} ilan`);
      }
    }

  } catch (error) {
    console.error('❌ Genel hata:', error);
  }
}

detailedCheck();
