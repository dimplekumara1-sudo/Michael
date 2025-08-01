import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const LoginTest: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testDatabaseAccess = async () => {
    setLoading(true);
    setStatus('Testing database access...\n');

    try {
      let result = '🔍 Database Access Test:\n\n';

      // Test 1: Basic connection
      result += '1. Testing connection...\n';
      const { data: connectionTest, error: connectionError } = await supabase
        .from('bookings')
        .select('count')
        .limit(1);

      if (connectionError) {
        result += `   ❌ Connection failed: ${connectionError.message}\n`;
      } else {
        result += `   ✅ Connection successful\n`;
      }

      // Test 2: Test the fix function
      result += '\n2. Testing fix function...\n';
      const { data: fixTest, error: fixError } = await supabase.rpc('test_login_fix');
      
      if (fixError) {
        result += `   ❌ Fix function failed: ${fixError.message}\n`;
      } else {
        result += `   ✅ Fix function result: ${fixTest}\n`;
      }

      // Test 3: Test user_profiles view
      result += '\n3. Testing user_profiles view...\n';
      const { data: profilesTest, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1);

      if (profilesError) {
        result += `   ❌ Profiles view failed: ${profilesError.message}\n`;
      } else {
        result += `   ✅ Profiles view accessible\n`;
      }

      result += '\n📋 Summary:\n';
      if (!connectionError && !fixError && !profilesError) {
        result += '✅ All tests passed - login should work now!\n';
        result += 'Try logging in with your credentials.';
      } else {
        result += '❌ Some tests failed - run the EMERGENCY_LOGIN_FIX.sql script first.';
      }

      setStatus(result);
    } catch (error) {
      setStatus(`❌ Test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testActualLogin = async () => {
    setLoading(true);
    setStatus('Testing actual login process...\n');

    try {
      // Test with invalid credentials to see if we get the right error
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@nonexistent.com',
        password: 'wrongpassword'
      });

      let result = '🔐 Login Process Test:\n\n';
      
      if (error) {
        result += `Error Message: ${error.message}\n`;
        result += `Error Code: ${error.status || 'N/A'}\n`;
        
        if (error.message.includes('Invalid login credentials')) {
          result += '\n✅ GOOD: Getting proper "Invalid credentials" error\n';
          result += 'This means the database permission issue is fixed!\n';
          result += 'You can now try logging in with valid credentials.';
        } else if (error.message.includes('Database error granting user')) {
          result += '\n❌ STILL BROKEN: Database permission issue persists\n';
          result += 'Run the EMERGENCY_LOGIN_FIX.sql script in Supabase SQL Editor.';
        } else {
          result += '\n⚠️ Different error - check the message above.';
        }
      } else {
        result += '⚠️ Unexpected: Login succeeded with fake credentials';
      }

      setStatus(result);
    } catch (error) {
      setStatus(`❌ Login test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-red-800">🚨 Emergency Login Fix Test</h2>
      
      <div className="space-y-4">
        <div className="bg-white p-4 rounded border">
          <h3 className="font-semibold mb-2">Step 1: Run Database Fix</h3>
          <p className="text-sm text-gray-600 mb-3">
            First, run the <code>EMERGENCY_LOGIN_FIX.sql</code> script in your Supabase SQL Editor.
          </p>
          <button
            onClick={testDatabaseAccess}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Database Access'}
          </button>
        </div>

        <div className="bg-white p-4 rounded border">
          <h3 className="font-semibold mb-2">Step 2: Test Login Process</h3>
          <p className="text-sm text-gray-600 mb-3">
            This tests if the "Database error granting user" issue is fixed.
          </p>
          <button
            onClick={testActualLogin}
            disabled={loading}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Login Process'}
          </button>
        </div>

        {status && (
          <div className="bg-gray-100 p-4 rounded">
            <pre className="whitespace-pre-wrap text-sm font-mono">{status}</pre>
          </div>
        )}

        <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• The emergency fix disables RLS for security temporarily</li>
            <li>• This is only to get login working - we'll re-enable security after</li>
            <li>• Test login immediately after running the SQL script</li>
            <li>• If login works, we'll apply proper RLS policies next</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LoginTest;