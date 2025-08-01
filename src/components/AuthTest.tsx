import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLogout } from '../hooks/useLogout';

const AuthTest: React.FC = () => {
  const { user, profile, isLoading, isAdmin } = useAuth();
  const logout = useLogout();

  const testAdminLogin = async () => {
    // This will be handled by the login page
    window.location.href = '/login';
  };

  const testLogout = async () => {
    console.log('Testing logout...');
    await logout();
  };

  return (
    <div className="fixed bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg border z-50 max-w-xs">
      <h3 className="font-bold mb-2">Auth Test Panel</h3>
      
      <div className="text-xs space-y-1 mb-3">
        <div>Loading: {isLoading ? '🔄' : '✅'}</div>
        <div>User: {user ? '✅' : '❌'}</div>
        <div>Profile: {profile ? '✅' : '❌'}</div>
        <div>Admin: {isAdmin ? '✅' : '❌'}</div>
        {user && <div>Email: {user.email}</div>}
        {profile && <div>Role: {profile.role}</div>}
      </div>

      <div className="space-y-2">
        {!user ? (
          <button
            onClick={testAdminLogin}
            className="w-full bg-blue-500 text-white text-xs px-2 py-1 rounded"
          >
            Go to Login
          </button>
        ) : (
          <button
            onClick={testLogout}
            className="w-full bg-red-500 text-white text-xs px-2 py-1 rounded"
          >
            Test Logout
          </button>
        )}

        <div className="grid grid-cols-2 gap-1">
          <a href="/dashboard" className="bg-green-500 text-white text-xs px-2 py-1 rounded text-center">
            User
          </a>
          <a href="/admin" className="bg-purple-500 text-white text-xs px-2 py-1 rounded text-center">
            Admin
          </a>
        </div>

        <a href="/debug" className="block w-full bg-gray-500 text-white text-xs px-2 py-1 rounded text-center">
          Debug
        </a>
      </div>
    </div>
  );
};

export default AuthTest;