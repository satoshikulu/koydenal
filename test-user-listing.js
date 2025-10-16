import { createClient } from '@supabase/supabase-js';

// Service role key kullanarak RLS'yi tamamen atlayalım
const supabaseUrl = 'https://pwnrlllwwzpjcsevwpvr.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bnJsbGx3d3pwamNzZXZ3cHZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDAyMTU5MywiZXhwIjoyMDc1NTk3NTkzfQ.OScNq6TFw1Z08E3ZJ1vXVjmk-6bnDyIru-ZYBenKm-s';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Mevcut kullanıcıyı bulma fonksiyonu
async function findExistingUser() {
  try {
    console.log('🚀 Supabase bağlantısını test ediyorum...');

    // Önce bağlantıyı test edelim
    const { data: connectionData, error: connectionError } = await supabase
      .from('categories')
      .select('id, name')
      .limit(1);

    if (connectionError) {
      throw new Error(`Bağlantı hatası: ${connectionError.message}`);
    }

    console.log('✅ Supabase bağlantısı başarılı!');
    console.log('Mevcut kategoriler:', connectionData);

    // Önce mevcut kullanıcıları kontrol edelim
    console.log('\n👤 Mevcut kullanıcıları arıyorum...');
    const { data: existingUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, email')
      .limit(10);

    if (usersError) {
      throw new Error(`Kullanıcılar kontrol edilemedi: ${usersError.message}`);
    }

    console.log('Mevcut kullanıcılar:', existingUsers);

    // satoshinakamototokyo42@gmail.com kullanıcısını bulalım
    const targetUser = existingUsers?.find(user => user.email === 'satoshinakamototokyo42@gmail.com');

    if (targetUser) {
      console.log(`✅ Hedef kullanıcı bulundu: ${targetUser.email} (ID: ${targetUser.id})`);

      // Test ilanı oluşturmak için kategori ID'sini alalım
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .limit(5);

      if (categoriesError) {
        throw new Error(`Kategoriler alınamadı: ${categoriesError.message}`);
      }

      if (!categories || categories.length === 0) {
        throw new Error('Hiç kategori bulunamadı!');
      }

      console.log('\n📝 Test ilanı oluşturuyorum...');

      // Test ilanı verisi
      const testListing = {
        title: 'Test Ürünü - Organik Domates',
        description: 'Bu bir test ilanıdır. Organik olarak yetiştirilmiş taze domatesler. Köyümüzün özel topraklarında yetişen, hormonsuz ve tamamen doğal ürünlerdir.',
        price: 25.50,
        currency: 'TRY',
        location: 'Kulu, Konya',
        category_id: categories[0].id,
        listing_type: 'ürün',
        status: 'approved',
        quantity: 50,
        unit: 'kg',
        quality_grade: 'Premium',
        contact_phone: '+90 555 123 4567',
        contact_email: 'satoshinakamototokyo42@gmail.com',
        contact_person: 'Satoshi Nakamoto',
        images: ['https://picsum.photos/400/300?random=1'],
        main_image: 'https://picsum.photos/400/300?random=1',
        latitude: 39.0955,
        longitude: 33.0786,
        user_id: targetUser.id
      };

      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert(testListing)
        .select()
        .single();

      if (listingError) {
        throw new Error(`İlan oluşturma hatası: ${listingError.message}`);
      }

      console.log('✅ Test ilanı başarıyla oluşturuldu!');
      console.log('İlan detayları:', {
        id: listing.id,
        title: listing.title,
        category: categories[0].name,
        location: listing.location,
        price: `${listing.price} ${listing.currency}`,
        user: targetUser.email
      });

      // Oluşturulan ilanı kontrol edelim
      console.log('\n🔍 Oluşturulan ilanı doğruluyorum...');
      const { data: verifyListing, error: verifyError } = await supabase
        .from('listings')
        .select(`
          *,
          categories(name)
        `)
        .eq('id', listing.id)
        .single();

      if (verifyError) {
        throw new Error(`İlan doğrulama hatası: ${verifyError.message}`);
      }

      console.log('✅ İlan doğrulandı:', {
        id: verifyListing.id,
        title: verifyListing.title,
        category: verifyListing.categories?.name,
        status: verifyListing.status,
        created_at: verifyListing.created_at
      });

      console.log('\n🎉 Tüm testler başarıyla tamamlandı!');
      console.log(`İlan URL: http://localhost:5173/ilan-detay/${listing.id}`);

    } else {
      console.log('❌ Hedef kullanıcı bulunamadı: satoshinakamototokyo42@gmail.com');
      console.log('Mevcut kullanıcılar:', existingUsers?.map(u => u.email));
    }

  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

// Script'i çalıştıralım
findExistingUser();
