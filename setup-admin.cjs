require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function setupAdmin() {
  console.log('👨‍💼 Admin kurulumu yapılıyor...\n');

  const newAdminEmail = 'satoshinakamototokyo42@gmail.com';
  const newAdminPassword = 'Sevimbebe4242.';

  try {
    // 1. Önce yeni admin email ile kayıt olalım
    console.log('1️⃣ Yeni admin kullanıcısı kaydediliyor...');
    console.log(`   Email: ${newAdminEmail}`);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: newAdminEmail,
      password: newAdminPassword,
      options: {
        data: {
          full_name: 'Admin Kullanıcı',
          phone: '05551234567',
          address: 'Admin Adresi'
        }
      }
    });

    if (authError) {
      console.error('❌ Kayıt hatası:', authError.message);
      
      // Eğer kullanıcı zaten varsa, onu admin yap
      if (authError.message.includes('already registered')) {
        console.log('\n⚠️  Kullanıcı zaten kayıtlı, admin yapılıyor...');
        
        // Önce giriş yap
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: newAdminEmail,
          password: newAdminPassword
        });

        if (loginError) {
          console.error('❌ Giriş hatası:', loginError.message);
          console.log('\n💡 Lütfen Supabase Dashboard\'dan bu kullanıcıyı manuel olarak admin yapın:');
          console.log(`   Email: ${newAdminEmail}`);
          console.log('   user_profiles tablosunda role = \'admin\' ve status = \'approved\' yapın');
          return;
        }

        // Admin yap
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ 
            role: 'admin',
            status: 'approved',
            approved_at: new Date().toISOString()
          })
          .eq('id', loginData.user.id);

        if (updateError) {
          console.error('❌ Admin yapma hatası:', updateError.message);
          console.log('\n💡 Lütfen Supabase Dashboard\'dan bu kullanıcıyı manuel olarak admin yapın:');
          console.log(`   Email: ${newAdminEmail}`);
          console.log('   user_profiles tablosunda role = \'admin\' ve status = \'approved\' yapın');
          return;
        }

        console.log('✅ Kullanıcı admin yapıldı!');
      }
      return;
    }

    console.log('✅ Kullanıcı kaydedildi!');
    console.log(`   User ID: ${authData.user?.id}`);

    // 2. Biraz bekle (trigger çalışsın)
    console.log('\n2️⃣ Trigger çalışması bekleniyor...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Admin yap
    console.log('\n3️⃣ Kullanıcı admin yapılıyor...');
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        role: 'admin',
        status: 'approved',
        approved_at: new Date().toISOString()
      })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('❌ Admin yapma hatası:', updateError.message);
      console.log('\n💡 Lütfen Supabase Dashboard\'dan bu kullanıcıyı manuel olarak admin yapın:');
      console.log(`   User ID: ${authData.user.id}`);
      console.log(`   Email: ${newAdminEmail}`);
      console.log('   user_profiles tablosunda role = \'admin\' ve status = \'approved\' yapın');
      return;
    }

    console.log('✅ Admin kullanıcısı başarıyla oluşturuldu!\n');
    console.log('═══════════════════════════════════════');
    console.log('📧 Email:', newAdminEmail);
    console.log('🔑 Şifre:', newAdminPassword);
    console.log('═══════════════════════════════════════');
    console.log('\n💡 Admin paneline giriş yapmak için:');
    console.log('   1. /admin-login sayfasına gidin');
    console.log('   2. Bu bilgilerle giriş yapın');

    // 4. Eski admin'i normal kullanıcı yap (opsiyonel)
    console.log('\n4️⃣ Eski admin kullanıcısı kontrol ediliyor...');
    const { data: oldAdmin } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'wikadi@gmail.com')
      .single();

    if (oldAdmin && oldAdmin.role === 'admin') {
      console.log('   Eski admin bulundu: wikadi@gmail.com');
      console.log('   Bu kullanıcıyı normal kullanıcı yapmak ister misiniz?');
      console.log('   (Manuel olarak değiştirebilirsiniz)');
    }

  } catch (error) {
    console.error('\n❌ Hata:', error.message);
  }
}

setupAdmin();
