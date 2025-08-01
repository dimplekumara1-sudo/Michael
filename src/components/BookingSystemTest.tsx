import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const BookingSystemTest: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();

  const testBookingSystem = async () => {
    setLoading(true);
    setStatus('Testing booking system...\n');

    try {
      let statusText = '🧪 Booking System Test Results:\n\n';
      
      // Test 1: Check user_profiles view
      statusText += '1. Testing user_profiles view...\n';
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(5);

      if (profilesError) {
        statusText += `   ❌ Error: ${profilesError.message}\n`;
      } else {
        statusText += `   ✅ Found ${profilesData.length} user profiles\n`;
        if (profilesData.length > 0) {
          statusText += `   Sample: ${profilesData[0].name} (${profilesData[0].email})\n`;
        }
      }

      // Test 2: Check bookings table
      statusText += '\n2. Testing bookings table...\n';
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .limit(5);

      if (bookingsError) {
        statusText += `   ❌ Error: ${bookingsError.message}\n`;
      } else {
        statusText += `   ✅ Found ${bookingsData.length} bookings\n`;
        if (bookingsData.length > 0) {
          statusText += `   Sample: ${bookingsData[0].event_type} - Mobile: ${bookingsData[0].mobile}\n`;
        }
      }

      // Test 3: Test joining bookings with user profiles (like admin dashboard does)
      statusText += '\n3. Testing booking-user data join...\n';
      if (bookingsData && bookingsData.length > 0) {
        const sampleBooking = bookingsData[0];
        
        const { data: userProfile, error: userError } = await supabase
          .from('user_profiles')
          .select('name, email, mobile')
          .eq('id', sampleBooking.user_id)
          .single();

        if (userError) {
          statusText += `   ⚠️ No user profile found: ${userError.message}\n`;
          statusText += `   Using booking mobile: ${sampleBooking.mobile}\n`;
        } else {
          statusText += `   ✅ Successfully joined data:\n`;
          statusText += `   Booking: ${sampleBooking.event_type}\n`;
          statusText += `   User: ${userProfile.name} (${userProfile.email})\n`;
          statusText += `   Mobile: ${userProfile.mobile || sampleBooking.mobile}\n`;
        }
      }

      // Test 4: Test get_user_display_name function
      statusText += '\n4. Testing get_user_display_name function...\n';
      if (bookingsData && bookingsData.length > 0) {
        const sampleUserId = bookingsData[0].user_id;
        
        const { data: displayName, error: nameError } = await supabase
          .rpc('get_user_display_name', { user_id: sampleUserId });

        if (nameError) {
          statusText += `   ❌ Error: ${nameError.message}\n`;
        } else {
          statusText += `   ✅ Display name: "${displayName}"\n`;
        }
      }

      // Test 5: Current user info
      statusText += '\n5. Current user information...\n';
      statusText += `   Logged in: ${user ? 'Yes' : 'No'}\n`;
      if (user) {
        statusText += `   Email: ${user.email}\n`;
        statusText += `   Profile available: ${profile ? 'Yes' : 'No'}\n`;
        if (profile) {
          statusText += `   Name: ${profile.name}\n`;
          statusText += `   Role: ${profile.role}\n`;
        }
      }

      statusText += '\n🎉 Test completed!\n';
      statusText += '\nIf you see user profiles and bookings data above,\n';
      statusText += 'the admin dashboard should work correctly.';

      setStatus(statusText);
    } catch (error) {
      setStatus(`❌ Error during test: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async () => {
    setLoading(true);
    setStatus('Running user metadata migration...\n');

    try {
      const { data, error } = await supabase.rpc('migrate_user_metadata');
      
      if (error) {
        setStatus(`❌ Migration error: ${error.message}`);
      } else {
        setStatus(`✅ Migration completed: ${data}`);
      }
    } catch (error) {
      setStatus(`❌ Migration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">🧪 Booking System Test</h2>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={testBookingSystem}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Booking System'}
          </button>
          
          <button
            onClick={runMigration}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Migrating...' : 'Run User Migration'}
          </button>
        </div>

        {status && (
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm font-mono">{status}</pre>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">📝 What this test checks:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• user_profiles view accessibility</li>
            <li>• bookings table accessibility</li>
            <li>• Ability to join booking and user data</li>
            <li>• get_user_display_name function</li>
            <li>• Current authentication status</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ If you see errors:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Run the COMPLETE_SETUP.sql script in Supabase</li>
            <li>• Make sure you have the correct permissions</li>
            <li>• Check that the migration was completed</li>
            <li>• Try the "Run User Migration" button to add names to existing users</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BookingSystemTest;