#!/usr/bin/env node

// Admin kullanıcısı kontrol scripti
// Kullanım: node check-admin-user.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Environment variables eksik!');
  console.log('Gerekli: VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminUser() {
  console.log('🔍 Admin kullanıcısı kontrol ediliyor...');

  try {
    // 1. Auth ile admin kullanıcısı var mı kontrol et
    console.log('\n1️⃣ Auth kullanıcıları kontrolü:');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Auth error:', authError);
    } else {
      console.log(`✅ Toplam ${authUsers.users.length} kullanıcı`);

      const adminAuth = authUsers.users.find(u => u.email === 'satoshinakamototokyo42@gmail.com');
      if (adminAuth) {
        console.log('✅ Admin auth kullanıcısı mevcut:', adminAuth.email);
      } else {
        console.log('❌ Admin auth kullanıcısı bulunamadı');
      }
    }

    // 2. user_profiles tablosunu kontrol et
    console.log('\n2️⃣ user_profiles tablosu kontrolü:');
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*');

    if (profileError) {
      console.error('❌ Profile error:', profileError);
    } else {
      console.log(`✅ Toplam ${profiles.length} profil`);

      const adminProfile = profiles.find(p => p.email === 'satoshinakamototokyo42@gmail.com');
      if (adminProfile) {
        console.log('✅ Admin profil mevcut:');
        console.log(`   - ID: ${adminProfile.id}`);
        console.log(`   - Email: ${adminProfile.email}`);
        console.log(`   - Role: ${adminProfile.role}`);
        console.log(`   - Status: ${adminProfile.status}`);
        console.log(`   - Full Name: ${adminProfile.full_name}`);

        if (adminProfile.role !== 'admin') {
          console.log('⚠️  Role admin değil:', adminProfile.role);
        }
        if (adminProfile.status !== 'approved') {
          console.log('⚠️  Status approved değil:', adminProfile.status);
        }
      } else {
        console.log('❌ Admin profil bulunamadı');

        // Mevcut profilleri listele
        console.log('\nMevcut profiller:');
        profiles.forEach(p => {
          console.log(`   - ${p.email} (${p.role}, ${p.status})`);
        });
      }
    }

    // 3. Admin kullanıcısı yoksa oluştur
    if (!adminProfile) {
      console.log('\n3️⃣ Admin kullanıcısı oluşturuluyor...');

      // Önce auth kullanıcısı oluştur
      const { data: newAuth, error: createAuthError } = await supabase.auth.admin.createUser({
        email: 'satoshinakamototokyo42@gmail.com',
        password: 'Sevimbebe4242.',
        email_confirm: true,
        user_metadata: {
          full_name: 'Admin User'
        }
      });

      if (createAuthError) {
        console.error('❌ Auth create error:', createAuthError);
      } else {
        console.log('✅ Auth kullanıcısı oluşturuldu:', newAuth.user.email);

        // Profile oluştur
        const { data: newProfile, error: createProfileError } = await supabase
          .from('user_profiles')
          .insert({
            id: newAuth.user.id,
            email: 'satoshinakamototokyo42@gmail.com',
            full_name: 'Admin User',
            role: 'admin',
            status: 'approved',
            phone: '05551234567'
          });

        if (createProfileError) {
          console.error('❌ Profile create error:', createProfileError);
        } else {
          console.log('✅ Admin profil oluşturuldu!');
          console.log('✅ Admin kullanıcısı hazır!');
        }
      }
    }

  } catch (error) {
    console.error('❌ Genel hata:', error);
  }
}

checkAdminUser();
