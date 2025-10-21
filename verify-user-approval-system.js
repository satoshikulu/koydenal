// Script to verify the user approval system is working correctly
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_KEY in your environment');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyUserApprovalSystem() {
  console.log('Verifying user approval system...');
  
  try {
    // 1. Check if user_profiles table exists and has the required columns
    console.log('\n1. Checking user_profiles table structure...');
    const { data: profileSample, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (profileError) {
      console.log('Error accessing user_profiles table:', profileError.message);
    } else {
      console.log('user_profiles table accessible');
      console.log('Sample profile columns:', Object.keys(profileSample[0] || {}));
    }
    
    // 2. Check if status column exists
    console.log('\n2. Checking if status column exists...');
    const { data: statusCheck, error: statusError } = await supabase
      .from('user_profiles')
      .select('status')
      .limit(1);
    
    if (statusError) {
      console.log('Status column does not exist or is not accessible:', statusError.message);
    } else {
      console.log('Status column exists');
    }
    
    // 3. Check if pending_users view exists
    console.log('\n3. Checking if pending_users view exists...');
    const { data: pendingUsers, error: pendingError } = await supabase
      .from('pending_users')
      .select('*')
      .limit(1);
    
    if (pendingError) {
      console.log('pending_users view does not exist or is not accessible:', pendingError.message);
    } else {
      console.log('pending_users view exists and is accessible');
    }
    
    // 4. Check if approved_users view exists
    console.log('\n4. Checking if approved_users view exists...');
    const { data: approvedUsers, error: approvedError } = await supabase
      .from('approved_users')
      .select('*')
      .limit(1);
    
    if (approvedError) {
      console.log('approved_users view does not exist or is not accessible:', approvedError.message);
    } else {
      console.log('approved_users view exists and is accessible');
    }
    
    // 5. Check if rejected_users view exists
    console.log('\n5. Checking if rejected_users view exists...');
    const { data: rejectedUsers, error: rejectedError } = await supabase
      .from('rejected_users')
      .select('*')
      .limit(1);
    
    if (rejectedError) {
      console.log('rejected_users view does not exist or is not accessible:', rejectedError.message);
    } else {
      console.log('rejected_users view exists and is accessible');
    }
    
    // 6. Check if there are any users with different statuses
    console.log('\n6. Checking user status distribution...');
    const { data: statusCounts, error: countError } = await supabase
      .from('user_profiles')
      .select('status, count')
      .group('status');
    
    if (countError) {
      console.log('Could not get status distribution:', countError.message);
    } else {
      console.log('User status distribution:', statusCounts);
    }
    
    console.log('\nVerification complete!');
    return true;
  } catch (error) {
    console.error('Error during verification:', error.message);
    return false;
  }
}

// Run the verification
verifyUserApprovalSystem().then(success => {
  if (success) {
    console.log('\nUser approval system verification completed successfully!');
  } else {
    console.log('\nThere were issues with the user approval system.');
  }
  process.exit(success ? 0 : 1);
});