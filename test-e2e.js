const { apiClient } = require('./zemenay_front/lib/api-client');
const { supabase } = require('./zemenay_front/lib/supabase');

// Test configuration
const TEST_EMAIL = `testuser_${Date.now()}@example.com`;
const TEST_PASSWORD = 'Test@1234';
const TEST_USERNAME = `testuser_${Date.now().toString(36).slice(-8)}`;

async function runTests() {
  console.log('Starting end-to-end tests...');
  
  try {
    // Test 1: Register a new user
    console.log('\n=== Test 1: User Registration ===');
    const registerResponse = await apiClient.register({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      username: TEST_USERNAME,
    });
    console.log('✅ User registered successfully:', registerResponse.user.email);

    // Test 2: Login with the new user
    console.log('\n=== Test 2: User Login ===');
    const loginResponse = await apiClient.login(TEST_EMAIL, TEST_PASSWORD);
    console.log('✅ User logged in successfully:', loginResponse.user.email);

    // Test 3: Get current user
    console.log('\n=== Test 3: Get Current User ===');
    const currentUser = await apiClient.getCurrentUser();
    console.log('✅ Current user:', currentUser.email);

    // Test 4: Create a new post
    console.log('\n=== Test 4: Create Post ===');
    const newPost = await apiClient.createPost({
      title: 'Test Post',
      content: 'This is a test post content.',
      excerpt: 'Test post excerpt',
      status: 'published',
      author_id: currentUser.id,
    });
    console.log('✅ Post created successfully:', newPost.id);

    // Test 5: Get all posts
    console.log('\n=== Test 5: Get All Posts ===');
    const { data: posts } = await apiClient.getPosts();
    console.log(`✅ Retrieved ${posts.length} posts`);

    // Test 6: Get post by ID
    console.log('\n=== Test 6: Get Post by ID ===');
    const post = await apiClient.getPost(newPost.id);
    console.log(`✅ Retrieved post: ${post.title}`);

    // Test 7: Create a tag
    console.log('\n=== Test 7: Create Tag ===');
    const tagName = `tag-${Date.now().toString(36).slice(-4)}`;
    const newTag = await apiClient.createTag(tagName);
    console.log('✅ Tag created successfully:', newTag.name);

    // Test 8: Get all tags
    console.log('\n=== Test 8: Get All Tags ===');
    const tags = await apiClient.getTags();
    console.log(`✅ Retrieved ${tags.length} tags`);

    // Test 9: Direct Supabase query (verifies Supabase connection)
    console.log('\n=== Test 9: Direct Supabase Query ===');
    const { data: supabaseData, error } = await supabase
      .from('posts')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase query failed:', error);
    } else {
      console.log('✅ Supabase connection successful. Retrieved posts:', supabaseData?.length || 0);
    }

    console.log('\n✅✅✅ All tests completed successfully! ✅✅✅');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
runTests();
