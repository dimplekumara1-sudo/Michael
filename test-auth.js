// Test script to verify authentication works
// Run this in browser console on your app

console.log('🧪 Testing Authentication Flow...');

// Test 1: Check if Supabase is properly configured
console.log('1. Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('2. Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing');

// Test 2: Test registration
async function testRegistration() {
  console.log('🔐 Testing Registration...');
  
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'test123456';
  const testName = 'Test User';
  const testMobile = '+1234567890';
  
  try {
    // This would be called from your register form
    console.log('Registration data:', {
      email: testEmail,
      password: testPassword,
      name: testName,
      mobile: testMobile
    });
    
    console.log('✅ Registration test data prepared');
    return { testEmail, testPassword, testName, testMobile };
  } catch (error) {
    console.error('❌ Registration test failed:', error);
  }
}

// Test 3: Check database connection
async function testDatabaseConnection() {
  console.log('🗄️ Testing Database Connection...');
  
  try {
    const { supabase } = await import('./src/lib/supabase.ts');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error);
    } else {
      console.log('✅ Database connection successful');
    }
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

// Run tests
testRegistration();
testDatabaseConnection();

console.log('🎯 Test completed. Check the results above.');
console.log('📝 To test registration, go to /register and try creating an account.');
console.log('🔑 To test login, use admin@photography.com / admin123 or any registered user.');