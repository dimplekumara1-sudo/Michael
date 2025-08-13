import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { runDatabaseDiagnostic, createEmergencyProfile } from '../utils/dbDiagnostic';
import { manualUserRegistration, testRegistrationCapability } from '../utils/manualRegistration';

const RegistrationTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('testpassword123');
  const [testName, setTestName] = useState('Test User');

  const runRegistrationTest = async () => {
    setTesting(true);
    setTestResults(null);
    
    const results = {
      steps: [],
      success: false,
      error: null
    };

    try {
      // Step 1: Test basic auth registration
      results.steps.push('Testing basic auth registration...');
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword
      });
      
      if (authError) {
        results.steps.push(`❌ Auth registration failed: ${authError.message}`);
        results.error = authError.message;
        
        if (authError.message.includes('Database error saving new user')) {
          results.steps.push('🔍 This indicates a database trigger or constraint issue');
          results.steps.push('💡 Possible causes: RLS policies, foreign key constraints, or database triggers');
        }
      } else if (authData.user) {
        results.steps.push('✅ Auth registration successful');
        
        // Step 2: Test profile creation
        results.steps.push('Testing profile creation...');
        
        try {
          const profileResult = await createEmergencyProfile(
            authData.user.id,
            testEmail,
            testName
          );
          
          if (profileResult.success) {
            results.steps.push('✅ Profile creation successful');
            results.success = true;
          } else {
            results.steps.push(`❌ Profile creation failed: ${profileResult.error?.message}`);
          }
          
          // Clean up - delete the test user
          results.steps.push('Cleaning up test user...');
          await supabase.auth.admin.deleteUser(authData.user.id);
          results.steps.push('✅ Test user cleaned up');
          
        } catch (profileError) {
          results.steps.push(`❌ Profile creation error: ${profileError.message}`);
        }
      }
      
    } catch (error) {
      results.steps.push(`❌ Unexpected error: ${error.message}`);
      results.error = error.message;
    }
    
    setTestResults(results);
    setTesting(false);
  };

  const runDiagnostic = async () => {
    setTesting(true);
    setTestResults(null);
    
    try {
      const diagnostic = await runDatabaseDiagnostic();
      setTestResults(diagnostic);
    } catch (error) {
      setTestResults({ error: error.message });
    } finally {
      setTesting(false);
    }
  };

  const testDirectProfileInsert = async () => {
    setTesting(true);
    setTestResults(null);
    
    const results = {
      steps: [],
      success: false,
      error: null
    };

    try {
      const testProfileId = 'test-profile-' + Date.now();
      const testProfile = {
        id: testProfileId,
        email: 'test-profile@example.com',
        name: 'Test Profile User',
        role: 'user',
        is_active: true
      };

      results.steps.push('Testing direct profile insertion...');
      
      const { data, error } = await supabase
        .from('profiles')
        .insert(testProfile)
        .select()
        .single();

      if (error) {
        results.steps.push(`❌ Direct profile insert failed: ${error.message}`);
        results.error = error.message;
        
        if (error.code === '42501') {
          results.steps.push('🔍 Permission denied - RLS policy blocking insert');
        } else if (error.code === '23503') {
          results.steps.push('🔍 Foreign key constraint violation');
        } else if (error.code === '23505') {
          results.steps.push('🔍 Unique constraint violation');
        }
      } else {
        results.steps.push('✅ Direct profile insert successful');
        results.success = true;
        
        // Clean up
        await supabase.from('profiles').delete().eq('id', testProfileId);
        results.steps.push('✅ Test profile cleaned up');
      }
      
    } catch (error) {
      results.steps.push(`❌ Unexpected error: ${error.message}`);
      results.error = error.message;
    }
    
    setTestResults(results);
    setTesting(false);
  };

  const testManualRegistration = async () => {
    setTesting(true);
    setTestResults(null);
    
    try {
      const result = await manualUserRegistration({
        email: testEmail,
        password: testPassword,
        name: testName
      });
      
      setTestResults(result);
    } catch (error) {
      setTestResults({ success: false, error: error.message });
    } finally {
      setTesting(false);
    }
  };

  const testCapability = async () => {
    setTesting(true);
    setTestResults(null);
    
    try {
      const result = await testRegistrationCapability();
      setTestResults(result);
    } catch (error) {
      setTestResults({ error: error.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Registration Diagnostic Tool</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Registration Process</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Email</label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Password</label>
              <input
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={runRegistrationTest}
              disabled={testing}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {testing ? 'Testing...' : 'Test Full Registration'}
            </button>
            
            <button
              onClick={testManualRegistration}
              disabled={testing}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
            >
              {testing ? 'Testing...' : 'Test Manual Registration'}
            </button>
            
            <button
              onClick={testDirectProfileInsert}
              disabled={testing}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {testing ? 'Testing...' : 'Test Profile Insert'}
            </button>
            
            <button
              onClick={testCapability}
              disabled={testing}
              className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 disabled:opacity-50"
            >
              {testing ? 'Testing...' : 'Test Capability'}
            </button>
            
            <button
              onClick={runDiagnostic}
              disabled={testing}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {testing ? 'Running...' : 'Run Database Diagnostic'}
            </button>
          </div>
        </div>
        
        {testResults && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Test Results</h3>
            
            {testResults.steps && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Steps:</h4>
                <ul className="space-y-1">
                  {testResults.steps.map((step, index) => (
                    <li key={index} className="text-sm font-mono bg-gray-100 p-2 rounded">
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {testResults.errors && testResults.errors.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-2 text-red-600">Errors:</h4>
                <ul className="space-y-1">
                  {testResults.errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="mt-4">
              <h4 className="font-medium mb-2">Full Results:</h4>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationTest;