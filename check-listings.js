import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pwnrlllwwzpjcsevwpvr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bnJsbGx3d3pwamNzZXZ3cHZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDAyMTU5MywiZXhwIjoyMDc1NTk3NTkzfQ.OScNq6TFw1Z08E3ZJ1vXVjmk-6bnDyIru-ZYBenKm-s'
);

async function checkListings() {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('id, title, status, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Hata:', error);
    } else {
      console.log('İlanlar:', JSON.stringify(data, null, 2));
      if (data && data.length === 0) {
        console.log('❌ Henüz hiç ilan yok');
      }
    }
  } catch (err) {
    console.error('Bağlantı hatası:', err);
  }
}

checkListings();
