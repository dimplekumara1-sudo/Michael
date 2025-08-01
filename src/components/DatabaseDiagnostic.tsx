import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const DatabaseDiagnostic: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const runDiagnostic = async () => {
    setLoading(true);
    setStatus('Running database diagnostic...\n');

    try {
      let statusText = '🔍 Database Diagnostic Results:\n\n';
      
      // Test 1: Basic connection
      statusText += '1. Testing basic connection...\n';
      try {
        const { data, error } = await supabase.from('information_schema.tables').select('table_name').limit(1);
        if (error) {
          statusText += `   ❌ Connection failed: ${error.message}\n`;
        } else {
          statusText += `   ✅ Connection successful\n`;
        }
      } catch (e) {
        statusText += `   ❌ Connection error: ${e}\n`;
      }

      // Test 2: Auth status
      statusText += '\n2. Testing authentication...\n';
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        statusText += `   ❌ Session error: ${sessionError.message}\n`;
      } else if (session) {
        statusText += `   ✅ User authenticated: ${session.user.email}\n`;
        statusText += `   User ID: ${session.user.id}\n`;
      } else {
        statusText += `   ⚠️ No active session\n`;
      }

      // Test 3: Bookings table access
      statusText += '\n3. Testing bookings table access...\n';
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('count')
          .limit(1);
        
        if (error) {
          statusText += `   ❌ Bookings access failed: ${error.message}\n`;
          statusText += `   Error code: ${error.code}\n`;
          statusText += `   Error details: ${error.details}\n`;
        } else {
          statusText += `   ✅ Bookings table accessible\n`;
        }
      } catch (e) {
        statusText += `   ❌ Bookings table error: ${e}\n`;
      }

      // Test 4: User profiles view
      statusText += '\n4. Testing user_profiles view...\n';
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('count')
          .limit(1);
        
        if (error) {
          statusText += `   ❌ User profiles access failed: ${error.message}\n`;
        } else {
          statusText += `   ✅ User profiles view accessible\n`;
        }
      } catch (e) {
        statusText += `   ❌ User profiles error: ${e}\n`;
      }

      // Test 5: RLS policies test
      if (session) {
        statusText += '\n5. Testing RLS policies...\n';
        try {
          const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .limit(1);
          
          if (error) {
            statusText += `   ❌ RLS policy failed: ${error.message}\n`;
            if (error.message.includes('RLS')) {
              statusText += `   💡 Suggestion: Check RLS policies for bookings table\n`;
            }
          } else {
            statusText += `   ✅ RLS policies working correctly\n`;
          }
        } catch (e) {
          statusText += `   ❌ RLS test error: ${e}\n`;
        }
      }

      // Test 6: Permission test function
      statusText += '\n6. Testing permission function...\n';
      try {
        const { data, error } = await supabase.rpc('test_user_permissions');
        
        if (error) {
          statusText += `   ❌ Permission test failed: ${error.message}\n`;
        } else {
          statusText += `   ✅ Permission test results:\n`;
          statusText += `   ${data}\n`;
        }
      } catch (e) {
        statusText += `   ⚠️ Permission test function not available\n`;
      }

      statusText += '\n📋 Diagnostic Summary:\n';
      statusText += 'If you see errors above, run the FIX_LOGIN_ISSUES.sql script\n';
      statusText += 'in your Supabase SQL editor to fix database permissions.';

      setStatus(statusText);
    } catch (error) {
      setStatus(`❌ Diagnostic error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    setStatus('Testing login process...\n');

    try {
      // Test with a dummy login to see the exact error
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

      let statusText = '🔐 Login Test Results:\n\n';
      
      if (error) {
        statusText += `Error Message: ${error.message}\n`;
        statusText += `Error Code: ${error.status || 'N/A'}\n`;
        statusText += `Error Details: ${JSON.stringify(error, null, 2)}\n`;
        
        if (error.message.includes('Invalid login credentials')) {
          statusText += '\n✅ This is expected for wrong credentials\n';
          statusText += 'The login system is working correctly\n';
        } else if (error.message.includes('Database error')) {
          statusText += '\n❌ Database permission issue detected\n';
          statusText += 'Run the FIX_LOGIN_ISSUES.sql script\n';
        }
      } else {
        statusText += 'Unexpected: Login succeeded with wrong credentials\n';
      }

      setStatus(statusText);
    } catch (error) {
      setStatus(`❌ Login test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">🔍 Database Diagnostic Tool</h2>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={runDiagnostic}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Running...' : 'Run Full Diagnostic'}
          </button>
          
          <button
            onClick={testLogin}
            disabled={loading}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Login Error'}
          </button>
        </div>

        {status && (
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm font-mono">{status}</pre>
          </div>
        )}

        <div className="mt-6 p-4 bg-red-50 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-2">🚨 If you see login errors:</h3>
          <ol className="text-sm text-red-700 space-y-1 list-decimal list-inside">
            <li>Run the <code>FIX_LOGIN_ISSUES.sql</code> script in Supabase SQL Editor</li>
            <li>Check that RLS policies are properly configured</li>
            <li>Verify that the bookings table exists and has correct permissions</li>
            <li>Ensure the user_profiles view is accessible</li>
            <li>Test with a valid user account</li>
          </ol>
        </div>

        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">✅ Expected behavior:</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Connection should be successful</li>
            <li>• Bookings table should be accessible</li>
            <li>• User profiles view should work</li>
            <li>• RLS policies should allow proper access</li>
            <li>• Login with wrong credentials should show "Invalid login credentials"</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DatabaseDiagnostic;