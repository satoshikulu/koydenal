// Script to apply database fixes
// Run with: node apply-fixes.js

import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
// Note: For production, use the service role key instead of anon key
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFixes() {
  console.log('Applying database fixes...');
  
  try {
    // 1. Ensure RLS is enabled on all tables
    console.log('Enabling RLS on tables...');
    await supabase.rpc('exec_sql', { sql: 'ALTER TABLE categories ENABLE ROW LEVEL SECURITY;' });
    await supabase.rpc('exec_sql', { sql: 'ALTER TABLE listings ENABLE ROW LEVEL SECURITY;' });
    await supabase.rpc('exec_sql', { sql: 'ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;' });
    await supabase.rpc('exec_sql', { sql: 'ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;' });
    
    // 2. Recreate policies
    console.log('Recreating policies...');
    
    // Categories policies
    await supabase.rpc('exec_sql', { 
      sql: `DROP POLICY IF EXISTS "Herkes kategorileri görüntüleyebilir" ON categories;` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `CREATE POLICY "Herkes kategorileri görüntüleyebilir" ON categories FOR SELECT USING (true);` 
    });
    
    // Listings policies
    await supabase.rpc('exec_sql', { 
      sql: `DROP POLICY IF EXISTS "Herkes onaylanmış ilanları görüntüleyebilir" ON listings;` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `CREATE POLICY "Herkes onaylanmış ilanları görüntüleyebilir" ON listings FOR SELECT USING (status = 'approved');` 
    });
    
    await supabase.rpc('exec_sql', { 
      sql: `DROP POLICY IF EXISTS "Kullanıcılar kendi ilanlarını görüntüleyebilir" ON listings;` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `CREATE POLICY "Kullanıcılar kendi ilanlarını görüntüleyebilir" ON listings FOR SELECT USING (auth.uid() = user_id);` 
    });
    
    await supabase.rpc('exec_sql', { 
      sql: `DROP POLICY IF EXISTS "Kullanıcılar kendi ilanlarını oluşturabilir" ON listings;` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `CREATE POLICY "Kullanıcılar kendi ilanlarını oluşturabilir" ON listings FOR INSERT WITH CHECK (auth.uid() = user_id);` 
    });
    
    await supabase.rpc('exec_sql', { 
      sql: `DROP POLICY IF EXISTS "Kullanıcılar kendi ilanlarını güncelleyebilir" ON listings;` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `CREATE POLICY "Kullanıcılar kendi ilanlarını güncelleyebilir" ON listings FOR UPDATE USING (auth.uid() = user_id);` 
    });
    
    await supabase.rpc('exec_sql', { 
      sql: `DROP POLICY IF EXISTS "Adminler tüm ilanları görüntüleyebilir" ON listings;` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `CREATE POLICY "Adminler tüm ilanları görüntüleyebilir" ON listings FOR SELECT USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'));` 
    });
    
    await supabase.rpc('exec_sql', { 
      sql: `DROP POLICY IF EXISTS "Adminler tüm ilanları güncelleyebilir" ON listings;` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `CREATE POLICY "Adminler tüm ilanları güncelleyebilir" ON listings FOR UPDATE USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'));` 
    });
    
    // User profiles policies
    await supabase.rpc('exec_sql', { 
      sql: `DROP POLICY IF EXISTS "Herkes profilleri görüntüleyebilir" ON user_profiles;` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `CREATE POLICY "Herkes profilleri görüntüleyebilir" ON user_profiles FOR SELECT USING (true);` 
    });
    
    await supabase.rpc('exec_sql', { 
      sql: `DROP POLICY IF EXISTS "Kullanıcılar kendi profillerini güncelleyebilir" ON user_profiles;` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `CREATE POLICY "Kullanıcılar kendi profillerini güncelleyebilir" ON user_profiles FOR UPDATE USING (auth.uid() = id);` 
    });
    
    // Admin actions policies
    await supabase.rpc('exec_sql', { 
      sql: `DROP POLICY IF EXISTS "Adminler işlemleri görüntüleyebilir" ON admin_actions;` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `CREATE POLICY "Adminler işlemleri görüntüleyebilir" ON admin_actions FOR SELECT USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'));` 
    });
    
    await supabase.rpc('exec_sql', { 
      sql: `DROP POLICY IF EXISTS "Adminler işlem ekleyebilir" ON admin_actions;` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `CREATE POLICY "Adminler işlem ekleyebilir" ON admin_actions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'));` 
    });
    
    // 3. Recreate views
    console.log('Recreating views...');
    
    await supabase.rpc('exec_sql', { 
      sql: `DROP VIEW IF EXISTS pending_listings;` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `CREATE OR REPLACE VIEW pending_listings AS SELECT l.id, l.title, l.description, l.price, l.currency, l.location, c.name as category_name, l.listing_type, l.quantity, l.unit, l.contact_phone, l.contact_email, l.contact_person, l.images, l.main_image, l.user_id, up.full_name as user_name, up.email as user_email, up.phone as user_phone, l.created_at, l.updated_at FROM listings l LEFT JOIN categories c ON l.category_id = c.id LEFT JOIN user_profiles up ON l.user_id = up.id WHERE l.status = 'pending' ORDER BY l.created_at DESC;` 
    });
    
    await supabase.rpc('exec_sql', { 
      sql: `DROP VIEW IF EXISTS approved_listings;` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `CREATE OR REPLACE VIEW approved_listings AS SELECT l.id, l.title, l.description, l.price, l.currency, l.location, c.name as category_name, l.listing_type, l.quantity, l.unit, l.contact_phone, l.contact_email, l.contact_person, l.images, l.main_image, l.user_id, up.full_name as user_name, l.created_at, l.updated_at FROM listings l LEFT JOIN categories c ON l.category_id = c.id LEFT JOIN user_profiles up ON l.user_id = up.id WHERE l.status = 'approved' ORDER BY l.created_at DESC;` 
    });
    
    await supabase.rpc('exec_sql', { 
      sql: `DROP VIEW IF EXISTS rejected_listings;` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `CREATE OR REPLACE VIEW rejected_listings AS SELECT l.id, l.title, l.description, l.price, l.currency, l.location, c.name as category_name, l.listing_type, l.quantity, l.unit, l.contact_phone, l.contact_email, l.contact_person, l.images, l.main_image, l.user_id, up.full_name as user_name, l.rejection_reason, l.created_at, l.updated_at FROM listings l LEFT JOIN categories c ON l.category_id = c.id LEFT JOIN user_profiles up ON l.user_id = up.id WHERE l.status = 'rejected' ORDER BY l.created_at DESC;` 
    });
    
    // 4. Update permissions
    console.log('Updating permissions...');
    
    await supabase.rpc('exec_sql', { 
      sql: `GRANT SELECT ON categories TO anon;` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `GRANT SELECT ON approved_listings TO anon;` 
    });
    
    await supabase.rpc('exec_sql', { 
      sql: `GRANT SELECT, INSERT, UPDATE ON listings TO authenticated;` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `GRANT SELECT, UPDATE ON user_profiles TO authenticated;` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `GRANT SELECT ON categories TO authenticated;` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `GRANT SELECT ON pending_listings TO authenticated;` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `GRANT SELECT ON approved_listings TO authenticated;` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `GRANT SELECT ON rejected_listings TO authenticated;` 
    });
    
    await supabase.rpc('exec_sql', { 
      sql: `GRANT ALL ON listings TO authenticated;` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `GRANT ALL ON admin_actions TO authenticated;` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `GRANT ALL ON categories TO authenticated;` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `GRANT ALL ON user_profiles TO authenticated;` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `GRANT ALL ON pending_listings TO authenticated;` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `GRANT ALL ON approved_listings TO authenticated;` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `GRANT ALL ON rejected_listings TO authenticated;` 
    });
    
    console.log('Database fixes applied successfully!');
    
  } catch (error) {
    console.error('Error applying fixes:', error);
  }
}

// Run the fixes
applyFixes();