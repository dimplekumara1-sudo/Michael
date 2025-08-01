import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const AuthSystemStatus: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();

  const runAuthSystemCheck = async () => {
    setLoading(true);
    setStatus('Checking new authentication system...');

    try {
      let statusText = '🔐 New Authentication System Status:\n\n';
      
      // Check current user
      statusText += `Current User: ${user ? user.email : 'Not logged in'}\n`;
      statusText += `User ID: ${user ? user.id : 'N/A'}\n`;
      statusText += `Profile Available: ${profile ? '✅' : '❌'}\n`;
      
      if (profile) {
        statusText += `Profile Name: ${profile.name}\n`;
        statusText += `Profile Role: ${profile.role}\n`;
        statusText += `Profile Mobile: ${profile.mobile || 'Not set'}\n`;
      }

      // Check user metadata
      if (user) {
        statusText += `\n📋 User Metadata:\n`;
        const metadata = user.user_metadata || {};
        statusText += `  Name: ${metadata.name || 'Not set'}\n`;
        statusText += `  Full Name: ${metadata.full_name || 'Not set'}\n`;
        statusText += `  Mobile: ${metadata.mobile || 'Not set'}\n`;
      }

      // Check if user_profiles view exists
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('count')
          .limit(1);
        
        if (error) {
          statusText += `\n❌ user_profiles view: Not available (${error.message})`;
        } else {
          statusText += `\n✅ user_profiles view: Available`;
        }
      } catch (error) {
        statusText += `\n❌ user_profiles view: Error checking`;
      }

      // Check bookings table
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('count')
          .limit(1);
        
        if (error) {
          statusText += `\n❌ bookings table: Not accessible (${error.message})`;
        } else {
          statusText += `\n✅ bookings table: Accessible`;
        }
      } catch (error) {
        statusText += `\n❌ bookings table: Error checking`;
      }

      statusText += `\n\n🎉 New System Benefits:`;
      statusText += `\n  ✅ No profiles table dependency`;
      statusText += `\n  ✅ Profile data from auth.users metadata`;
      statusText += `\n  ✅ Faster login (no DB queries for profile)`;
      statusText += `\n  ✅ Profile persists across page refreshes`;
      statusText += `\n  ✅ Simplified authentication flow`;

      setStatus(statusText);
    } catch (error) {
      setStatus(`❌ Error checking auth system: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testUserMetadataUpdate = async () => {
    if (!user) {
      setStatus('❌ No user logged in to test metadata update');
      return;
    }

    setLoading(true);
    setStatus('Testing user metadata update...');

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          name: 'Updated Test Name',
          mobile: '+1234567890'
        }
      });

      if (error) {
        setStatus(`❌ Error updating user metadata: ${error.message}`);
      } else {
        setStatus(`✅ User metadata updated successfully!\nNew metadata: ${JSON.stringify(data.user?.user_metadata, null, 2)}`);
      }
    } catch (error) {
      setStatus(`❌ Error updating metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">🔐 New Authentication System Status</h2>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={runAuthSystemCheck}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Auth System'}
          </button>
          
          {user && (
            <button
              onClick={testUserMetadataUpdate}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Test Metadata Update'}
            </button>
          )}
        </div>

        {status && (
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm font-mono">{status}</pre>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">📝 Migration Notes:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• The profiles table has been removed</li>
            <li>• User profile data now comes from auth.users metadata</li>
            <li>• Profile data persists across page refreshes</li>
            <li>• Login is faster (no database queries for profile)</li>
            <li>• Admin role determined by email (admin@photography.com)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuthSystemStatus;