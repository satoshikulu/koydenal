// admin-panel-test.cjs - Admin paneli testi
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pwnrlllwwzpjcsevwpvr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bnJsbGx3d3pwamNzZXZ3cHZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjE1OTMsImV4cCI6MjA3NTU5NzU5M30.Bmn1m_uXmrXn8fA3-tTw2ivvF8-_Z9WryX40NCfSY4M';

console.log('🔧 ADMIN PANELİ ERİŞİM TESTİ');
console.log('==============================\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAdminAccess() {
  try {
    console.log('🔍 Admin erişimi test ediliyor...\n');

    // 1. Admin kullanıcısı kontrolü
    console.log('1️⃣ Admin kullanıcısı kontrolü:');
    const { data: adminUsers, error: adminError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'admin');

    if (adminError) {
      console.log(`   ❌ Admin kullanıcı sorgusu başarısız: ${adminError.message}`);
    } else if (adminUsers && adminUsers.length > 0) {
      console.log(`   ✅ ${adminUsers.length} admin kullanıcısı bulundu`);
      adminUsers.forEach(admin => {
        console.log(`      📧 ${admin.email} - ${admin.full_name}`);
      });
    } else {
      console.log('   ⚠️  Admin kullanıcısı bulunamadı - manuel oluşturma gerekli');
    }

    // 2. İlanları kontrol et
    console.log('\n2️⃣ İlanları kontrolü:');
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('status, COUNT(*) as count')
      .group('status');

    if (listingsError) {
      console.log(`   ❌ İlan sorgusu başarısız: ${listingsError.message}`);
    } else if (listings && listings.length > 0) {
      console.log('   ✅ İlanlar mevcut:');
      listings.forEach(listing => {
        console.log(`      ${listing.status}: ${listing.count} adet`);
      });
    } else {
      console.log('   ℹ️  Henüz ilan bulunamadı');
    }

    // 3. Admin şifresi kontrolü
    console.log('\n3️⃣ Admin şifresi kontrolü:');
    console.log('   🔑 .env dosyasındaki şifre: Sevimbebe4242.');
    console.log('   💡 Bu şifreyi admin panelinde kullanın');

    console.log('\n📋 ADMIN PANELİ ERİŞİM ADIMLARI:');
    console.log('================================');
    console.log('1️⃣  Tarayıcıda açın: http://localhost:5173/admin');
    console.log('2️⃣  Admin şifresi girin: Sevimbebe4242.');
    console.log('3️⃣  "Admin Girişi" butonuna tıklayın');
    console.log('4️⃣  İlan yönetimi paneli açılacak');

    console.log('\n🚨 SORUN GİDERME:');
    console.log('================');
    console.log('• Eğer hala yüklenmiyorsa sayfayı yenileyin (F5)');
    console.log('• Console\'da hata mesajlarını kontrol edin (F12)');
    console.log('• İnternet bağlantınızı kontrol edin');

    console.log('\n✅ TEST TAMAMLANDI');

  } catch (err) {
    console.log('❌ Genel test hatası:', err.message);
  }
}

testAdminAccess();
