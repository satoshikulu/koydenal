require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Service role key gerekli (admin işlemleri için)
// Eğer yoksa, Supabase Dashboard'dan manuel kontrol edilmeli

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkAdminEmailStatus() {
  console.log('🔍 Admin email durumu kontrolü...\n');

  try {
    // Admin profili kontrol et
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'satoshinakamototokyo42@gmail.com')
      .single();

    if (profileError) {
      console.error('❌ Profil bulunamadı:', profileError.message);
      return;
    }

    console.log('✅ Admin Profili Bulundu:');
    console.log('   📧 Email:', profile.email);
    console.log('   👤 İsim:', profile.full_name);
    console.log('   🎭 Rol:', profile.role);
    console.log('   📊 Durum:', profile.status);
    console.log('   🆔 ID:', profile.id);
    console.log('   📅 Oluşturulma:', new Date(profile.created_at).toLocaleString('tr-TR'));

    // Giriş testi
    console.log('\n🔐 Giriş testi yapılıyor...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'satoshinakamototokyo42@gmail.com',
      password: 'Sevimbebe4242.'
    });

    if (authError) {
      console.error('❌ Giriş başarısız:', authError.message);
      
      if (authError.message.includes('Email not confirmed')) {
        console.log('\n⚠️  Email onaylanmamış!');
        console.log('   Çözüm: Supabase Dashboard > Authentication > Users');
        console.log('   Admin kullanıcısını bulun ve "Confirm email" butonuna tıklayın');
      } else if (authError.message.includes('Invalid login credentials')) {
        console.log('\n⚠️  Email veya şifre yanlış!');
        console.log('   Email: satoshinakamototokyo42@gmail.com');
        console.log('   Şifre: Sevimbebe4242. (nokta dahil!)');
      }
    } else {
      console.log('✅ Giriş başarılı!');
      console.log('   🆔 User ID:', authData.user.id);
      console.log('   📧 Email:', authData.user.email);
      console.log('   ✉️  Email Confirmed:', authData.user.email_confirmed_at ? 'Evet' : 'Hayır');
      
      // Çıkış yap
      await supabase.auth.signOut();
      console.log('\n✅ Test tamamlandı - Admin girişi çalışıyor!');
    }

  } catch (error) {
    console.error('❌ Genel hata:', error);
  }
}

checkAdminEmailStatus();
