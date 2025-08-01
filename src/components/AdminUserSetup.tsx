import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, db } from '../lib/supabase';
import ProfileService from '../services/profileService';

const AdminUserSetup: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const createAdminUser = async () => {
    setLoading(true);
    setStatus('Creating admin user...');

    try {
      // Try to sign up the admin user
      const { data, error } = await supabase.auth.signUp({
        email: 'admin@photography.com',
        password: 'admin123',
        options: {
          data: {
            name: 'Admin'
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setStatus('✅ Admin user already exists. Trying to login...');
          await testAdminLogin();
        } else {
          setStatus(`❌ Error creating admin user: ${error.message}`);
        }
      } else if (data.user) {
        setStatus('✅ Admin user created successfully! Trying to login...');
        await testAdminLogin();
      } else {
        setStatus('❌ Unknown error creating admin user');
      }
    } catch (error) {
      setStatus(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testAdminLogin = async () => {
    setStatus(prev => prev + '\n🔐 Testing admin login...');
    
    try {
      const success = await login('admin@photography.com', 'admin123');
      if (success) {
        setStatus(prev => prev + '\n✅ Admin login successful!');
        setTimeout(() => {
          window.location.href = '/admin';
        }, 2000);
      } else {
        setStatus(prev => prev + '\n❌ Admin login failed');
      }
    } catch (error) {
      setStatus(prev => prev + `\n❌ Login error: ${error.message}`);
    }
  };

  const checkAdminStatus = async () => {
    setLoading(true);
    setStatus('Checking admin user status...');

    try {
      // Check if admin user exists
      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        setStatus(`❌ Cannot check users: ${error.message}`);
      } else {
        const adminUser = users?.find(user => user.email === 'admin@photography.com');
        if (adminUser) {
          setStatus(`✅ Admin user exists!\nID: ${adminUser.id}\nEmail: ${adminUser.email}\nConfirmed: ${adminUser.email_confirmed_at ? 'Yes' : 'No'}`);
        } else {
          setStatus('❌ Admin user not found in database');
        }
      }
    } catch (error) {
      setStatus(`❌ Error checking status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fixAdminProfile = async () => {
    setLoading(true);
    setStatus('Fixing admin profile using unified service...');

    try {
      const result = await ProfileService.fixAdminProfile();
      
      if (result.success) {
        setStatus(prev => prev + '\n✅ Admin profile fixed successfully!');
        setStatus(prev => prev + '\n🔄 Refreshing page in 2 seconds...');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setStatus(prev => prev + `\n❌ Error fixing admin profile: ${result.error?.message || 'Unknown error'}`);
      }

    } catch (error) {
      setStatus(prev => prev + `\n❌ Unexpected error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkSyncStatus = async () => {
    setLoading(true);
    setStatus('Checking auth-profile sync status...');

    try {
      const { data, error } = await ProfileService.checkSyncStatus();
      
      if (error) {
        setStatus(prev => prev + `\n❌ Error checking sync status: ${error.message}`);
      } else if (data && data.length > 0) {
        const syncData = data[0];
        setStatus(prev => prev + `\n📊 Sync Status:
Auth Users: ${syncData.auth_users_count}
Profiles: ${syncData.profiles_count}
Missing Profiles: ${syncData.missing_profiles}
Orphaned Profiles: ${syncData.orphaned_profiles}`);
        
        if (syncData.missing_profiles > 0 || syncData.orphaned_profiles > 0) {
          setStatus(prev => prev + '\n⚠️ Sync issues detected! Consider running the migration script.');
        } else {
          setStatus(prev => prev + '\n✅ Auth and profiles are in sync!');
        }
      }

    } catch (error) {
      setStatus(prev => prev + `\n❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Admin User Setup</h2>
      
      <div className="space-y-4">
        <button
          onClick={createAdminUser}
          disabled={loading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Working...' : 'Create Admin User'}
        </button>

        <button
          onClick={testAdminLogin}
          disabled={loading}
          className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          Test Admin Login
        </button>

        <button
          onClick={checkAdminStatus}
          disabled={loading}
          className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
        >
          Check Admin Status
        </button>

        <button
          onClick={fixAdminProfile}
          disabled={loading}
          className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          Fix Admin Profile
        </button>

        <button
          onClick={checkSyncStatus}
          disabled={loading}
          className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          Check Sync Status
        </button>
      </div>

      {status && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-sm font-mono whitespace-pre-line">
          {status}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p><strong>Admin Credentials:</strong></p>
        <p>Email: admin@photography.com</p>
        <p>Password: admin123</p>
      </div>
    </div>
  );
};

export default AdminUserSetup;