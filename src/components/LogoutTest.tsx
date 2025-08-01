import React from 'react';
import { LogOut } from 'lucide-react';
import { useLogout } from '../hooks/useLogout';
import { useAuth } from '../contexts/AuthContext';

/**
 * Test component for logout functionality
 * Add this to any page during development to test logout
 * Remove before production
 */
const LogoutTest: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const logout = useLogout();

  if (!user) {
    return null; // Don't show if not logged in
  }

  return (
    <div className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50">
      <div className="text-xs mb-2">
        <div>User: {user.email}</div>
        <div>Role: {isAdmin ? 'Admin' : 'User'}</div>
      </div>
      <button
        onClick={logout}
        className="flex items-center space-x-2 text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition-colors"
      >
        <LogOut className="h-4 w-4" />
        <span>Test Logout</span>
      </button>
    </div>
  );
};

export default LogoutTest;