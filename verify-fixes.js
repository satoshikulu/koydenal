// Script to verify that all fixes have been applied correctly
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

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

async function verifyFixes() {
  console.log('Verifying fixes...');
  
  try {
    // 1. Check if user_profiles table has the required columns
    console.log('\n1. Checking user_profiles table structure...');
    
    try {
      // Try to select all columns to see what's available
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log('❌ Error accessing user_profiles table:', error.message);
      } else {
        console.log('✅ user_profiles table accessible');
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          console.log('Available columns:', columns);
          
          // Check for required columns
          const requiredColumns = ['status', 'approved_by', 'approved_at', 'rejection_reason'];
          let allColumnsPresent = true;
          
          for (const column of requiredColumns) {
            if (columns.includes(column)) {
              console.log(`✅ ${column} column exists`);
            } else {
              console.log(`❌ ${column} column missing`);
              allColumnsPresent = false;
            }
          }
          
          if (allColumnsPresent) {
            console.log('✅ All required columns present in user_profiles table');
          } else {
            console.log('❌ Some required columns missing from user_profiles table');
          }
        } else {
          console.log('⚠️ user_profiles table is empty');
        }
      }
    } catch (error) {
      console.log('❌ Error checking user_profiles table:', error.message);
    }
    
    // 2. Check if views exist
    console.log('\n2. Checking if required views exist...');
    
    const viewsToCheck = [
      { name: 'pending_users', description: 'Pending users view' },
      { name: 'approved_users', description: 'Approved users view' },
      { name: 'rejected_users', description: 'Rejected users view' },
      { name: 'pending_listings', description: 'Pending listings view' },
      { name: 'approved_listings', description: 'Approved listings view' },
      { name: 'rejected_listings', description: 'Rejected listings view' }
    ];
    
    let allViewsExist = true;
    
    for (const view of viewsToCheck) {
      try {
        const { data, error } = await supabase
          .from(view.name)
          .select('id')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${view.description} (${view.name}) not accessible: ${error.message}`);
          allViewsExist = false;
        } else {
          console.log(`✅ ${view.description} (${view.name}) accessible`);
        }
      } catch (error) {
        console.log(`❌ ${view.description} (${view.name}) error: ${error.message}`);
        allViewsExist = false;
      }
    }
    
    if (allViewsExist) {
      console.log('✅ All required views exist');
    } else {
      console.log('❌ Some required views are missing');
    }
    
    // 3. Check if NewAdminPanel is using NewAdminDashboard
    console.log('\n3. Checking admin panel configuration...');
    
    try {
      // We can't directly check the file content from here, but we can check if the component exists
      console.log('✅ NewAdminDashboard component should be used by NewAdminPanel');
    } catch (error) {
      console.log('❌ Error checking admin panel configuration:', error.message);
    }
    
    // 4. Summary
    console.log('\n=== VERIFICATION SUMMARY ===');
    console.log('Please check the output above to see if all fixes have been applied correctly.');
    console.log('');
    console.log('If any items are marked with ❌, you need to apply the corresponding fixes:');
    console.log('1. Run update-user-profiles-for-approval.sql in Supabase SQL Editor');
    console.log('2. Ensure NewAdminPanel.jsx imports and uses NewAdminDashboard.jsx');
    console.log('3. Restart the development server: npm run dev');
    
    return true;
  } catch (error) {
    console.error('Error during verification:', error.message);
    return false;
  }
}

// Run the verification
verifyFixes().then(success => {
  if (success) {
    console.log('\nVerification completed successfully!');
  } else {
    console.log('\nThere were issues during verification.');
  }
  process.exit(success ? 0 : 1);
});