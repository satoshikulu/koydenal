require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testNewUserRegistration() {
  console.log('🧪 Yeni kullanıcı kaydı test ediliyor...\n');

  const testUser = {
    email: `testuser${Math.floor(Math.random() * 10000)}@gmail.com`,
    password: 'Test123!',
    full_name: 'Test Kullanıcı',
    phone: '05551234567',
    address: 'Test Adresi'
  };

  try {
    // 1. Yeni kullanıcı kaydı
    console.log('1️⃣ Yeni kullanıcı kaydediliyor...');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Ad: ${testUser.full_name}`);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          full_name: testUser.full_name,
          phone: testUser.phone,
          address: testUser.address
        }
      }
    });

    if (authError) {
      console.error('❌ Kayıt hatası:', authError.message);
      return;
    }

    console.log('✅ Kullanıcı kaydedildi!');
    console.log(`   User ID: ${authData.user?.id}`);

    // 2. Biraz bekle (trigger çalışsın)
    console.log('\n2️⃣ Trigger çalışması bekleniyor...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. User profile kontrolü
    console.log('\n3️⃣ User profile kontrolü...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user?.id)
      .single();

    if (profileError) {
      console.error('❌ Profile bulunamadı:', profileError.message);
      console.log('\n⚠️  SORUN: Trigger çalışmadı! User profile oluşturulmadı.');
      return;
    }

    console.log('✅ User profile bulundu!');
    console.log(`   ID: ${profile.id}`);
    console.log(`   Ad: ${profile.full_name}`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   Telefon: ${profile.phone}`);
    console.log(`   Durum: ${profile.status}`);
    console.log(`   Rol: ${profile.role}`);

    // 4. Pending users view kontrolü
    console.log('\n4️⃣ Pending users view kontrolü...');
    const { data: pendingUsers, error: pendingError } = await supabase
      .from('pending_users')
      .select('*')
      .eq('id', authData.user?.id)
      .single();

    if (pendingError) {
      console.error('❌ Pending users view hatası:', pendingError.message);
    } else {
      console.log('✅ Kullanıcı pending_users view\'ında görünüyor!');
      console.log(`   Ad: ${pendingUsers.full_name}`);
      console.log(`   Email: ${pendingUsers.email}`);
    }

    // 5. Tüm pending kullanıcıları listele
    console.log('\n5️⃣ Tüm bekleyen kullanıcılar...');
    const { data: allPending, error: allPendingError } = await supabase
      .from('pending_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (allPendingError) {
      console.error('❌ Liste hatası:', allPendingError.message);
    } else {
      console.log(`📊 Toplam bekleyen kullanıcı: ${allPending?.length || 0}`);
      if (allPending && allPending.length > 0) {
        allPending.forEach((user, index) => {
          console.log(`\n   ${index + 1}. ${user.full_name} (${user.email})`);
          console.log(`      Durum: ${user.status}`);
          console.log(`      Kayıt: ${new Date(user.created_at).toLocaleString('tr-TR')}`);
        });
      }
    }

    console.log('\n✅ Test başarıyla tamamlandı!');
    console.log('\n💡 Admin paneline giriş yapıp bu kullanıcıyı görebilmelisiniz:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Ad: ${testUser.full_name}`);

  } catch (error) {
    console.error('\n❌ Test hatası:', error.message);
  }
}

testNewUserRegistration();
