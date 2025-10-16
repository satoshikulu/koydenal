import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pwnrlllwwzpjcsevwpvr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bnJsbGx3d3pwamNzZXZ3cHZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDAyMTU5MywiZXhwIjoyMDc1NTk3NTkzfQ.OScNq6TFw1Z08E3ZJ1vXVjmk-6bnDyIru-ZYBenKm-s'
);

async function checkCategories() {
  try {
    const { data, error } = await supabase.from('categories').select('id, name');
    if (error) {
      console.error('Hata:', error);
    } else {
      console.log('Kategoriler:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Bağlantı hatası:', err);
  }
}

checkCategories();
