require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testFullListingWithImage() {
  console.log('🔍 Resimli ilan oluşturma testi...\n');

  try {
    // 1. Test resmi oluştur (1x1 pixel PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    // 2. Resmi yükle
    console.log('📤 Resim yükleniyor...');
    const fileName = `test/${Date.now()}-test.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('listing_images')
      .upload(fileName, testImageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('❌ Upload hatası:', uploadError.message);
      return;
    }

    console.log('✅ Resim yüklendi:', uploadData.path);

    // 3. Public URL al
    const { data: { publicUrl } } = supabase.storage
      .from('listing_images')
      .getPublicUrl(uploadData.path);

    console.log('✅ Public URL:', publicUrl);

    // 4. URL'yi test et (fetch ile)
    console.log('\n🔗 URL test ediliyor...');
    try {
      const response = await fetch(publicUrl);
      console.log('   Status:', response.status);
      console.log('   OK:', response.ok);
      
      if (!response.ok) {
        console.error('❌ Resim erişilemez!');
        console.log('   Bucket public mi kontrol edin');
      } else {
        console.log('✅ Resim erişilebilir!');
      }
    } catch (fetchError) {
      console.error('❌ Fetch hatası:', fetchError.message);
    }

    // 5. Kategori al
    const { data: categories } = await supabase
      .from('categories')
      .select('id')
      .limit(1);

    if (!categories || categories.length === 0) {
      console.error('❌ Kategori bulunamadı');
      return;
    }

    // 6. İlan oluştur
    console.log('\n📝 İlan oluşturuluyor...');
    const listingData = {
      title: 'Test İlanı - Resimli ' + new Date().toLocaleString('tr-TR'),
      description: 'Bu bir test ilanıdır. Resim upload testi için oluşturuldu.',
      price: 100,
      currency: 'TRY',
      location: 'Test Mahalle',
      category_id: categories[0].id,
      listing_type: 'ürün',
      status: 'pending',
      quantity: 10,
      unit: 'kg',
      contact_phone: '05551234567',
      contact_email: 'test@example.com',
      contact_person: 'Test Kullanıcı',
      user_id: null,
      images: [publicUrl],
      main_image: publicUrl
    };

    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .insert(listingData)
      .select()
      .single();

    if (listingError) {
      console.error('❌ İlan oluşturma hatası:', listingError.message);
      return;
    }

    console.log('✅ İlan oluşturuldu!');
    console.log('   ID:', listing.id);
    console.log('   Başlık:', listing.title);
    console.log('   Main Image:', listing.main_image);
    console.log('   Images:', listing.images);

    console.log('\n🎉 Test başarılı!');
    console.log('   Admin panelinde ilanı onaylayın ve resmin görünüp görünmediğini kontrol edin.');

  } catch (error) {
    console.error('❌ Genel hata:', error);
  }
}

testFullListingWithImage();
