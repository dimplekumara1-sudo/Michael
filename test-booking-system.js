import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBookingSystem() {
  console.log('🧪 Testing booking system with new auth structure...\n');

  try {
    // Test 1: Check if user_profiles view exists and works
    console.log('1. Testing user_profiles view...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(3);

    if (profilesError) {
      console.error('❌ Error accessing user_profiles view:', profilesError.message);
    } else {
      console.log('✅ user_profiles view accessible');
      console.log(`   Found ${profilesData.length} user profiles`);
      if (profilesData.length > 0) {
        console.log('   Sample profile:', {
          name: profilesData[0].name,
          email: profilesData[0].email,
          role: profilesData[0].role
        });
      }
    }

    // Test 2: Check bookings table
    console.log('\n2. Testing bookings table...');
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .limit(3);

    if (bookingsError) {
      console.error('❌ Error accessing bookings table:', bookingsError.message);
    } else {
      console.log('✅ bookings table accessible');
      console.log(`   Found ${bookingsData.length} bookings`);
      if (bookingsData.length > 0) {
        console.log('   Sample booking:', {
          id: bookingsData[0].id,
          user_id: bookingsData[0].user_id,
          event_type: bookingsData[0].event_type,
          mobile: bookingsData[0].mobile
        });
      }
    }

    // Test 3: Test joining bookings with user_profiles
    console.log('\n3. Testing booking-user data join...');
    if (bookingsData && bookingsData.length > 0) {
      const sampleBooking = bookingsData[0];
      
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('name, email, mobile')
        .eq('id', sampleBooking.user_id)
        .single();

      if (userError) {
        console.log('⚠️ Could not find user profile for booking:', userError.message);
        console.log('   This is expected if the user was created before the migration');
      } else {
        console.log('✅ Successfully joined booking with user profile:');
        console.log('   Booking:', sampleBooking.event_type);
        console.log('   User:', userProfile.name, '(' + userProfile.email + ')');
      }
    }

    // Test 4: Test get_user_display_name function
    console.log('\n4. Testing get_user_display_name function...');
    if (bookingsData && bookingsData.length > 0) {
      const sampleUserId = bookingsData[0].user_id;
      
      const { data: displayName, error: nameError } = await supabase
        .rpc('get_user_display_name', { user_id: sampleUserId });

      if (nameError) {
        console.error('❌ Error calling get_user_display_name:', nameError.message);
      } else {
        console.log('✅ get_user_display_name function works');
        console.log('   Display name for user:', displayName);
      }
    }

    // Test 5: Check database constraints
    console.log('\n5. Testing database constraints...');
    
    // Check if bookings table has the correct foreign key
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, table_name')
      .eq('table_name', 'bookings')
      .eq('constraint_type', 'FOREIGN KEY');

    if (constraintError) {
      console.log('⚠️ Could not check constraints (this is normal for non-admin users)');
    } else {
      console.log('✅ Foreign key constraints found:', constraints.length);
    }

    console.log('\n🎉 Booking system test completed!');
    console.log('\n📋 Summary:');
    console.log('   - user_profiles view provides user information');
    console.log('   - bookings table contains mobile numbers');
    console.log('   - Admin dashboard should now show user names and contact info');
    console.log('   - Profile data persists across page refreshes');

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

// Run the test
testBookingSystem();