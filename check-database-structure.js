// Script to check the actual database structure
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

async function checkDatabaseStructure() {
  console.log('Checking database structure...');
  
  try {
    // 1. Check user_profiles table structure
    console.log('\n1. Checking user_profiles table structure...');
    
    // Try to get table info using a simple query
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log('Error querying user_profiles:', error.message);
        // Try to get just the column names
        try {
          const { data: columns, error: columnError } = await supabase
            .from('user_profiles')
            .select('id')
            .limit(1);
          
          if (columnError) {
            console.log('Error getting even basic columns:', columnError.message);
          } else {
            console.log('Basic query works, but specific columns might be missing');
          }
        } catch (basicError) {
          console.log('Basic query also failed:', basicError.message);
        }
      } else {
        console.log('user_profiles table accessible');
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          console.log('Columns in user_profiles:', columns);
        } else {
          console.log('user_profiles table is empty or inaccessible');
        }
      }
    } catch (queryError) {
      console.log('Error with user_profiles query:', queryError.message);
    }
    
    // 2. Check if auth.users table is accessible
    console.log('\n2. Checking auth.users table...');
    
    try {
      const { data: authData, error: authError } = await supabase
        .from('users')
        .select('id, email')
        .limit(1);
      
      if (authError) {
        console.log('Cannot access auth.users directly (expected):', authError.message);
      } else {
        console.log('auth.users accessible:', authData);
      }
    } catch (authError) {
      console.log('Error checking auth.users:', authError.message);
    }
    
    // 3. Check what tables exist
    console.log('\n3. Checking available tables...');
    
    // We can't directly list tables, but we can try common ones
    const tablesToCheck = ['user_profiles', 'listings', 'categories', 'admin_actions'];
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        if (error) {
          console.log(`${table}: Not accessible - ${error.message}`);
        } else {
          console.log(`${table}: Accessible`);
        }
      } catch (error) {
        console.log(`${table}: Error - ${error.message}`);
      }
    }
    
    // 4. Try to check if views exist by attempting to query them
    console.log('\n4. Checking views...');
    
    const viewsToCheck = ['pending_listings', 'approved_listings', 'rejected_listings', 'pending_users', 'approved_users', 'rejected_users'];
    
    for (const view of viewsToCheck) {
      try {
        const { data, error } = await supabase
          .from(view)
          .select('id')
          .limit(1);
        
        if (error) {
          console.log(`${view}: Not accessible - ${error.message}`);
        } else {
          console.log(`${view}: Accessible`);
        }
      } catch (error) {
        console.log(`${view}: Error - ${error.message}`);
      }
    }
    
    console.log('\nDatabase structure check complete!');
    return true;
  } catch (error) {
    console.error('Error checking database structure:', error.message);
    return false;
  }
}

// Run the check
checkDatabaseStructure().then(success => {
  if (success) {
    console.log('\nDatabase structure check completed successfully!');
  } else {
    console.log('\nThere were issues checking the database structure.');
  }
  process.exit(success ? 0 : 1);
});