require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function listAllBuckets() {
  console.log('🔍 Tüm bucket\'ları listeliyorum...\n');

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Hata:', error.message);
      return;
    }

    if (!buckets || buckets.length === 0) {
      console.log('❌ Hiç bucket bulunamadı!');
      console.log('\n💡 Supabase Dashboard\'da bucket oluşturun:');
      console.log('   Storage > New bucket > listing_images');
      return;
    }

    console.log(`✅ ${buckets.length} bucket bulundu:\n`);
    buckets.forEach((bucket, index) => {
      console.log(`${index + 1}. ${bucket.id}`);
      console.log(`   Name: ${bucket.name}`);
      console.log(`   Public: ${bucket.public}`);
      console.log(`   Created: ${bucket.created_at}`);
      console.log('');
    });

    // listing_images var mı kontrol et
    const listingBucket = buckets.find(b => b.id === 'listing_images' || b.name === 'listing_images');
    if (listingBucket) {
      console.log('✅ listing_images bucket bulundu!');
    } else {
      console.log('❌ listing_images bucket bulunamadı!');
      console.log('   Mevcut bucket adları:', buckets.map(b => b.id).join(', '));
    }

  } catch (error) {
    console.error('❌ Hata:', error.message);
  }
}

listAllBuckets();
