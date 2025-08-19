// Test Setup Script
const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials
const supabaseUrl = 'https://hhaqtqlhiihlicadimkc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoYXF0cWxoaWlobGljYWRpbWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTY2NjUsImV4cCI6MjA3MDEzMjY2NX0.WpXROJQSDKxyzRilyUbmUnlSLxzW9orQn4Nllk3t3Hw';

async function testSetup() {
  console.log('🧪 Testing Zemenay Setup...\n');
  
  // Test 1: Supabase Connection
  console.log('1️⃣ Testing Supabase Connection...');
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('   ⚠️  Supabase connected but posts table might not exist');
      console.log('   💡 This is normal for a new project');
    } else {
      console.log('   ✅ Supabase connection successful');
      console.log(`   📊 Found ${data?.length || 0} posts`);
    }
  } catch (error) {
    console.log('   ❌ Supabase connection failed:', error.message);
  }
  
  // Test 2: Backend API
  console.log('\n2️⃣ Testing Backend API...');
  try {
    const response = await fetch('http://localhost:3001/api');
    if (response.ok) {
      console.log('   ✅ Backend API is running');
      console.log('   📖 Swagger docs available at http://localhost:3001/api');
    } else {
      console.log('   ❌ Backend API not responding');
    }
  } catch (error) {
    console.log('   ❌ Backend API not accessible:', error.message);
    console.log('   💡 Make sure the backend is running on port 3001');
  }
  
  // Test 3: Frontend
  console.log('\n3️⃣ Testing Frontend...');
  try {
    const response = await fetch('http://localhost:3000');
    if (response.ok) {
      console.log('   ✅ Frontend is running');
      console.log('   🌐 Frontend available at http://localhost:3000');
    } else {
      console.log('   ❌ Frontend not responding');
    }
  } catch (error) {
    console.log('   ❌ Frontend not accessible:', error.message);
    console.log('   💡 Make sure the frontend is running on port 3000');
  }
  
  // Test 4: Environment Variables
  console.log('\n4️⃣ Checking Environment Setup...');
  console.log('   📝 Make sure you have created:');
  console.log('      - zemenay_back/.env (from env.example)');
  console.log('      - zemenay_front/.env.local (from env.example)');
  console.log('   🔑 Make sure to replace "your-service-role-key-here" with your actual Supabase service role key');
  
  // Test 5: Database Tables
  console.log('\n5️⃣ Checking Database Tables...');
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const tables = ['users', 'posts', 'tags'];
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`   ⚠️  Table "${table}" might not exist yet`);
      } else {
        console.log(`   ✅ Table "${table}" exists`);
      }
    }
  } catch (error) {
    console.log('   ❌ Could not check database tables');
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Start the backend: cd zemenay_back && npm run start:dev');
  console.log('2. Start the frontend: cd zemenay_front && npm run dev');
  console.log('3. Visit http://localhost:3000/admin/login to test the admin panel');
  console.log('4. Use the demo credentials to log in');
  console.log('5. Try creating a new post');
  
  console.log('\n🔧 If you encounter issues:');
  console.log('- Check that both applications are running');
  console.log('- Verify your Supabase credentials');
  console.log('- Check browser console and terminal for errors');
  console.log('- Make sure your environment variables are set correctly');
}

// Run the test
testSetup()
  .catch(error => {
    console.error('Test failed:', error);
  }); 