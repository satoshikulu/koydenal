// Test ilanı oluşturma scripti
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pwnrlllwwzpjcsevwpvr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bnJsbGx3d3pwamNzZXZ3cHZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDAyMTU5MywiZXhwIjoyMDc1NTk3NTkzfQ.OScNq6TFw1Z08E3ZJ1vXVjmk-6bnDyIru-ZYBenKm-s'
);

async function createTestListing() {
  try {
    console.log('🚀 Test ilanı oluşturuyorum...');

    // Önce mevcut kategorileri alalım
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name');

    if (catError) {
      throw new Error(`Kategoriler alınamadı: ${catError.message}`);
    }

    console.log('Mevcut kategoriler:', categories);

    // Test kullanıcısını kontrol edelim
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email')
      .limit(5);

    if (userError) {
      throw new Error(`Kullanıcılar alınamadı: ${userError.message}`);
    }

    console.log('Mevcut kullanıcılar:', users);

    if (users && users.length > 0) {
      const testUser = users[0];

      // Test ilanı oluştur
      const testListing = {
        title: 'Test İlanı - Organik Domates',
        description: 'Bu bir test ilanıdır. Admin paneli testi için oluşturulmuştur.',
        price: 25.50,
        currency: 'TRY',
        location: 'Kulu, Konya',
        category_id: categories[0]?.id || 'ceddf343-3ded-4f8a-b5aa-7fde58d34a67',
        listing_type: 'ürün',
        status: 'pending',
        quantity: 50,
        unit: 'kg',
        contact_phone: '+90 555 123 4567',
        contact_email: testUser.email,
        contact_person: 'Test Kullanıcısı',
        images: ['https://picsum.photos/400/300?random=1'],
        main_image: 'https://picsum.photos/400/300?random=1',
        user_id: testUser.id
      };

      console.log('İlan verisi:', testListing);

      const { data, error } = await supabase
        .from('listings')
        .insert(testListing)
        .select()
        .single();

      if (error) {
        throw new Error(`İlan oluşturma hatası: ${error.message}`);
      }

      console.log('✅ Test ilanı başarıyla oluşturuldu:', data);

    } else {
      console.log('❌ Test kullanıcısı bulunamadı');
    }

  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

createTestListing();
