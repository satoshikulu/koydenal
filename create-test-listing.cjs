// create-test-listing.cjs - Test ilanı oluşturma
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pwnrlllwwzpjcsevwpvr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bnJsbGx3d3pwamNzZXZ3cHZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjE1OTMsImV4cCI6MjA3NTU5NzU5M30.Bmn1m_uXmrXn8fA3-tTw2ivvF8-_Z9WryX40NCfSY4M';

console.log('🌾 TEST İLANI OLUŞTURMA');
console.log('======================\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createTestListing() {
  try {
    console.log('🔄 Test ilanı oluşturuluyor...\n');

    // Önce kategori ID'sini alalım
    const { data: categoryData, error: catError } = await supabase
      .from('categories')
      .select('id')
      .eq('name', 'Sebzeler')
      .single();

    if (catError) {
      console.error('❌ Kategori bulunamadı:', catError.message);
      return;
    }

    console.log('✅ Sebzeler kategorisi ID:', categoryData.id);

    // Test ilanını oluştur
    const { data: listingData, error: listingError } = await supabase
      .from('listings')
      .insert({
        title: 'Test İlanı - Organik Domates (Sistem Testi)',
        description: 'Bu ilan sistem testi için otomatik olarak oluşturulmuştur. KöydenAL platformunun üye olmadan ilan verme özelliğini test etmek için kullanılır. Gerçek bir ürün satışı içermez.',
        price: 25.00,
        currency: 'TRY',
        quantity: 50,
        unit: 'kg',
        location: 'CUMHURİYET MAHALLESİ',
        category_id: categoryData.id,
        listing_type: 'ürün',
        status: 'pending', // Admin onayı gerektirir
        contact_phone: '+905551234567',
        contact_email: 'test@koydendal.com',
        contact_person: 'Sistem Test Kullanıcısı',
        preferred_contact: 'telefon',
        // user_id null - üye olmadan ilan
        // listing_secret otomatik oluşturulacak
      })
      .select()
      .single();

    if (listingError) {
      console.error('❌ İlan oluşturma hatası:', listingError.message);
      return;
    }

    console.log('🎉 TEST İLANI BAŞARIYLA OLUŞTURULDU!');
    console.log('\n📋 İlan Detayları:');
    console.log(`   🆔 ID: ${listingData.id}`);
    console.log(`   📝 Başlık: ${listingData.title}`);
    console.log(`   💰 Fiyat: ${listingData.price} ₺`);
    console.log(`   📍 Lokasyon: ${listingData.location}`);
    console.log(`   📞 İletişim: ${listingData.contact_person} - ${listingData.contact_phone}`);
    console.log(`   🔐 Gizli Anahtar: ${listingData.listing_secret.substring(0, 16)}...`);
    console.log(`   📊 Durum: ${listingData.status}`);

    console.log('\n🚀 İLAN YÖNETİMİ İÇİN:');
    console.log(`   Yönetici URL: /ilan-yonetim/${listingData.id}?secret=${listingData.listing_secret}`);

    // İlanı onaylanmış olarak işaretle (admin simülasyonu)
    console.log('\n🔄 İlanı onaylanmış olarak işaretliyorum...');
    const { error: approveError } = await supabase
      .from('listings')
      .update({ status: 'approved' })
      .eq('id', listingData.id);

    if (approveError) {
      console.log('⚠️  Otomatik onay başarısız:', approveError.message);
    } else {
      console.log('✅ İlan otomatik olarak onaylandı');
    }

    console.log('\n📊 SİSTEM ÖZETİ:');
    const { data: stats, error: statsError } = await supabase
      .from('listings')
      .select('status, COUNT(*) as count')
      .group('status');

    if (!statsError && stats) {
      console.log('İlan durumları:');
      stats.forEach(stat => {
        console.log(`   ${stat.status}: ${stat.count} adet`);
      });
    }

    console.log('\n🎉 SUPABASE ENTEGRASYONU BAŞARIYLA TEST EDİLDİ!');

  } catch (err) {
    console.error('❌ Genel hata:', err.message);
  }
}

createTestListing();
