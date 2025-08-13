import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const ProfileDebugger: React.FC = () => {
  const { user, profile, createProfileManually, isLoading } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState('');

  const handleCreateProfile = async () => {
    setIsCreating(true);
    setMessage('');
    
    try {
      const success = await createProfileManually();
      if (success) {
        setMessage('✅ Profile created successfully!');
      } else {
        setMessage('❌ Failed to create profile. Check console for details.');
      }
    } catch (error) {
      setMessage('❌ Error creating profile: ' + (error as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  // Only show this component in development or when there's a profile issue
  if (process.env.NODE_ENV === 'production' && profile) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="text-sm font-semibold text-gray-800 mb-2">Profile Debug</h3>
      
      <div className="text-xs text-gray-600 mb-3">
        <div>User: {user ? '✅' : '❌'} {user?.email}</div>
        <div>Profile: {profile ? '✅' : '❌'} {profile?.name}</div>
        <div>Loading: {isLoading ? '⏳' : '✅'}</div>
      </div>

      {user && !profile && !isLoading && (
        <div className="mb-3">
          <button
            onClick={handleCreateProfile}
            disabled={isCreating}
            className="w-full bg-blue-600 text-white text-xs px-3 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create Profile Manually'}
          </button>
        </div>
      )}

      {message && (
        <div className={`text-xs p-2 rounded ${
          message.includes('✅') 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default ProfileDebugger;