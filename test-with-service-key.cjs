require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Service role key'i buraya yapıştırın (geçici test için)
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bnJsbGx3d3pwamNzZXZ3cHZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDAyMTU5MywiZXhwIjoyMDc1NTk3NTkzfQ.OScNq6TFw1Z08E3ZJ1vXVjmk-6bnDyIru-ZYBenKm-s';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  SERVICE_ROLE_KEY
);

async function testWithServiceKey() {
  console.log('🔍 Service role key ile test...\n');
  console.log('URL:', process.env.VITE_SUPABASE_URL);

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Hata:', error.message);
      return;
    }

    console.log(`✅ ${buckets.length} bucket bulundu:\n`);
    buckets.forEach(b => {
      console.log(`- ${b.id} (Public: ${b.public})`);
    });

  } catch (error) {
    console.error('❌ Hata:', error.message);
  }
}

testWithServiceKey();
