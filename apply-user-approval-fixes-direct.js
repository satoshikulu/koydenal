// Script to apply user approval fixes directly using Supabase client
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
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

async function applyUserApprovalFixes() {
  console.log('Applying user approval fixes directly...');
  
  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'apply-user-approval-fixes.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.startsWith('/*') || statement.length === 0) {
        continue;
      }
      
      console.log(`\nExecuting statement ${i + 1}/${statements.length}:`);
      console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
      
      try {
        // For ALTER TABLE statements, we need to handle them differently
        if (statement.toUpperCase().includes('ALTER TABLE') && statement.toUpperCase().includes('ADD COLUMN')) {
          // Extract table and column information
          const tableMatch = statement.match(/ALTER TABLE (\w+)/i);
          const columnMatch = statement.match(/ADD COLUMN IF NOT EXISTS (\w+)/i);
          
          if (tableMatch && columnMatch) {
            const tableName = tableMatch[1];
            const columnName = columnMatch[1];
            
            console.log(`Adding column ${columnName} to table ${tableName} if it doesn't exist`);
            
            // We can't directly execute ALTER TABLE with Supabase client
            // Instead, we'll try to select the column to see if it exists
            try {
              const { error } = await supabase
                .from(tableName)
                .select(columnName)
                .limit(1);
              
              if (error && error.message.includes('column')) {
                console.log(`Column ${columnName} does not exist in ${tableName}`);
                // Note: We can't actually add columns with the client, this would need to be done in the Supabase dashboard
              } else {
                console.log(`Column ${columnName} already exists in ${tableName}`);
              }
            } catch (selectError) {
              console.log(`Could not verify column ${columnName} in ${tableName}:`, selectError.message);
            }
          }
        } else if (statement.toUpperCase().startsWith('CREATE OR REPLACE VIEW')) {
          console.log('Skipping view creation - this needs to be done in Supabase SQL editor');
        } else if (statement.toUpperCase().startsWith('CREATE POLICY') || statement.toUpperCase().startsWith('DROP POLICY')) {
          console.log('Skipping policy creation - this needs to be done in Supabase SQL editor');
        } else if (statement.toUpperCase().startsWith('CREATE OR REPLACE FUNCTION')) {
          console.log('Skipping function creation - this needs to be done in Supabase SQL editor');
        } else if (statement.toUpperCase().startsWith('CREATE TRIGGER') || statement.toUpperCase().startsWith('DROP TRIGGER')) {
          console.log('Skipping trigger creation - this needs to be done in Supabase SQL editor');
        } else if (statement.toUpperCase().startsWith('GRANT')) {
          console.log('Skipping grant statement - this needs to be done in Supabase SQL editor');
        } else if (statement.toUpperCase().startsWith('UPDATE')) {
          console.log('Skipping update statement - this needs to be done in Supabase SQL editor');
        } else {
          console.log('Skipping statement - requires Supabase SQL editor');
        }
      } catch (stmtError) {
        console.log(`Error executing statement:`, stmtError.message);
      }
    }
    
    console.log('\nManual steps required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Open the SQL editor');
    console.log('3. Run the apply-user-approval-fixes.sql file');
    console.log('4. This will create the necessary views, policies, and update the table structure');
    
    return true;
  } catch (error) {
    console.error('Error applying user approval fixes:', error.message);
    return false;
  }
}

// Run the fixes
applyUserApprovalFixes().then(success => {
  if (success) {
    console.log('\nUser approval fixes preparation completed!');
    console.log('Please follow the manual steps above to complete the setup.');
  } else {
    console.log('\nThere were issues preparing the user approval fixes.');
  }
  process.exit(success ? 0 : 1);
});