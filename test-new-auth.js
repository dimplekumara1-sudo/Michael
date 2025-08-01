import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need this for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testNewAuthSystem() {
  console.log('🧪 Testing new authentication system...\n');

  try {
    // Test 1: Create a test user with metadata
    console.log('1. Creating test user with metadata...');
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'testpassword123',
      user_metadata: {
        name: 'Test User',
        full_name: 'Test User',
        mobile: '+1234567890'
      }
    });

    if (signUpError) {
      console.error('❌ Error creating user:', signUpError.message);
    } else {
      console.log('✅ User created successfully:', signUpData.user.email);
      console.log('   User metadata:', signUpData.user.user_metadata);
    }

    // Test 2: Test the user_profiles view
    console.log('\n2. Testing user_profiles view...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);

    if (profilesError) {
      console.error('❌ Error fetching user profiles:', profilesError.message);
    } else {
      console.log('✅ User profiles fetched successfully:');
      profilesData.forEach(profile => {
        console.log(`   - ${profile.name} (${profile.email}) - Role: ${profile.role}`);
      });
    }

    // Test 3: Test bookings without profiles dependency
    console.log('\n3. Testing bookings table...');
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .limit(3);

    if (bookingsError) {
      console.error('❌ Error fetching bookings:', bookingsError.message);
    } else {
      console.log('✅ Bookings fetched successfully:');
      console.log(`   Found ${bookingsData.length} bookings`);
    }

    // Test 4: Test the get_user_display_name function
    if (signUpData?.user?.id) {
      console.log('\n4. Testing get_user_display_name function...');
      const { data: nameData, error: nameError } = await supabase
        .rpc('get_user_display_name', { user_id: signUpData.user.id });

      if (nameError) {
        console.error('❌ Error getting display name:', nameError.message);
      } else {
        console.log('✅ Display name function works:', nameData);
      }
    }

    // Clean up: Delete the test user
    if (signUpData?.user?.id) {
      console.log('\n5. Cleaning up test user...');
      const { error: deleteError } = await supabase.auth.admin.deleteUser(signUpData.user.id);
      if (deleteError) {
        console.error('❌ Error deleting test user:', deleteError.message);
      } else {
        console.log('✅ Test user deleted successfully');
      }
    }

    console.log('\n🎉 New authentication system test completed!');

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

// Run the test
testNewAuthSystem();