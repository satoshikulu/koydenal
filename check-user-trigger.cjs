require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkUserTrigger() {
  console.log('🔍 Kullanıcı trigger kontrolü başlıyor...\n');

  try {
    // 1. Auth kullanıcılarını kontrol et
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('📊 Mevcut kullanıcıları kontrol ediyorum...\n');

    // 2. User profiles tablosunu kontrol et
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (profileError) {
      console.error('❌ User profiles hatası:', profileError);
    } else {
      console.log(`✅ Toplam ${profiles.length} kullanıcı profili bulundu:\n`);
      profiles.forEach(profile => {
        console.log(`  👤 ${profile.full_name || 'İsimsiz'}`);
        console.log(`     📧 ${profile.email}`);
        console.log(`     📱 ${profile.phone || 'Telefon yok'}`);
        console.log(`     📊 Durum: ${profile.status}`);
        console.log(`     🕐 Oluşturulma: ${new Date(profile.created_at).toLocaleString('tr-TR')}\n`);
      });
    }

    // 3. Pending users view'ını kontrol et
    const { data: pendingUsers, error: pendingError } = await supabase
      .from('pending_users')
      .select('*');

    if (pendingError) {
      console.error('❌ Pending users hatası:', pendingError);
    } else {
      console.log(`\n⏳ Bekleyen kullanıcı sayısı: ${pendingUsers.length}`);
      if (pendingUsers.length > 0) {
        console.log('\nBekleyen kullanıcılar:');
        pendingUsers.forEach(user => {
          console.log(`  - ${user.full_name} (${user.email})`);
        });
      }
    }

    // 4. Trigger'ın varlığını kontrol et (admin yetkisi gerekebilir)
    console.log('\n\n🔧 Trigger kontrolü için Supabase Dashboard\'u kontrol edin:');
    console.log('   Database > Functions > handle_new_user');
    console.log('   Database > Triggers > on_auth_user_created');

  } catch (error) {
    console.error('❌ Genel hata:', error);
  }
}

checkUserTrigger();
