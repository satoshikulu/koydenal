require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testAdminPendingUsers() {
  console.log('🔍 Admin Dashboard pending users testi...\n');

  try {
    // Admin olarak giriş yap
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'satoshinakamototokyo42@gmail.com',
      password: 'Sevimbebe4242.'
    });

    if (authError) {
      console.error('❌ Admin girişi başarısız:', authError.message);
      return;
    }

    console.log('✅ Admin olarak giriş yapıldı\n');

    // 1. pending_users view'ından veri çek (Dashboard'ın yaptığı gibi)
    console.log('📊 pending_users view\'ından veri çekiliyor...');
    const { data: pendingUsers, error: pendingError } = await supabase
      .from('pending_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (pendingError) {
      console.error('❌ Pending users hatası:', pendingError);
      console.error('   Hata detayı:', JSON.stringify(pendingError, null, 2));
    } else {
      console.log(`✅ ${pendingUsers.length} bekleyen kullanıcı bulundu:\n`);
      pendingUsers.forEach(user => {
        console.log(`  👤 ${user.full_name}`);
        console.log(`     📧 ${user.email}`);
        console.log(`     📱 ${user.phone || 'Telefon yok'}`);
        console.log(`     🕐 ${new Date(user.created_at).toLocaleString('tr-TR')}\n`);
      });
    }

    // 2. user_profiles tablosundan direkt çek
    console.log('\n📊 user_profiles tablosundan direkt çekiliyor...');
    const { data: directUsers, error: directError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (directError) {
      console.error('❌ Direct query hatası:', directError);
    } else {
      console.log(`✅ ${directUsers.length} bekleyen kullanıcı bulundu (direkt sorgu)\n`);
    }

    // 3. View'ın varlığını kontrol et
    console.log('\n🔍 pending_users view kontrolü...');
    const { data: viewCheck, error: viewError } = await supabase
      .rpc('check_view_exists', { view_name: 'pending_users' })
      .single();

    if (viewError) {
      console.log('⚠️  View kontrolü yapılamadı (bu normal olabilir)');
    }

    // Çıkış yap
    await supabase.auth.signOut();
    console.log('\n✅ Test tamamlandı');

  } catch (error) {
    console.error('❌ Genel hata:', error);
  }
}

testAdminPendingUsers();
