require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testUserRegistration() {
  console.log('🔍 Kullanıcı kayıt sistemi test ediliyor...\n');

  try {
    // 1. Trigger fonksiyonunu kontrol et (atlandı - doğrudan kullanıcı kontrolüne geç)
    console.log('1️⃣ Trigger kontrolü atlandı, doğrudan kullanıcı verilerine bakılıyor...');

    // 2. Mevcut kullanıcıları kontrol et
    console.log('\n2️⃣ Mevcut kullanıcılar kontrol ediliyor...');
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Kullanıcılar alınamadı:', usersError.message);
    } else {
      console.log(`📊 Toplam kullanıcı sayısı: ${users?.length || 0}`);
      
      if (users && users.length > 0) {
        console.log('\n📋 Son 5 kullanıcı:');
        users.slice(0, 5).forEach((user, index) => {
          console.log(`\n${index + 1}. Kullanıcı:`);
          console.log(`   ID: ${user.id}`);
          console.log(`   Ad: ${user.full_name}`);
          console.log(`   Email: ${user.email}`);
          console.log(`   Telefon: ${user.phone || 'Yok'}`);
          console.log(`   Durum: ${user.status}`);
          console.log(`   Rol: ${user.role}`);
          console.log(`   Kayıt: ${new Date(user.created_at).toLocaleString('tr-TR')}`);
        });
      }
    }

    // 3. Pending kullanıcıları kontrol et
    console.log('\n3️⃣ Bekleyen kullanıcılar kontrol ediliyor...');
    const { data: pendingUsers, error: pendingError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (pendingError) {
      console.error('❌ Bekleyen kullanıcılar alınamadı:', pendingError.message);
    } else {
      console.log(`⏳ Bekleyen kullanıcı sayısı: ${pendingUsers?.length || 0}`);
      
      if (pendingUsers && pendingUsers.length > 0) {
        console.log('\n📋 Bekleyen kullanıcılar:');
        pendingUsers.forEach((user, index) => {
          console.log(`\n${index + 1}. ${user.full_name} (${user.email})`);
          console.log(`   Kayıt tarihi: ${new Date(user.created_at).toLocaleString('tr-TR')}`);
        });
      }
    }

    // 4. Pending users view'ı kontrol et
    console.log('\n4️⃣ Pending users view kontrol ediliyor...');
    const { data: pendingView, error: viewError } = await supabase
      .from('pending_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (viewError) {
      console.error('❌ Pending users view hatası:', viewError.message);
    } else {
      console.log(`✅ Pending users view çalışıyor: ${pendingView?.length || 0} kayıt`);
    }

    // 5. Admin kullanıcısı var mı kontrol et
    console.log('\n5️⃣ Admin kullanıcısı kontrolü...');
    const { data: admins, error: adminError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'admin');

    if (adminError) {
      console.error('❌ Admin kontrolü hatası:', adminError.message);
    } else {
      console.log(`👨‍💼 Admin sayısı: ${admins?.length || 0}`);
      if (admins && admins.length > 0) {
        admins.forEach(admin => {
          console.log(`   - ${admin.full_name} (${admin.email})`);
        });
      } else {
        console.log('⚠️  Hiç admin kullanıcısı yok!');
      }
    }

    console.log('\n✅ Test tamamlandı!');

  } catch (error) {
    console.error('\n❌ Test hatası:', error.message);
  }
}

testUserRegistration();
