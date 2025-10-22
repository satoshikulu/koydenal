require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function cleanupOldAdmin() {
  console.log('🧹 Eski admin kullanıcısı temizleniyor...\n');

  try {
    // Eski admin'i bul
    const { data: oldAdmin, error: findError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'wikadi@gmail.com')
      .single();

    if (findError || !oldAdmin) {
      console.log('✅ Eski admin kullanıcısı bulunamadı (zaten temiz)');
      return;
    }

    console.log('📋 Eski admin bulundu:');
    console.log(`   Email: ${oldAdmin.email}`);
    console.log(`   Ad: ${oldAdmin.full_name}`);
    console.log(`   Rol: ${oldAdmin.role}`);
    console.log(`   Durum: ${oldAdmin.status}`);

    // Normal kullanıcı yap
    console.log('\n🔄 Normal kullanıcı yapılıyor...');
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        role: 'user',
        status: 'approved'
      })
      .eq('id', oldAdmin.id);

    if (updateError) {
      console.error('❌ Güncelleme hatası:', updateError.message);
      return;
    }

    console.log('✅ Kullanıcı normal kullanıcı yapıldı!');
    console.log('\n💡 Bu kullanıcı artık normal bir kullanıcı olarak sistemi kullanabilir.');

  } catch (error) {
    console.error('\n❌ Hata:', error.message);
  }
}

cleanupOldAdmin();
