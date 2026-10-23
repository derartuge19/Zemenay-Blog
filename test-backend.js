// Test Backend Connection and Create Test User
const  API_URL = 'http://localhost:3001';

async function testBackend() {
  console.log('🧪 Testing Backend Connection...\n');
  
  // Test 1: Check if backend is running
  console.log('1️⃣ Checking if backend is running...');
  try {
    const response = await fetch(`${API_URL}/api`);
    if (response.ok) {
      console.log('   ✅ Backend is running');
      console.log('   📖 Swagger docs available at http://localhost:3001/api');
    } else {
      console.log('   ❌ Backend responded with status:', response.status);
    }
  } catch (error) {
    console.log('   ❌ Backend not accessible:', error.message);
    console.log('   💡 Make sure the backend is running: cd zemenay_back && npm run start:dev');
    return;
  }
  
  // Test 2: Try to register a test user
  console.log('\n2️⃣ Creating test user...');
  try  {
    const userData = {
      email: 'admin@example.com',
      password: 'password123',
      name: 'Admin User'
    };
    
    console.log('   📝 Registering user:', userData.email);
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('   ✅ User created successfully');
      console.log('   👤 User data:', result);
    } else {
      if (result.message?.includes('already exists')) {
        console.log('   ⚠️  User already exists, trying to login...');
      } else {
        console.log('   ❌ Failed to create user:', result);
      }
    }
  } catch (error) {
    console.log('   ❌ Error creating user:', error.message);
  }
  
  // Test 3: Try to login
  console.log('\n3️⃣ Testing login...');
  try {
    const loginData = {
      email: 'admin@example.com',
      password: 'password123'
    };
    
    console.log('   🔐 Attempting login...');
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('   ✅ Login successful');
      console.log('   🎫 Token received');
      console.log('   👤 User:', result.user);
      
      // Test 4: Test creating a post
      console.log('\n4️⃣ Testing post creation...');
      try {
        const postData = {
          title: 'Test Post',
          content: 'This is a test post content.',
          excerpt: 'A test post excerpt.',
          status: 'draft',
          author_id: result.user.id,
          slug: 'test-post'
        };
        
        console.log('   📝 Creating test post...');
        const postResponse = await fetch(`${API_URL}/posts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${result.access_token}`,
          },
          body: JSON.stringify(postData),
        });
        
        const postResult = await postResponse.json();
        
        if (postResponse.ok) {
          console.log('   ✅ Post created successfully');
          console.log('   📄 Post data:', postResult);
        } else {
          console.log('   ❌ Failed to create post:', postResult);
        }
      } catch (postError) {
        console.log('   ❌ Error creating post:', postError.message);
      }
      
    } else {
      console.log('   ❌ Login failed:', result);
    }
  } catch (error) {
    console.log('   ❌ Error during login:', error.message);
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. If all tests passed, you can now use the admin panel');
  console.log('2. Go to http://localhost:3000/admin/login');
  console.log('3. Login with: admin@example.com / password123');
  console.log('4. Try creating a new post');
  
  console.log('\n🔧 If tests failed:');
  console.log('- Make sure your backend is running on port 3001');
  console.log('- Check your Supabase credentials in the backend .env file');
  console.log('- Make sure your database tables exist');
}

// Run the test
testBackend()
  .catch(error => {
    console.error('Test failed:', error);
  }); 
