import { createClient } from '@supabase/supabase-js';

// Environment variables'ları doğrudan okuyalım (Node.js ortamında)
// Service role key kullanarak RLS'yi tamamen atlayalım
const supabaseUrl = 'https://pwnrlllwwzpjcsevwpvr.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bnJsbGx3d3pwamNzZXZ3cHZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDAyMTU5MywiZXhwIjoyMDc1NTk3NTkzfQ.OScNq6TFw1Z08E3ZJ1vXVjmk-6bnDyIru-ZYBenKm-s';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test ilanı oluşturma fonksiyonu
async function createTestListing() {
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
    console.log('\n👤 Mevcut kullanıcıları kontrol ediyorum...');
    const { data: existingUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, email')
      .limit(5);

    if (usersError) {
      throw new Error(`Kullanıcılar kontrol edilemedi: ${usersError.message}`);
    }

    console.log('Mevcut kullanıcılar:', existingUsers);

    // Eğer mevcut kullanıcı varsa onu kullan, yoksa yeni oluştur
    let testUserId;
    if (existingUsers && existingUsers.length > 0) {
      testUserId = existingUsers[0].id;
      console.log(`✅ Mevcut kullanıcı kullanılacak: ${existingUsers[0].email}`);
    } else {
      // Yeni kullanıcı oluştur (farklı UUID ile)
      testUserId = '660e8400-e29b-41d4-a716-446655440001';
      console.log('\n👤 Yeni test kullanıcısı oluşturuyorum...');

      try {
        const { data: userProfile, error: userError } = await supabase
          .from('user_profiles')
          .insert({
            id: testUserId,
            email: 'test2@example.com',
            full_name: 'Test Kullanıcısı 2',
            phone: '+90 555 123 4568',
            location: 'Kulu, Konya',
            role: 'user'
          })
          .select()
          .single();

        if (userError) {
          throw new Error(`Kullanıcı oluşturma hatası: ${userError.message}`);
        }

        console.log('✅ Yeni test kullanıcısı oluşturuldu:', userProfile.email);
      } catch (error) {
        console.log('⚠️ Kullanıcı oluşturma başarısız, mevcut bir kullanıcı kullanılacak');
        testUserId = existingUsers && existingUsers.length > 0 ? existingUsers[0].id : '550e8400-e29b-41d4-a716-446655440000';
      }
    }

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
      category_id: categories[0].id, // İlk kategoriyi kullan
      listing_type: 'ürün',
      status: 'approved', // Admin olarak onaylı şekilde ekleyelim
      quantity: 50,
      unit: 'kg',
      quality_grade: 'Premium',
      contact_phone: '+90 555 123 4567',
      contact_email: 'test@example.com',
      contact_person: 'Test Kullanıcısı',
      images: ['https://picsum.photos/400/300?random=1'],
      main_image: 'https://picsum.photos/400/300?random=1',
      latitude: 39.0955,
      longitude: 33.0786,
      user_id: testUserId // Artık geçerli bir kullanıcı ID'si kullanıyoruz
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
      price: `${listing.price} ${listing.currency}`
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

  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

// Script'i çalıştıralım
createTestListing();
