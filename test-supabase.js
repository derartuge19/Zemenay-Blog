// Test Supabase Connection
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hhaqtqlhiihlicadimkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoYXF0cWxoaWlobGljYWRpbWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTY2NjUsImV4cCI6MjA3MDEzMjY2NX0.WpXROJQSDKxyzRilyUbmUnlSLxzW9orQn4Nllk3t3Hw';

async function testSupabase() {
  console.log('🧪 Testing Supabase Connection...\n');

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Test 1: Check if we can connect
    console.log('1️⃣ Testing connection...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
      return;
    }
    
    console.log('✅ Supabase connection successful!');

    // Test 2: Check if tables exist
    console.log('\n2️⃣ Checking tables...');
    
    const tables = ['users', 'posts', 'tags'];
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ Table '${table}' not found or accessible`);
        } else {
          console.log(`✅ Table '${table}' exists`);
        }
      } catch (err) {
        console.log(`❌ Error checking table '${table}':`, err.message);
      }
    }

    // Test 3: Try to create a test user
    console.log('\n3️⃣ Testing user creation...');
    const testUser = {
      email: 'test@example.com',
      username: 'testuser',
      role: 'user'
    };

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([testUser])
      .select();

    if (userError) {
      if (userError.message.includes('duplicate key')) {
        console.log('ℹ️  Test user already exists');
      } else {
        console.log('❌ User creation failed:', userError.message);
      }
    } else {
      console.log('✅ Test user created successfully');
    }

  } catch (error) {
    console.log('❌ Supabase test failed:', error.message);
  }

  console.log('\n🎯 Next Steps:');
  console.log('1. If connection works, get your Service Role Key from Supabase dashboard');
  console.log('2. Update zemenay_back/.env with the service role key');
  console.log('3. Restart your backend server');
}

testSupabase(); 