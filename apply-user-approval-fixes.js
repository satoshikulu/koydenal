// Script to apply user approval fixes to the database
import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_KEY in your environment');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyUserApprovalFixes() {
  console.log('Applying user approval fixes...');
  
  try {
    // 1. Add status column to user_profiles table
    console.log('1. Adding status column to user_profiles table...');
    const { error: statusColumnError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'`
    });
    
    if (statusColumnError) {
      console.log('Status column may already exist or error:', statusColumnError.message);
    } else {
      console.log('Status column added successfully');
    }
    
    // 2. Add approval related columns
    console.log('2. Adding approval related columns...');
    const { error: approvedByError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id)`
    });
    
    if (approvedByError) {
      console.log('Approved by column may already exist or error:', approvedByError.message);
    }
    
    const { error: approvedAtError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE`
    });
    
    if (approvedAtError) {
      console.log('Approved at column may already exist or error:', approvedAtError.message);
    }
    
    const { error: rejectionReasonError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS rejection_reason TEXT`
    });
    
    if (rejectionReasonError) {
      console.log('Rejection reason column may already exist or error:', rejectionReasonError.message);
    }
    
    // 3. Create pending_users view
    console.log('3. Creating pending_users view...');
    const { error: pendingViewError } = await supabase.rpc('exec_sql', {
      sql: `CREATE OR REPLACE VIEW pending_users AS SELECT up.id, up.email, up.full_name, up.phone, up.role, up.created_at, up.updated_at FROM user_profiles up WHERE up.status = 'pending' ORDER BY up.created_at DESC`
    });
    
    if (pendingViewError) {
      console.log('Error creating pending_users view:', pendingViewError.message);
    } else {
      console.log('Pending users view created successfully');
    }
    
    // 4. Create approved_users view
    console.log('4. Creating approved_users view...');
    const { error: approvedViewError } = await supabase.rpc('exec_sql', {
      sql: `CREATE OR REPLACE VIEW approved_users AS SELECT up.id, up.email, up.full_name, up.phone, up.role, up.approved_by, up.approved_at, up.created_at, up.updated_at FROM user_profiles up WHERE up.status = 'approved' ORDER BY up.approved_at DESC`
    });
    
    if (approvedViewError) {
      console.log('Error creating approved_users view:', approvedViewError.message);
    } else {
      console.log('Approved users view created successfully');
    }
    
    // 5. Create rejected_users view
    console.log('5. Creating rejected_users view...');
    const { error: rejectedViewError } = await supabase.rpc('exec_sql', {
      sql: `CREATE OR REPLACE VIEW rejected_users AS SELECT up.id, up.email, up.full_name, up.phone, up.role, up.rejection_reason, up.approved_by, up.approved_at, up.created_at, up.updated_at FROM user_profiles up WHERE up.status = 'rejected' ORDER BY up.approved_at DESC`
    });
    
    if (rejectedViewError) {
      console.log('Error creating rejected_users view:', rejectedViewError.message);
    } else {
      console.log('Rejected users view created successfully');
    }
    
    // 6. Update existing user profiles to have 'pending' status if they don't have a status
    console.log('6. Updating existing user profiles...');
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `UPDATE user_profiles SET status = 'pending' WHERE status IS NULL`
    });
    
    if (updateError) {
      console.log('Error updating user profiles:', updateError.message);
    } else {
      console.log('User profiles updated successfully');
    }
    
    console.log('User approval fixes applied successfully!');
    return true;
  } catch (error) {
    console.error('Error applying user approval fixes:', error.message);
    return false;
  }
}

// Run the fixes
applyUserApprovalFixes().then(success => {
  if (success) {
    console.log('All user approval fixes applied successfully!');
  } else {
    console.log('Some errors occurred while applying fixes.');
  }
  process.exit(success ? 0 : 1);
});