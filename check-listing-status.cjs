require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkListingStatus() {
  console.log('🔍 İlan durumlarını kontrol ediyorum...\n');

  try {
    // Son 5 ilanı al
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, title, status, main_image, images, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Hata:', error.message);
      return;
    }

    console.log(`📋 Son ${listings.length} ilan:\n`);
    
    listings.forEach((listing, index) => {
      console.log(`${index + 1}. ${listing.title}`);
      console.log(`   Status: ${listing.status}`);
      console.log(`   Main Image: ${listing.main_image ? 'VAR' : 'YOK'}`);
      console.log(`   Images: ${listing.images ? listing.images.length : 0} resim`);
      console.log(`   Created: ${new Date(listing.created_at).toLocaleString('tr-TR')}`);
      console.log('');
    });

    // Pending ilanlar
    const pendingCount = listings.filter(l => l.status === 'pending').length;
    const approvedCount = listings.filter(l => l.status === 'approved').length;

    console.log(`📊 Özet:`);
    console.log(`   Pending: ${pendingCount}`);
    console.log(`   Approved: ${approvedCount}`);

    console.log('\n💡 Not:');
    console.log('   - "pending" ilanlar admin onayı bekliyor');
    console.log('   - "approved" ilanlar yayında');
    console.log('   - Sadece "approved" ilanlar ana sayfada görünür');

  } catch (error) {
    console.error('❌ Genel hata:', error);
  }
}

checkListingStatus();
