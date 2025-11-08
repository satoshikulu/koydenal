require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Supabase bağlantı testi...\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'YOK');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBucketDirect() {
  try {
    // 1. Direkt bucket bilgisi al
    console.log('\n📦 Bucket bilgisi alınıyor...');
    const { data, error } = await supabase.storage.getBucket('listing_images');
    
    if (error) {
      console.error('❌ Bucket bulunamadı:', error.message);
      console.log('\n💡 Olası nedenler:');
      console.log('   1. Bucket adı yanlış (listing_images olmalı)');
      console.log('   2. API key yetersiz');
      console.log('   3. Bucket başka bir projede');
      return;
    }

    console.log('✅ Bucket bulundu!');
    console.log('   ID:', data.id);
    console.log('   Name:', data.name);
    console.log('   Public:', data.public);
    console.log('   Created:', data.created_at);

    // 2. Test upload
    console.log('\n📤 Test upload...');
    const testFile = Buffer.from('test');
    const fileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('listing_images')
      .upload(fileName, testFile, {
        contentType: 'text/plain'
      });

    if (uploadError) {
      console.error('❌ Upload hatası:', uploadError.message);
      if (uploadError.message.includes('policy')) {
        console.log('\n⚠️  RLS politikası gerekli!');
        console.log('   storage-policies-simple.sql dosyasını çalıştırın');
      }
      return;
    }

    console.log('✅ Upload başarılı!');
    console.log('   Path:', uploadData.path);

    // 3. Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('listing_images')
      .getPublicUrl(uploadData.path);
    
    console.log('✅ Public URL:', publicUrl);

    // 4. Temizlik
    await supabase.storage.from('listing_images').remove([uploadData.path]);
    console.log('✅ Test dosyası silindi');

    console.log('\n🎉 Tüm testler başarılı! Resim upload sistemi hazır.');

  } catch (error) {
    console.error('❌ Hata:', error.message);
  }
}

testBucketDirect();
