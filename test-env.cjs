// Test script to verify environment variables
// Run with: node test-env.js

console.log('Testing environment variables...');

// Try to read the environment variable
const fs = require('fs');
const path = require('path');

// Read .env file directly
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('.env file exists');
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('.env content:');
  console.log(envContent);
  
  // Extract VITE_ADMIN_PASSWORD
  const passwordMatch = envContent.match(/VITE_ADMIN_PASSWORD=(.*)/);
  if (passwordMatch) {
    console.log('VITE_ADMIN_PASSWORD from .env:', passwordMatch[1]);
  } else {
    console.log('VITE_ADMIN_PASSWORD not found in .env');
  }
} else {
  console.log('.env file does not exist');
}