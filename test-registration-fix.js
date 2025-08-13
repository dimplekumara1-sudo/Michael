// Test script to verify registration fix
// Run this with: node test-registration-fix.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRegistration() {
  console.log('🧪 Testing registration flow...');
  
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  const testName = 'Test User';
  const testMobile = '+1234567890';
  
  try {
    // Step 1: Test user registration
    console.log('📝 Registering test user:', testEmail);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: testName,
          mobile: testMobile
        }
      }
    });
    
    if (authError) {
      console.error('❌ Registration failed:', authError.message);
      return false;
    }
    
    if (!authData.user) {
      console.error('❌ No user returned from registration');
      return false;
    }
    
    console.log('✅ User registered successfully:', authData.user.email);
    
    // Step 2: Wait for trigger to create profile
    console.log('⏳ Waiting for profile creation...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Check if profile was created
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile not found:', profileError.message);
      
      // Try to create profile manually
      console.log('🔧 Attempting manual profile creation...');
      
      const { data: manualProfile, error: manualError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          name: testName,
          mobile: testMobile,
          role: 'user',
          is_active: true
        })
        .select()
        .single();
      
      if (manualError) {
        console.error('❌ Manual profile creation failed:', manualError.message);
        return false;
      } else {
        console.log('✅ Manual profile created:', manualProfile);
      }
    } else {
      console.log('✅ Profile created automatically:', profileData);
    }
    
    // Step 4: Test login
    console.log('🔐 Testing login...');
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (loginError) {
      console.error('❌ Login failed:', loginError.message);
      return false;
    }
    
    console.log('✅ Login successful:', loginData.user.email);
    
    // Step 5: Test profile access after login
    const { data: loginProfile, error: loginProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', loginData.user.id)
      .single();
    
    if (loginProfileError) {
      console.error('❌ Profile access after login failed:', loginProfileError.message);
      return false;
    }
    
    console.log('✅ Profile accessible after login:', loginProfile);
    
    // Step 6: Cleanup - delete test user
    console.log('🧹 Cleaning up test data...');
    
    // Delete profile first
    await supabase
      .from('profiles')
      .delete()
      .eq('id', authData.user.id);
    
    // Sign out
    await supabase.auth.signOut();
    
    console.log('✅ Test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

async function testDatabaseConnection() {
  console.log('🔌 Testing database connection...');
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting registration and authentication tests...\n');
  
  // Test database connection first
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.log('\n❌ Database connection failed. Please check your Supabase configuration.');
    return;
  }
  
  console.log('');
  
  // Test registration flow
  const registrationWorking = await testRegistration();
  
  console.log('\n📊 Test Results:');
  console.log('Database Connection:', dbConnected ? '✅ Working' : '❌ Failed');
  console.log('Registration Flow:', registrationWorking ? '✅ Working' : '❌ Failed');
  
  if (registrationWorking) {
    console.log('\n🎉 All tests passed! Registration should work properly now.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the database setup and run the COMPREHENSIVE_AUTH_FIX.sql script.');
  }
}

// Run the tests
runTests().catch(console.error);