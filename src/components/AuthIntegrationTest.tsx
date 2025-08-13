import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthIntegrationTest: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testIntegratedSystem = async () => {
    setLoading(true);
    setStatus('Testing integrated auth system...');

    try {
      // Test 1: Check if triggers exist
      setStatus(prev => prev + '\n🔍 Step 1: Checking database triggers...');
      
      const { data: triggers, error: triggerError } = await supabase
        .from('information_schema.triggers')
        .select('trigger_name, event_manipulation, action_timing')
        .like('trigger_name', 'on_auth_user%');

      if (triggerError) {
        setStatus(prev => prev + `\n❌ Could not check triggers: ${triggerError.message}`);
      } else {
        const triggerNames = triggers?.map(t => t.trigger_name) || [];
        setStatus(prev => prev + `\n✅ Found triggers: ${triggerNames.join(', ')}`);
        
        const expectedTriggers = ['on_auth_user_created', 'on_auth_user_updated', 'on_auth_user_deleted'];
        const missingTriggers = expectedTriggers.filter(t => !triggerNames.includes(t));
        
        if (missingTriggers.length > 0) {
          setStatus(prev => prev + `\n⚠️  Missing triggers: ${missingTriggers.join(', ')}`);
        }
      }

      // Test 2: Check sync status
      setStatus(prev => prev + '\n\n🔍 Step 2: Checking auth-profile sync status...');
      
      const { data: syncData, error: syncError } = await supabase.rpc('check_auth_profile_sync');
      
      if (syncError) {
        setStatus(prev => prev + `\n❌ Sync check failed: ${syncError.message}`);
      } else if (syncData && syncData.length > 0) {
        const sync = syncData[0];
        setStatus(prev => prev + `\n📊 Sync Status:
   Auth Users: ${sync.auth_users_count}
   Profiles: ${sync.profiles_count}
   Missing Profiles: ${sync.missing_profiles}
   Orphaned Profiles: ${sync.orphaned_profiles}`);
        
        if (sync.missing_profiles === 0 && sync.orphaned_profiles === 0) {
          setStatus(prev => prev + '\n✅ Perfect sync!');
        } else {
          setStatus(prev => prev + '\n⚠️  Sync issues detected');
        }
      }

      // Test 3: Check admin profile
      setStatus(prev => prev + '\n\n🔍 Step 3: Checking admin profile...');
      
      const { data: adminProfile, error: adminError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'admin@photography.com')
        .single();

      if (adminError) {
        setStatus(prev => prev + `\n❌ Admin profile not found: ${adminError.message}`);
      } else if (adminProfile) {
        setStatus(prev => prev + `\n✅ Admin profile found:
   Name: ${adminProfile.name}
   Email: ${adminProfile.email}
   Role: ${adminProfile.role}
   Created: ${new Date(adminProfile.created_at).toLocaleString()}`);
        
        if (adminProfile.name === 'Micheal' && adminProfile.role === 'admin') {
          setStatus(prev => prev + '\n✅ Admin profile is correctly configured!');
        } else {
          setStatus(prev => prev + '\n⚠️  Admin profile has incorrect data');
        }
      }

      // Test 4: Test login functionality
      setStatus(prev => prev + '\n\n🔍 Step 4: Testing login functionality...');
      
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'admin@photography.com',
        password: 'admin123'
      });

      if (loginError) {
        setStatus(prev => prev + `\n❌ Login test failed: ${loginError.message}`);
      } else if (loginData.user) {
        setStatus(prev => prev + '\n✅ Login test successful!');
        setStatus(prev => prev + `\n   User ID: ${loginData.user.id}`);
        setStatus(prev => prev + `\n   Email: ${loginData.user.email}`);
        
        // Check if profile was accessible during login
        const { data: loginProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', loginData.user.id)
          .single();

        if (profileError) {
          setStatus(prev => prev + `\n❌ Could not access profile during login: ${profileError.message}`);
        } else {
          setStatus(prev => prev + `\n✅ Profile accessible during login: ${loginProfile.name}`);
        }

        // Sign out after test
        await supabase.auth.signOut();
        setStatus(prev => prev + '\n✅ Test session closed');
      }

      // Test 5: Test user registration flow
      setStatus(prev => prev + '\n\n🔍 Step 5: Testing registration flow...');
      
      const testEmail = `test-${Date.now()}@example.com`;
      const { data: regData, error: regError } = await supabase.auth.signUp({
        email: testEmail,
        password: 'testpass123',
        options: {
          data: {
            name: 'Test User',
            full_name: 'Test User'
          }
        }
      });

      if (regError) {
        setStatus(prev => prev + `\n❌ Registration test failed: ${regError.message}`);
      } else if (regData.user) {
        setStatus(prev => prev + '\n✅ Registration test successful!');
        
        // Wait a moment for triggers to execute
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if profile was created by triggers
        const { data: testProfile, error: testProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', regData.user.id)
          .single();

        if (testProfileError) {
          setStatus(prev => prev + `\n⚠️  Profile not created by triggers: ${testProfileError.message}`);
        } else {
          setStatus(prev => prev + `\n✅ Profile created automatically by triggers!`);
          setStatus(prev => prev + `\n   Name: ${testProfile.name}`);
          setStatus(prev => prev + `\n   Role: ${testProfile.role}`);
        }

        // Clean up test user
        try {
          await supabase.auth.admin.deleteUser(regData.user.id);
          setStatus(prev => prev + '\n🧹 Test user cleaned up');
        } catch (cleanupError) {
          setStatus(prev => prev + '\n⚠️  Could not clean up test user');
        }
      }

      setStatus(prev => prev + '\n\n🎉 Integration test completed!');

    } catch (error) {
      setStatus(prev => prev + `\n💥 Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const createMichealAdmin = async () => {
    setLoading(true);
    setStatus('Creating Micheal admin user...');

    try {
      // Check if admin already exists
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const adminExists = existingUser?.users?.find(u => u.email === 'admin@photography.com');

      if (adminExists) {
        setStatus(prev => prev + '\n✅ Admin user already exists');
        setStatus(prev => prev + `\n   User ID: ${adminExists.id}`);
        
        // Check profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', adminExists.id)
          .single();

        if (profile) {
          setStatus(prev => prev + `\n✅ Profile exists: ${profile.name} (${profile.role})`);
        } else {
          setStatus(prev => prev + '\n⚠️  Profile missing, triggering sync...');
          
          // Trigger manual sync
          const { error: syncError } = await supabase.rpc('sync_user_profile', {
            user_id: adminExists.id
          });

          if (syncError) {
            setStatus(prev => prev + `\n❌ Manual sync failed: ${syncError.message}`);
          } else {
            setStatus(prev => prev + '\n✅ Manual sync completed');
          }
        }
      } else {
        // Create new admin user
        setStatus(prev => prev + '\n🔧 Creating new admin user...');
        
        const { data, error } = await supabase.auth.admin.createUser({
          email: 'admin@photography.com',
          password: 'admin123',
          email_confirm: true,
          user_metadata: {
            name: 'Micheal',
            full_name: 'Micheal'
          }
        });

        if (error) {
          setStatus(prev => prev + `\n❌ Failed to create admin user: ${error.message}`);
        } else {
          setStatus(prev => prev + '\n✅ Admin user created successfully!');
          setStatus(prev => prev + `\n   User ID: ${data.user?.id}`);
          
          // Wait for triggers to execute
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check if profile was created
          const { data: newProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user?.id)
            .single();

          if (newProfile) {
            setStatus(prev => prev + `\n✅ Profile created by triggers: ${newProfile.name} (${newProfile.role})`);
          } else {
            setStatus(prev => prev + '\n⚠️  Profile not created, triggers may not be working');
          }
        }
      }

      setStatus(prev => prev + '\n\n✅ Micheal admin setup completed!');
      setStatus(prev => prev + '\n📝 Credentials: admin@photography.com / admin123');

    } catch (error) {
      setStatus(prev => prev + `\n💥 Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const runSyncCheck = async () => {
    setLoading(true);
    setStatus('Running comprehensive sync check...');

    try {
      const { data, error } = await supabase.rpc('check_auth_profile_sync');
      
      if (error) {
        setStatus(prev => prev + `\n❌ Sync check failed: ${error.message}`);
      } else if (data && data.length > 0) {
        const sync = data[0];
        setStatus(prev => prev + `\n📊 Detailed Sync Report:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Statistics:
   • Auth Users: ${sync.auth_users_count}
   • Profiles: ${sync.profiles_count}
   • Missing Profiles: ${sync.missing_profiles}
   • Orphaned Profiles: ${sync.orphaned_profiles}

🎯 Status: ${sync.missing_profiles === 0 && sync.orphaned_profiles === 0 ? 'PERFECT SYNC ✅' : 'SYNC ISSUES DETECTED ⚠️'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        if (sync.missing_profiles > 0) {
          setStatus(prev => prev + `\n\n🔧 Recommendation: Run manual sync for missing profiles`);
        }
        
        if (sync.orphaned_profiles > 0) {
          setStatus(prev => prev + `\n\n🧹 Recommendation: Clean up orphaned profiles`);
        }
      }

    } catch (error) {
      setStatus(prev => prev + `\n💥 Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">🔄 Auth Integration Testing</h2>
      
      <div className="space-y-4">
        <button
          onClick={testIntegratedSystem}
          disabled={loading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          🧪 Run Complete Integration Test
        </button>

        <button
          onClick={createMichealAdmin}
          disabled={loading}
          className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          👤 Create/Verify Micheal Admin
        </button>

        <button
          onClick={runSyncCheck}
          disabled={loading}
          className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          📊 Run Sync Status Check
        </button>
      </div>

      {status && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-sm font-mono whitespace-pre-line max-h-96 overflow-y-auto">
          {status}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p><strong>Integration Test Checklist:</strong></p>
        <ol className="list-decimal list-inside space-y-1">
          <li>✅ Database triggers installed and working</li>
          <li>✅ Auth-profile sync is perfect (0 missing, 0 orphaned)</li>
          <li>✅ Admin profile exists with name "Micheal" and role "admin"</li>
          <li>✅ Login functionality works correctly</li>
          <li>✅ Registration automatically creates profiles</li>
        </ol>
      </div>
    </div>
  );
};

export default AuthIntegrationTest;