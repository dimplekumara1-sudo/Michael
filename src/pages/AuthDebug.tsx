import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminUserSetup from '../components/AdminUserSetup';
import DatabaseSetup from '../components/DatabaseSetup';
import LoginTest from '../components/LoginTest';
import AuthIntegrationTest from '../components/AuthIntegrationTest';

const AuthDebug: React.FC = () => {
  const { user, profile, isLoading, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Loading State */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Loading State</h2>
            <div className="space-y-2">
              <p><strong>Is Loading:</strong> {isLoading ? '✅ Yes' : '❌ No'}</p>
            </div>
          </div>

          {/* User Object */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Supabase User</h2>
            <div className="space-y-2 text-sm">
              <p><strong>User exists:</strong> {user ? '✅ Yes' : '❌ No'}</p>
              {user && (
                <>
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Created:</strong> {user.created_at}</p>
                  <p><strong>Confirmed:</strong> {user.email_confirmed_at ? '✅ Yes' : '❌ No'}</p>
                </>
              )}
            </div>
          </div>

          {/* Profile Object */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Profile Data</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Profile exists:</strong> {profile ? '✅ Yes' : '❌ No'}</p>
              {profile && (
                <>
                  <p><strong>ID:</strong> {profile.id}</p>
                  <p><strong>Name:</strong> {profile.name}</p>
                  <p><strong>Email:</strong> {profile.email}</p>
                  <p><strong>Role:</strong> {profile.role}</p>
                  <p><strong>Created:</strong> {profile.created_at}</p>
                </>
              )}
            </div>
          </div>

          {/* Admin Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Admin Status</h2>
            <div className="space-y-2">
              <p><strong>Is Admin:</strong> {isAdmin ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Expected Admin Email:</strong> admin@photography.com</p>
              <p><strong>Current Email:</strong> {user?.email || 'None'}</p>
              <p><strong>Email Match:</strong> {user?.email === 'admin@photography.com' ? '✅ Yes' : '❌ No'}</p>
            </div>
          </div>

          {/* Environment Variables */}
          <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Environment Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Supabase URL:</strong></p>
                <p className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                  {import.meta.env.VITE_SUPABASE_URL || 'Missing'}
                </p>
              </div>
              <div>
                <p><strong>Supabase Key:</strong></p>
                <p className="font-mono text-xs bg-gray-100 p-2 rounded">
                  {import.meta.env.VITE_SUPABASE_ANON_KEY ? 
                    `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...` : 
                    'Missing'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Auth Integration Testing */}
          <div className="md:col-span-2">
            <AuthIntegrationTest />
          </div>

          {/* Login Testing */}
          <div className="md:col-span-2">
            <LoginTest />
          </div>

          {/* Database Setup */}
          <div className="md:col-span-2">
            <DatabaseSetup />
          </div>

          {/* Admin User Setup */}
          <div className="md:col-span-2">
            <AdminUserSetup />
          </div>

          {/* Actions */}
          <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="flex space-x-4">
              <a 
                href="/login" 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Go to Login
              </a>
              <a 
                href="/admin" 
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Try Admin Dashboard
              </a>
              <a 
                href="/" 
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Go to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthDebug;