import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { testDatabaseConnection, createMissingProfile } from '../utils/dbTest';
import { runDatabaseDiagnostic, createEmergencyProfile } from '../utils/dbDiagnostic';

const AuthDebugger: React.FC = () => {
  const { user, profile, isLoading, isAdmin } = useAuth();
  const [testResults, setTestResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const runDatabaseTest = async () => {
    setTesting(true);
    setTestResults(null);
    
    try {
      const results = await testDatabaseConnection();
      setTestResults(results);
      
      // If user has session but no profile, offer to create one
      if (results.hasSession && !results.success && results.userId) {
        console.log('Offering to create missing profile...');
      }
    } catch (error) {
      setTestResults({ success: false, error: error.message });
    } finally {
      setTesting(false);
    }
  };

  const createProfile = async () => {
    if (!user?.email || !user?.id) {
      alert('No user session found');
      return;
    }
    
    setTesting(true);
    try {
      const result = await createMissingProfile(user.id, user.email);
      if (result.success) {
        alert('Profile created successfully! Please refresh the page.');
      } else {
        alert('Failed to create profile: ' + (result.error?.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Error creating profile: ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  const runFullDiagnostic = async () => {
    setTesting(true);
    setTestResults(null);
    
    try {
      const results = await runDatabaseDiagnostic();
      setTestResults(results);
    } catch (error) {
      setTestResults({ success: false, error: error.message });
    } finally {
      setTesting(false);
    }
  };

  const createEmergencyProfileForUser = async () => {
    if (!user?.email || !user?.id) {
      alert('No user session found');
      return;
    }
    
    setTesting(true);
    try {
      const result = await createEmergencyProfile(
        user.id, 
        user.email, 
        user.user_metadata?.name || user.email.split('@')[0],
        user.user_metadata?.mobile
      );
      
      if (result.success) {
        alert('Emergency profile created successfully! Please refresh the page.');
      } else {
        alert('Failed to create emergency profile: ' + (result.error?.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Error creating emergency profile: ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <h3 className="font-bold text-lg mb-3">Auth Debug Panel</h3>
      
      <div className="space-y-2 text-sm">
        <div><strong>User:</strong> {user ? '✅' : '❌'} {user?.email}</div>
        <div><strong>Profile:</strong> {profile ? '✅' : '❌'} {profile?.name}</div>
        <div><strong>Loading:</strong> {isLoading ? '🔄' : '✅'}</div>
        <div><strong>Admin:</strong> {isAdmin ? '✅' : '❌'}</div>
        <div><strong>Role:</strong> {profile?.role || 'N/A'}</div>
      </div>
      
      <div className="mt-4 space-y-2">
        <button
          onClick={runDatabaseTest}
          disabled={testing}
          className="w-full bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Test Database'}
        </button>
        
        <button
          onClick={runFullDiagnostic}
          disabled={testing}
          className="w-full bg-purple-500 text-white px-3 py-2 rounded text-sm hover:bg-purple-600 disabled:opacity-50"
        >
          {testing ? 'Running...' : 'Full Diagnostic'}
        </button>
        
        {user && !profile && (
          <>
            <button
              onClick={createProfile}
              disabled={testing}
              className="w-full bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 disabled:opacity-50"
            >
              Create Missing Profile
            </button>
            
            <button
              onClick={createEmergencyProfileForUser}
              disabled={testing}
              className="w-full bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 disabled:opacity-50"
            >
              Emergency Profile Fix
            </button>
          </>
        )}
      </div>
      
      {testResults && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
          <strong>Test Results:</strong>
          <pre className="mt-2 whitespace-pre-wrap">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AuthDebugger;