require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testImageUpload() {
  console.log('🔍 Resim upload testi başlıyor...\n');

  try {
    // 1. Bucket kontrolü
    console.log('📦 Bucket kontrolü...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Bucket listesi alınamadı:', bucketsError.message);
      return;
    }

    const listingImagesBucket = buckets.find(b => b.id === 'listing_images');
    if (!listingImagesBucket) {
      console.error('❌ listing_images bucket bulunamadı!');
      console.log('   Çözüm: create-storage-bucket.sql scriptini Supabase Dashboard\'da çalıştırın');
      return;
    }

    console.log('✅ listing_images bucket mevcut');
    console.log('   Public:', listingImagesBucket.public);
    console.log('   Created:', listingImagesBucket.created_at);

    // 2. Test resmi oluştur (1x1 pixel PNG)
    console.log('\n📸 Test resmi oluşturuluyor...');
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    // 3. Resim upload testi
    console.log('📤 Resim yükleniyor...');
    const fileName = `test/${Date.now()}-test.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('listing_images')
      .upload(fileName, testImageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload hatası:', uploadError.message);
      console.error('   Kod:', uploadError.statusCode);
      
      if (uploadError.message.includes('row-level security') || uploadError.message.includes('policy')) {
        console.log('\n⚠️  RLS Politikası Sorunu!');
        console.log('   Çözüm: create-storage-bucket.sql scriptini Supabase Dashboard\'da çalıştırın');
        console.log('   VEYA Supabase Dashboard > Storage > listing_images > Policies');
        console.log('   "Anyone can upload" politikası ekleyin');
      }
      return;
    }

    console.log('✅ Resim başarıyla yüklendi!');
    console.log('   Path:', uploadData.path);

    // 4. Public URL al
    console.log('\n🔗 Public URL alınıyor...');
    const { data: { publicUrl } } = supabase.storage
      .from('listing_images')
      .getPublicUrl(uploadData.path);

    console.log('✅ Public URL:', publicUrl);

    // 5. Resmi listele
    console.log('\n📋 Bucket içeriği listeleniyor...');
    const { data: files, error: listError } = await supabase.storage
      .from('listing_images')
      .list('test', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error('❌ Liste hatası:', listError.message);
    } else {
      console.log(`✅ ${files.length} dosya bulundu`);
      files.forEach(file => {
        console.log(`   - ${file.name} (${(file.metadata.size / 1024).toFixed(2)} KB)`);
      });
    }

    // 6. Test resmini sil
    console.log('\n🗑️  Test resmi siliniyor...');
    const { error: deleteError } = await supabase.storage
      .from('listing_images')
      .remove([uploadData.path]);

    if (deleteError) {
      console.error('❌ Silme hatası:', deleteError.message);
    } else {
      console.log('✅ Test resmi silindi');
    }

    console.log('\n✅ Tüm testler başarılı!');
    console.log('   Resim upload sistemi çalışıyor.');

  } catch (error) {
    console.error('❌ Genel hata:', error);
  }
}

testImageUpload();
