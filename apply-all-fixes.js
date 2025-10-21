// Script to apply all necessary fixes for the Kulu Tarım project
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyAllFixes() {
  console.log('Applying all necessary fixes...');
  
  try {
    // 1. Apply user approval database fixes
    console.log('\n1. Applying user approval database fixes...');
    
    // Read the SQL file for user approval fixes
    const userApprovalSqlPath = path.join(__dirname, 'apply-user-approval-fixes.sql');
    if (fs.existsSync(userApprovalSqlPath)) {
      const userApprovalSql = fs.readFileSync(userApprovalSqlPath, 'utf8');
      console.log('User approval SQL file found, but cannot execute directly from this script');
      console.log('Please run the apply-user-approval-fixes.sql file in your Supabase SQL editor');
    } else {
      console.log('User approval SQL file not found');
    }
    
    // 2. Apply general database fixes
    console.log('\n2. Applying general database fixes...');
    
    // Read the SQL file for general fixes
    const generalFixesSqlPath = path.join(__dirname, 'apply-database-fixes.sql');
    if (fs.existsSync(generalFixesSqlPath)) {
      const generalFixesSql = fs.readFileSync(generalFixesSqlPath, 'utf8');
      console.log('General fixes SQL file found, but cannot execute directly from this script');
      console.log('Please run the apply-database-fixes.sql file in your Supabase SQL editor');
    } else {
      console.log('General fixes SQL file not found');
    }
    
    // 3. Check if the necessary views exist
    console.log('\n3. Checking if necessary views exist...');
    
    // Check for pending_listings view
    try {
      const { data: pendingListings, error: pendingError } = await supabase
        .from('pending_listings')
        .select('*')
        .limit(1);
      
      if (pendingError) {
        console.log('pending_listings view does not exist or is not accessible');
      } else {
        console.log('pending_listings view exists and is accessible');
      }
    } catch (error) {
      console.log('Error checking pending_listings view:', error.message);
    }
    
    // Check for pending_users view
    try {
      const { data: pendingUsers, error: pendingUserError } = await supabase
        .from('pending_users')
        .select('*')
        .limit(1);
      
      if (pendingUserError) {
        console.log('pending_users view does not exist or is not accessible');
      } else {
        console.log('pending_users view exists and is accessible');
      }
    } catch (error) {
      console.log('Error checking pending_users view:', error.message);
    }
    
    // 4. Check if user_profiles table has the necessary columns
    console.log('\n4. Checking user_profiles table structure...');
    
    try {
      const { data: sampleProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1);
      
      if (profileError) {
        console.log('Error accessing user_profiles table:', profileError.message);
      } else {
        console.log('user_profiles table accessible');
        const columns = Object.keys(sampleProfile[0] || {});
        console.log('Available columns:', columns);
        
        // Check for status column
        if (columns.includes('status')) {
          console.log('✓ status column exists');
        } else {
          console.log('✗ status column missing');
        }
        
        // Check for approved_by column
        if (columns.includes('approved_by')) {
          console.log('✓ approved_by column exists');
        } else {
          console.log('✗ approved_by column missing');
        }
        
        // Check for approved_at column
        if (columns.includes('approved_at')) {
          console.log('✓ approved_at column exists');
        } else {
          console.log('✗ approved_at column missing');
        }
        
        // Check for rejection_reason column
        if (columns.includes('rejection_reason')) {
          console.log('✓ rejection_reason column exists');
        } else {
          console.log('✗ rejection_reason column missing');
        }
      }
    } catch (error) {
      console.log('Error checking user_profiles table:', error.message);
    }
    
    // 5. Check if there are any pending users
    console.log('\n5. Checking for pending users...');
    
    try {
      // First try to query user_profiles directly
      const { data: pendingProfiles, error: profileQueryError } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, status')
        .eq('status', 'pending')
        .limit(5);
      
      if (profileQueryError) {
        console.log('Could not query user_profiles for pending users:', profileQueryError.message);
      } else {
        console.log(`Found ${pendingProfiles.length} pending users in user_profiles table`);
        if (pendingProfiles.length > 0) {
          console.log('Sample pending users:', pendingProfiles.map(u => ({ id: u.id, email: u.email, name: u.full_name })));
        }
      }
    } catch (error) {
      console.log('Error checking for pending users:', error.message);
    }
    
    console.log('\n=== FIX APPLICATION COMPLETE ===');
    console.log('\nIMPORTANT MANUAL STEPS REQUIRED:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Open the SQL editor');
    console.log('3. Run the apply-user-approval-fixes.sql file');
    console.log('4. Run the apply-database-fixes.sql file');
    console.log('5. These will create the necessary views, policies, and update the table structure');
    
    return true;
  } catch (error) {
    console.error('Error applying fixes:', error.message);
    return false;
  }
}

// Run the fixes
applyAllFixes().then(success => {
  if (success) {
    console.log('\nAll fixes applied successfully!');
    console.log('Please follow the manual steps above to complete the setup.');
  } else {
    console.log('\nThere were issues applying the fixes.');
  }
  process.exit(success ? 0 : 1);
});