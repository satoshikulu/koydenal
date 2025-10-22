require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testGuestListing() {
  console.log('🔍 Misafir kullanıcı ilan oluşturma testi...\n');

  try {
    // 1. Kategorileri al
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .limit(1);

    if (catError) {
      console.error('❌ Kategori hatası:', catError);
      return;
    }

    if (!categories || categories.length === 0) {
      console.error('❌ Kategori bulunamadı');
      return;
    }

    const categoryId = categories[0].id;
    console.log('✅ Kategori bulundu:', categories[0].name, '(ID:', categoryId, ')\n');

    // 2. Misafir kullanıcı olarak ilan oluştur (user_id = null)
    console.log('📝 Misafir kullanıcı olarak ilan oluşturuluyor...');
    
    const testListing = {
      title: 'Test Misafir İlanı - ' + new Date().toLocaleString('tr-TR'),
      description: 'Bu bir test ilanıdır. Misafir kullanıcı tarafından oluşturulmuştur.',
      price: 100,
      currency: 'TRY',
      location: 'Test Mahalle',
      category_id: categoryId,
      listing_type: 'ürün',
      status: 'pending',
      quantity: 10,
      unit: 'kg',
      contact_phone: '05551234567',
      contact_email: 'test@example.com',
      contact_person: 'Test Kullanıcı',
      user_id: null, // Misafir kullanıcı
      images: [],
      main_image: null
    };

    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .insert(testListing)
      .select()
      .single();

    if (listingError) {
      console.error('❌ İlan oluşturma hatası:', listingError.message);
      console.error('   Detay:', listingError.details);
      console.error('   Hint:', listingError.hint);
      
      if (listingError.message.includes('row-level security')) {
        console.log('\n⚠️  RLS Politikası Sorunu!');
        console.log('   Çözüm: fix-guest-listing-rls.sql scriptini Supabase Dashboard\'da çalıştırın');
      }
      return;
    }

    console.log('✅ İlan başarıyla oluşturuldu!');
    console.log('   ID:', listing.id);
    console.log('   Başlık:', listing.title);
    console.log('   Durum:', listing.status);
    console.log('   User ID:', listing.user_id, '(null = misafir)');

    // 3. Oluşturulan ilanı kontrol et
    console.log('\n📊 İlan kontrol ediliyor...');
    const { data: checkListing, error: checkError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listing.id)
      .single();

    if (checkError) {
      console.error('❌ İlan kontrol hatası:', checkError.message);
    } else {
      console.log('✅ İlan doğrulandı');
      console.log('   Başlık:', checkListing.title);
      console.log('   Durum:', checkListing.status);
      console.log('   İletişim:', checkListing.contact_person, '-', checkListing.contact_phone);
    }

    // 4. Admin dashboard'da görünüyor mu kontrol et
    console.log('\n📋 Pending listings view kontrolü...');
    const { data: pendingListings, error: pendingError } = await supabase
      .from('pending_listings')
      .select('*')
      .eq('id', listing.id)
      .single();

    if (pendingError) {
      console.error('❌ Pending view hatası:', pendingError.message);
    } else {
      console.log('✅ İlan admin dashboard\'da görünüyor!');
      console.log('   Başlık:', pendingListings.title);
      console.log('   Kullanıcı:', pendingListings.user_name || 'Misafir Kullanıcı');
    }

    console.log('\n✅ Test başarılı! Misafir kullanıcılar ilan oluşturabilir.');
    console.log('   İlan admin onayı bekliyor ve dashboard\'da görünüyor.');

  } catch (error) {
    console.error('❌ Genel hata:', error);
  }
}

testGuestListing();
