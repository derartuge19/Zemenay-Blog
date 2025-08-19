// Test Backend Connection
const API_URL = 'http://localhost:3001';

async function testConnection() {
  console.log('🧪 Testing Backend Connection...\n');

  try {
    // Test 1: Check if backend is running
    console.log('1️⃣ Testing if backend is running...');
    const healthResponse = await fetch(`${API_URL}/api`);
    console.log('✅ Backend is running!');
    console.log('   Status:', healthResponse.status);
    
    // Test 2: Try to register a test user
    console.log('\n2️⃣ Testing user registration...');
    const registerResponse = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123',
        username: 'admin'
      }),
    });

    if (registerResponse.ok) {
      console.log('✅ User registered successfully!');
    } else {
      const errorData = await registerResponse.json();
      if (errorData.message?.includes('already exists')) {
        console.log('ℹ️  User already exists, continuing...');
      } else {
        console.log('❌ Registration failed:', errorData);
      }
    }

    // Test 3: Try to login
    console.log('\n3️⃣ Testing login...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123'
      }),
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful!');
      console.log('   User:', loginData.user.email);
      console.log('   Role:', loginData.user.role);
      console.log('   Token received:', !!loginData.access_token);
      
      // Test 4: Test creating a post (if login successful)
      console.log('\n4️⃣ Testing post creation...');
      const postResponse = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.access_token}`,
        },
        body: JSON.stringify({
          title: 'Test Post',
          content: 'This is a test post',
          excerpt: 'Test excerpt',
          status: 'draft',
          author_id: loginData.user.id
        }),
      });

      if (postResponse.ok) {
        console.log('✅ Post created successfully!');
      } else {
        const postError = await postResponse.text();
        console.log('❌ Post creation failed:', postError);
      }
    } else {
      const loginError = await loginResponse.text();
      console.log('❌ Login failed:', loginError);
    }

  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure your backend is running on port 3001');
    console.log('2. Check if you have the correct Supabase credentials');
    console.log('3. Verify your .env file in the backend folder');
  }

  console.log('\n🎯 Next Steps:');
  console.log('1. If all tests passed, you can now use the admin panel');
  console.log('2. Go to http://localhost:3000/login');
  console.log('3. Login with: admin@example.com / password123');
  console.log('4. Try creating a new post');

  console.log('\n🔧 If tests failed:');
  console.log('- Make sure your backend is running on port 3001');
  console.log('- Check your Supabase credentials in the backend .env file');
  console.log('- Make sure your database tables exist');
}

testConnection(); 