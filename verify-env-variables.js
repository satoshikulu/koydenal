// This script is for verifying that environment variables are properly set
// Run this in a Node.js environment to check .env file

const fs = require('fs');
const path = require('path');

console.log('=== Environment Variable Verification ===\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  process.exit(1);
}

console.log('✅ .env file found');

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf8');

// Check for required variables
const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_ADMIN_PASSWORD'
];

let allFound = true;

requiredVars.forEach(varName => {
  const regex = new RegExp(`${varName}\\s*=\\s*(.*)`);
  const match = envContent.match(regex);
  
  if (match) {
    console.log(`✅ ${varName}: Found`);
    if (varName === 'VITE_ADMIN_PASSWORD') {
      console.log(`   Value: "${match[1]}"`);
    }
  } else {
    console.log(`❌ ${varName}: Not found`);
    allFound = false;
  }
});

console.log('\n' + '='.repeat(40));

if (allFound) {
  console.log('✅ All environment variables are properly set');
  console.log('\nAdmin password is: Sevimbebe4242. (note the period at the end)');
} else {
  console.log('❌ Some environment variables are missing');
}

console.log('\nMade by Sevim');