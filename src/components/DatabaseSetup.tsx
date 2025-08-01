import React, { useState } from 'react';
import { performDatabaseHealthCheck, createProfilesTableIfNotExists, logHealthCheckResults } from '../utils/databaseHealthCheck';
import { supabase } from '../lib/supabase';

const DatabaseSetup: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const runHealthCheck = async () => {
    setLoading(true);
    setStatus('Running database health check...');

    try {
      const results = await performDatabaseHealthCheck();
      logHealthCheckResults(results);

      let statusText = '📊 Database Health Check Results:\n';
      statusText += `Profiles Table Exists: ${results.profilesTableExists ? '✅' : '❌'}\n`;
      statusText += `Can Read Profiles: ${results.canReadProfiles ? '✅' : '❌'}\n`;
      statusText += `Can Write Profiles: ${results.canWriteProfiles ? '✅' : '❌'}\n`;
      statusText += `RLS Policies Active: ${results.rlsPoliciesActive ? '✅' : '❌'}\n`;
      statusText += `Current User: ${results.currentUser ? results.currentUser.email : 'None'}\n`;

      if (results.error) {
        statusText += `\n❌ Error: ${results.error}`;
      }

      if (!results.profilesTableExists) {
        statusText += '\n\n⚠️ Profiles table does not exist. Click "Create Profiles Table" to fix this.';
      } else if (!results.canWriteProfiles) {
        statusText += '\n\n⚠️ Cannot write to profiles table. This may be due to RLS policies or permissions.';
      } else if (results.profilesTableExists && results.canReadProfiles && results.canWriteProfiles) {
        statusText += '\n\n✅ Database is healthy!';
      }

      setStatus(statusText);
    } catch (error) {
      setStatus(`❌ Error running health check: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const createProfilesTable = async () => {
    setLoading(true);
    setStatus('Creating profiles table and setting up RLS policies...');

    try {
      const result = await createProfilesTableIfNotExists();
      
      if (result.success) {
        setStatus(prev => prev + '\n✅ Profiles table created successfully!');
        setStatus(prev => prev + '\n🔄 Running health check to verify...');
        
        // Run health check to verify
        setTimeout(async () => {
          const healthCheck = await performDatabaseHealthCheck();
          if (healthCheck.profilesTableExists && healthCheck.canWriteProfiles) {
            setStatus(prev => prev + '\n✅ Database setup completed successfully!');
          } else {
            setStatus(prev => prev + '\n⚠️ Table created but there may still be issues. Check the health check results.');
          }
        }, 1000);
      } else {
        setStatus(prev => prev + `\n❌ Error creating profiles table: ${result.error}`);
      }
    } catch (error) {
      setStatus(prev => prev + `\n❌ Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const createAdminProfile = async () => {
    setLoading(true);
    setStatus('Creating admin profile...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setStatus(prev => prev + '\n❌ No authenticated user found. Please login first.');
        return;
      }

      if (user.email !== 'admin@photography.com') {
        setStatus(prev => prev + '\n❌ Current user is not the admin user.');
        return;
      }

      const adminProfile = {
        id: user.id,
        name: 'Admin User',
        email: 'admin@photography.com',
        mobile: null,
        role: 'admin' as const
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(adminProfile)
        .select();

      if (error) {
        setStatus(prev => prev + `\n❌ Error creating admin profile: ${error.message}`);
      } else {
        setStatus(prev => prev + '\n✅ Admin profile created successfully!');
        setStatus(prev => prev + '\n🔄 Refreshing page in 2 seconds...');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      setStatus(prev => prev + `\n❌ Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseConnection = async () => {
    setLoading(true);
    setStatus('Testing database connection...');

    try {
      // Test basic connection
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        if (error.message.includes('relation "public.profiles" does not exist')) {
          setStatus(prev => prev + '\n❌ Profiles table does not exist');
        } else if (error.message.includes('permission denied')) {
          setStatus(prev => prev + '\n❌ Permission denied - check RLS policies');
        } else {
          setStatus(prev => prev + `\n❌ Database error: ${error.message}`);
        }
      } else {
        setStatus(prev => prev + '\n✅ Database connection successful');
      }

      // Test auth connection
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        setStatus(prev => prev + `\n❌ Auth error: ${authError.message}`);
      } else if (user) {
        setStatus(prev => prev + `\n✅ Auth connection successful (${user.email})`);
      } else {
        setStatus(prev => prev + '\n⚠️ No authenticated user');
      }

    } catch (error) {
      setStatus(prev => prev + `\n❌ Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Database Setup & Diagnostics</h2>
      
      <div className="space-y-4">
        <button
          onClick={runHealthCheck}
          disabled={loading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Working...' : 'Run Health Check'}
        </button>

        <button
          onClick={testDatabaseConnection}
          disabled={loading}
          className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          Test Database Connection
        </button>

        <button
          onClick={createProfilesTable}
          disabled={loading}
          className="w-full bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
        >
          Create Profiles Table
        </button>

        <button
          onClick={createAdminProfile}
          disabled={loading}
          className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          Create Admin Profile
        </button>
      </div>

      {status && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-sm font-mono whitespace-pre-line max-h-96 overflow-y-auto">
          {status}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p><strong>Troubleshooting Steps:</strong></p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Run Health Check to identify issues</li>
          <li>If profiles table doesn't exist, click "Create Profiles Table"</li>
          <li>If admin profile is missing, click "Create Admin Profile"</li>
          <li>Test Database Connection to verify everything works</li>
        </ol>
      </div>
    </div>
  );
};

export default DatabaseSetup;