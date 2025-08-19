const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment files...\n');

// Frontend .env.local
const frontendEnv = `NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001`;

const frontendPath = path.join(__dirname, 'zemenay_front', '.env.local');

try {
  fs.writeFileSync(frontendPath, frontendEnv);
  console.log('✅ Created zemenay_front/.env.local');
} catch (error) {
  console.log('❌ Failed to create frontend .env.local:', error.message);
}

// Backend .env
const backendEnv = `# Backend Environment Variables
PORT=3001
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Supabase Configuration
SUPABASE_URL=https://hhaqtqlhiihlicadimkc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoYXF0cWxoaWlobGljYWRpbWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTY2NjUsImV4cCI6MjA3MDEzMjY2NX0.WpXROJQSDKxyzRilyUbmUnlSLxzW9orQn4Nllk3t3Hw
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# CORS Configuration
CORS_ORIGIN=http://localhost:3000`;

const backendPath = path.join(__dirname, 'zemenay_back', '.env');

try {
  fs.writeFileSync(backendPath, backendEnv);
  console.log('✅ Created zemenay_back/.env');
} catch (error) {
  console.log('❌ Failed to create backend .env:', error.message);
}

console.log('\n🎯 Next Steps:');
console.log('1. Get your Supabase Service Role Key from your Supabase dashboard');
console.log('2. Replace "your-service-role-key-here" in zemenay_back/.env');
console.log('3. Restart your backend server');
console.log('4. Test the connection with: node test-connection.js');

console.log('\n📋 To get your Service Role Key:');
console.log('1. Go to https://supabase.com/dashboard');
console.log('2. Select your project');
console.log('3. Go to Settings > API');
console.log('4. Copy the "service_role" key (not the anon key)');
console.log('5. Replace it in the .env file'); 