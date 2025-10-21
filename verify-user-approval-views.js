import { supabase } from './src/lib/supabase.js';

async function verifyUserApprovalViews() {
  console.log('Checking if user approval views exist...');
  
  try {
    // Check if pending_users view exists
    const { data: pendingUsers, error: pendingError } = await supabase
      .from('pending_users')
      .select('*')
      .limit(1);
    
    if (pendingError) {
      console.log('Pending users view does not exist or is not accessible:', pendingError.message);
    } else {
      console.log('Pending users view exists and is accessible');
    }
    
    // Check if user_profiles table has status column
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('status')
      .limit(1);
    
    if (profileError) {
      console.log('user_profiles table may not have status column:', profileError.message);
    } else {
      console.log('user_profiles table has status column');
    }
    
    // Check if there are any pending users
    const { data: pendingUserData, error: pendingUserError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('status', 'pending')
      .limit(5);
    
    if (pendingUserError) {
      console.log('Error querying pending users:', pendingUserError.message);
    } else {
      console.log(`Found ${pendingUserData.length} pending users`);
      if (pendingUserData.length > 0) {
        console.log('Sample pending user:', pendingUserData[0]);
      }
    }
    
  } catch (error) {
    console.error('Error during verification:', error.message);
  }
}

verifyUserApprovalViews();