require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Service role key ile admin client oluştur
const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function createAdminUser() {
    console.log('👨‍💼 Admin kullanıcısı oluşturuluyor...\n');

    const adminEmail = 'satoshinakamototokyo42@gmail.com';
    const adminPassword = 'Sevimbebe4242.';
    const adminName = 'Admin Kullanıcı';

    try {
        // 1. Önce bu email ile kullanıcı var mı kontrol et
        console.log('1️⃣ Mevcut admin kontrolü...');
        const { data: existingUser } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('email', adminEmail)
            .single();

        if (existingUser) {
            console.log('⚠️  Bu email ile kullanıcı zaten var!');
            console.log(`   Durum: ${existingUser.status}`);
            console.log(`   Rol: ${existingUser.role}`);

            if (existingUser.role !== 'admin') {
                console.log('\n2️⃣ Kullanıcıyı admin yapılıyor...');
                const { error: updateError } = await supabaseAdmin
                    .from('user_profiles')
                    .update({
                        role: 'admin',
                        status: 'approved',
                        approved_at: new Date().toISOString()
                    })
                    .eq('id', existingUser.id);

                if (updateError) {
                    console.error('❌ Admin yapma hatası:', updateError.message);
                } else {
                    console.log('✅ Kullanıcı admin yapıldı!');
                    console.log(`\n📧 Email: ${adminEmail}`);
                    console.log(`🔑 Şifre: Mevcut şifreniz`);
                }
            } else {
                console.log('✅ Kullanıcı zaten admin!');
            }
            return;
        }

        // 2. Yeni admin kullanıcısı oluştur
        console.log('2️⃣ Yeni admin kullanıcısı oluşturuluyor...');
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
            user_metadata: {
                full_name: adminName,
                phone: '05551234567',
                address: 'Admin Adresi'
            }
        });

        if (authError) {
            console.error('❌ Auth kullanıcısı oluşturma hatası:', authError.message);
            return;
        }

        console.log('✅ Auth kullanıcısı oluşturuldu!');

        // 3. User profile'ı admin yap
        console.log('\n3️⃣ Kullanıcı profili admin yapılıyor...');
        const { error: updateError } = await supabaseAdmin
            .from('user_profiles')
            .update({
                role: 'admin',
                status: 'approved',
                approved_at: new Date().toISOString()
            })
            .eq('id', authData.user.id);

        if (updateError) {
            console.error('❌ Profil güncelleme hatası:', updateError.message);
            return;
        }

        console.log('✅ Admin kullanıcısı başarıyla oluşturuldu!\n');
        console.log('═══════════════════════════════════════');
        console.log('📧 Email:', adminEmail);
        console.log('🔑 Şifre:', adminPassword);
        console.log('═══════════════════════════════════════');
        console.log('\n⚠️  Bu bilgileri güvenli bir yerde saklayın!');
        console.log('💡 Admin paneline giriş yapmak için /admin-login sayfasını kullanın');

    } catch (error) {
        console.error('\n❌ Hata:', error.message);
    }
}

// Alternatif: Mevcut bir kullanıcıyı admin yap
async function makeUserAdmin(email) {
    console.log(`👨‍💼 ${email} kullanıcısı admin yapılıyor...\n`);

    try {
        const { data: user, error: findError } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('email', email)
            .single();

        if (findError || !user) {
            console.error('❌ Kullanıcı bulunamadı!');
            return;
        }

        const { error: updateError } = await supabaseAdmin
            .from('user_profiles')
            .update({
                role: 'admin',
                status: 'approved',
                approved_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('❌ Güncelleme hatası:', updateError.message);
            return;
        }

        console.log('✅ Kullanıcı başarıyla admin yapıldı!');
        console.log(`\n📧 Email: ${email}`);
        console.log(`👤 Ad: ${user.full_name}`);
        console.log(`🔑 Şifre: Mevcut şifreniz`);

    } catch (error) {
        console.error('\n❌ Hata:', error.message);
    }
}

// Komut satırı argümanlarını kontrol et
const args = process.argv.slice(2);
if (args.length > 0 && args[0] === '--make-admin' && args[1]) {
    makeUserAdmin(args[1]);
} else {
    createAdminUser();
}
