require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testPendingViewAccess() {
  console.log('🔍 Pending users view erişim testi...\n');

  try {
    // 1. Giriş yapmadan pending_users'a eriş
    console.log('📊 Test 1: Giriş yapmadan pending_users view...');
    const { data: data1, error: error1 } = await supabase
      .from('pending_users')
      .select('*');

    if (error1) {
      console.error('❌ Hata:', error1.message);
      console.error('   Kod:', error1.code);
      console.error('   Detay:', error1.details);
    } else {
      console.log(`✅ ${data1.length} kayıt bulundu (giriş yapmadan)\n`);
    }

    // 2. Giriş yapmadan user_profiles'a eriş
    console.log('📊 Test 2: Giriş yapmadan user_profiles tablosu...');
    const { data: data2, error: error2 } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('status', 'pending');

    if (error2) {
      console.error('❌ Hata:', error2.message);
      console.error('   Kod:', error2.code);
    } else {
      console.log(`✅ ${data2.length} kayıt bulundu (giriş yapmadan)\n`);
    }

    // 3. Normal kullanıcı olarak giriş yap ve dene
    console.log('📊 Test 3: Normal kullanıcı olarak giriş...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'sevimbebe@gmail.com',
      password: 'test123'
    });

    if (authError) {
      console.error('❌ Giriş hatası:', authError.message);
    } else {
      console.log('✅ Giriş başarılı\n');

      const { data: data3, error: error3 } = await supabase
        .from('pending_users')
        .select('*');

      if (error3) {
        console.error('❌ Pending users hatası:', error3.message);
      } else {
        console.log(`✅ ${data3.length} kayıt bulundu (normal kullanıcı)\n`);
      }

      await supabase.auth.signOut();
    }

    console.log('\n💡 Çözüm önerileri:');
    console.log('   1. pending_users view\'ı için RLS politikası ekleyin');
    console.log('   2. View\'ı SECURITY DEFINER ile oluşturun');
    console.log('   3. Admin rolü kontrolü ekleyin');

  } catch (error) {
    console.error('❌ Genel hata:', error);
  }
}

testPendingViewAccess();
