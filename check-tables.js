import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pwnrlllwwzpjcsevwpvr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bnJsbGx3d3pwamNzZXZ3cHZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDAyMTU5MywiZXhwIjoyMDc1NTk3NTkzfQ.OScNq6TFw1Z08E3ZJ1vXVjmk-6bnDyIru-ZYBenKm-s'
);

async function checkTableStructure() {
  console.log('🔍 Supabase tablo yapılarını kontrol ediyorum...\n');

  try {
    // 1. Listings tablosu
    console.log('📋 LISTINGS TABLOSU:');
    const { data: listingsData, error: listingsError } = await supabase
      .from('listings')
      .select('*')
      .limit(1);

    if (listingsError) {
      console.log('❌ Listings tablosu hatası:', listingsError.message);
    } else {
      console.log('✅ Listings tablosu mevcut');
      if (listingsData && listingsData.length > 0) {
        console.log('📊 Mevcut alanlar:', Object.keys(listingsData[0]));
      }
    }

    console.log('\n📂 CATEGORIES TABLOSU:');
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(1);

    if (categoriesError) {
      console.log('❌ Categories tablosu hatası:', categoriesError.message);
    } else {
      console.log('✅ Categories tablosu mevcut');
      if (categoriesData && categoriesData.length > 0) {
        console.log('📊 Mevcut alanlar:', Object.keys(categoriesData[0]));
        console.log('📋 Kategoriler:', categoriesData.map(c => `${c.id}: ${c.name}`));
      }
    }

    console.log('\n👤 USER_PROFILES TABLOSU:');
    const { data: profilesData, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.log('❌ User_profiles tablosu hatası:', profilesError.message);
    } else {
      console.log('✅ User_profiles tablosu mevcut');
      if (profilesData && profilesData.length > 0) {
        console.log('📊 Mevcut alanlar:', Object.keys(profilesData[0]));
      }
    }

    console.log('\n🔐 AUTH.USERS TABLOSU:');
    // Auth.users tablosuna direkt erişim yok, sadece kontrol edebiliriz
    console.log('ℹ️ Auth.users tablosu Supabase tarafından yönetiliyor');

    // Mevcut ilanları kontrol edelim
    console.log('\n📈 MEVCUT İLANLAR:');
    const { data: currentListings, error: currentError } = await supabase
      .from('listings')
      .select('id, title, status, category_id, user_id, created_at')
      .order('created_at', { ascending: false });

    if (currentError) {
      console.log('❌ İlanlar kontrol hatası:', currentError.message);
    } else {
      console.log(`✅ Toplam ${currentListings?.length || 0} ilan var`);
      if (currentListings && currentListings.length > 0) {
        currentListings.forEach(listing => {
          console.log(`  - ${listing.title} (${listing.status}) - ${listing.created_at}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Genel hata:', error);
  }
}

checkTableStructure();
