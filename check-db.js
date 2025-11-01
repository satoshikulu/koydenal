const { createClient } = require('@supabase/supabase-js');

// Configuration from .env file
const supabaseUrl = 'https://pwnrlllwwzpjcsevwpvr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bnJsbGx3d3pwamNzZXZ3cHZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjE1OTMsImV4cCI6MjA3NTU5NzU5M30.Bmn1m_uXmrXn8fA3-tTw2ivvF8-_Z9WryX40NCfSY4M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('Checking database connection...');
  
  try {
    // Check if we can fetch categories
    const { data: categories, error: categoryError } = await supabase
      .from('categories')
      .select('*');
    
    if (categoryError) {
      console.error('Error fetching categories:', categoryError);
    } else {
      console.log('Categories:', categories);
    }
    
    // Check if we can fetch approved listings
    const { data: listings, error: listingError } = await supabase
      .from('listings')
      .select('id, title, status, created_at')
      .eq('status', 'approved');
    
    if (listingError) {
      console.error('Error fetching approved listings:', listingError);
    } else {
      console.log('Approved listings count:', listings.length);
      console.log('Approved listings:', listings);
    }
    
    // Check if we can fetch pending listings
    const { data: pendingListings, error: pendingError } = await supabase
      .from('listings')
      .select('id, title, status, created_at')
      .eq('status', 'pending');
    
    if (pendingError) {
      console.error('Error fetching pending listings:', pendingError);
    } else {
      console.log('Pending listings count:', pendingListings.length);
      console.log('Pending listings:', pendingListings);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkDatabase();